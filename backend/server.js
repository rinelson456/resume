require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const axios = require('axios');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

let mockSubscribedUsers = new Set(); // Simulated user subscription tracking

// Analyze resume using Replicate's LLaMA model
app.post('/api/analyze', async (req, res) => {
  const { resume, jobDescription, userId } = req.body;
  try {
    const response = await axios.post(
      'https://api.replicate.com/v1/predictions',
      {
        version: process.env.REPLICATE_MODEL_VERSION,
        input: {
          prompt: `Compare the following resume to this job description.\n\nResume:\n${resume}\n\nJob Description:\n${jobDescription}\n\nProvide bullet-pointed suggestions for improvement. Then, if requested and the user is subscribed, rewrite the resume accordingly.`,
        },
      },
      {
        headers: {
          Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const predictionId = response.data.id;
    let predictionResult = null;

    // Poll for result completion
    while (!predictionResult || predictionResult.status !== 'succeeded') {
      const result = await axios.get(
        `https://api.replicate.com/v1/predictions/${predictionId}`,
        {
          headers: {
            Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
          },
        }
      );
      predictionResult = result.data;

      if (predictionResult.status === 'failed') {
        throw new Error('Prediction failed.');
      }
      if (predictionResult.status !== 'succeeded') {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    const output = predictionResult.output.join('\n');
    const [suggestions, modifiedResume] = output.split('Modified Resume:');

    const isSubscribed = mockSubscribedUsers.has(userId);

    res.json({
      suggestions: suggestions?.trim() || '',
      modifiedResume: isSubscribed ? (modifiedResume?.trim() || '') : '',
    });
  } catch (error) {
    console.error('Error analyzing resume:', error);
    res.status(500).json({ error: 'Failed to analyze resume' });
  }
});

// Stripe checkout session endpoint
app.post('/api/subscribe', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL}?success=true`,
      cancel_url: `${process.env.FRONTEND_URL}?canceled=true`,
    });
    res.json({ checkoutUrl: session.url });
  } catch (error) {
    console.error('Stripe subscription error:', error);
    res.status(500).json({ error: 'Subscription failed' });
  }
});

// Simulated endpoint to check subscription (in real app, use auth + Stripe customer data)
app.get('/api/subscription-status/:userId', (req, res) => {
  const { userId } = req.params;
  const isSubscribed = mockSubscribedUsers.has(userId);
  res.json({ isSubscribed });
});

// Mock success webhook to simulate user becoming subscribed
app.post('/api/mock-subscribe/:userId', (req, res) => {
  const { userId } = req.params;
  mockSubscribedUsers.add(userId);
  res.json({ success: true });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});