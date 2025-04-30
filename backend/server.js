require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const axios = require('axios');
const { OpenAI } = require('openai');
const admin = require('firebase-admin');
const path = require('path');
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const serviceAccount = require('C:\\Users\\Admin\\Desktop\\Financial Freedom this way\\Resume App\\backend\\resume-8e8d3-firebase-adminsdk-fbsvc-2dc4dc6fd9.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const app = express();
const port = process.env.PORT || 5000;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(cors());
app.use(bodyParser.json());

// Analyze Resume Endpoint
app.post('/api/analyze', async (req, res) => {
  console.log('🔍 /api/analyze hit');
  const { resume, jobDescription, userId } = req.body;

  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    const isSubscribed = userDoc.exists ? userDoc.data().subscribed : false;
    console.log('User subscription status:', isSubscribed);

    const prompt = `Compare the following resume to the job description and provide actionable suggestions for improvement.\nFormat your response using numbered bullet points, with each point clearly describing a suggestion on how to better align the resume with the job description.\n\nResume:\n${resume}\n\nJob Description:\n${jobDescription}\n\nThen include a rewritten version of the resume prefaced with "Modified Resume:"`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const output = completion.choices[0].message.content;
    const [suggestions, modifiedResume] = output.split('Modified Resume:');

    res.json({
      suggestions: suggestions?.trim() || '',
      modifiedResume: isSubscribed ? (modifiedResume?.trim() || '') : '',
    });
  } catch (error) {
    console.error('Error analyzing resume:', error);
    res.status(500).json({ error: 'Failed to analyze resume' });
  }
});

// Firebase token verification middleware
const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying Firebase token:', error);
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

// Stripe Subscription Checkout
app.post('/api/subscribe', verifyToken, async (req, res) => {
  const { userId, resume, jobDescription } = req.body;

  const truncatedResume = resume.length > 500 ? resume.slice(0, 500) : resume;
  const truncatedJobDescription = jobDescription.length > 500 ? jobDescription.slice(0, 500) : jobDescription;

  try {
    console.log("Received subscription request", { userId, truncatedResume, truncatedJobDescription });

    const resumeHash = encodeURIComponent(Buffer.from(truncatedResume).toString('base64'));
    const firebaseUserId = req.user.uid;

    if (firebaseUserId !== userId) {
      return res.status(401).json({ error: 'User ID mismatch' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL}/?success=true&resumeHash=${resumeHash}&userId=${userId}`,
      cancel_url: `${process.env.FRONTEND_URL}/?canceled=true`,
      metadata: {
        userId,
        resume: truncatedResume,
        jobDescription: truncatedJobDescription,
      },
    });

    console.log("Stripe session created:", session);
    res.json({ checkoutUrl: session.url });
  } catch (error) {
    console.error("Error during subscription:", error);
    res.status(500).json({ error: 'Subscription failed', details: error.message });
  }
});

// Check subscription status
app.get('/api/subscription-status/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ isSubscribed: userDoc.exists ? userDoc.data().subscribed : false });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch subscription status' });
  }
});

// Stripe Webhook Handler
app.post('/webhook', express.raw({ type: 'application/json' }), async (request, response) => {
  const sig = request.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(request.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error(`Webhook error: ${err.message}`);
    return response.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const customerId = session.customer;
    const userId = session.metadata.userId;

    try {
      await db.collection('users').doc(userId).set({
        stripeCustomerId: customerId,
        subscribed: true,
      }, { merge: true });

      console.log(`User ${userId} subscribed (customer ${customerId})`);
    } catch (err) {
      console.error('Failed to update subscription status in Firestore:', err);
    }
  }

  response.status(200).send();
});

// Generic error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});