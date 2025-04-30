import React, { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { initializeApp } from 'firebase/app';

// Initialize Firebase with your configuration (Make sure you have your firebase config object)
const firebaseConfig = {
  apiKey: "AIzaSyCexXySOwPXviok1VVV1T9qUg4gAfZcbSc",
  authDomain: "resume-8e8d3.firebaseapp.com",
  projectId: "resume-8e8d3",
  storageBucket: "resume-8e8d3.firebasestorage.app",
  messagingSenderId: "17059196532",
  appId: "1:17059196532:web:4dea07509296ec246d6b21",
  measurementId: "G-TXMF2GZVMN"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };

export default function ResumeAnalyzer() {
  const [resume, setResume] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [suggestions, setSuggestions] = useState('');
  const [modifiedResume, setModifiedResume] = useState('');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const [user, setUser] = useState(null);

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
    setUser(currentUser);
  });

  return () => unsubscribe(); // Clean up listener on unmount
}, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const userId = urlParams.get('userId');
  
    if (success && userId) {
      const storedResume = localStorage.getItem('resume');
      const storedJobDescription = localStorage.getItem('jobDescription');
  
      if (storedResume && storedJobDescription) {
        // You can now display a success message or re-run analysis with this data
        console.log('Resume:', storedResume);
        console.log('Job Description:', storedJobDescription);
  
        // Optionally, clear localStorage now
        localStorage.removeItem('resume');
        localStorage.removeItem('jobDescription');
      }
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid); // Sets the authenticated user's UID
      } else {
        setUserId(null); // User signed out or not logged in
      }
    });
  
    return () => unsubscribe(); // Clean up the listener on unmount
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
  
    if (success) {
      const storedResume = localStorage.getItem('resume');
      const storedJobDescription = localStorage.getItem('jobDescription');
  
      if (storedResume && storedJobDescription) {
        setResume(storedResume);
        setJobDescription(storedJobDescription);
  
        // After setting state, analyze after a slight delay to ensure state is updated
        setTimeout(() => {
          handleAnalyze(true);
        }, 300);
      }
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const paidHash = params.get('resumeHash');
    const userFromParams = params.get('userId');
    if (success && paidHash && userFromParams === userId) {
      handleAnalyze(true);
    }
  }, [userId]);

  const handleAnalyze = async (skipCheck = false) => {
    setLoading(true);
    setSuggestions('');
    setModifiedResume('');
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume, jobDescription, userId }),
      });
      const data = await response.json();
      setSuggestions(data.suggestions);
      setModifiedResume(data.modifiedResume);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    try {
      if (!user) {
        console.error('User not logged in');
        return;
      }
  
      // Save resume and job description locally
      localStorage.setItem('resume', resume);
      localStorage.setItem('jobDescription', jobDescription);
  
      const token = await user.getIdToken();
  
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user.uid,
          resume,
          jobDescription,
        }),
      });
  
      const data = await response.json();
  
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        console.error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Checkout error:', error);
    }
  };
  

  const handleAuth = async () => {
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error) {
      console.error('Authentication error:', error);
    }
  };

  const handleSignOut = () => signOut(auth);

  if (!userId) {
    return (
      <div className="max-w-md mx-auto p-6 space-y-4">
        <h2 className="text-2xl font-bold text-center">{isRegistering ? 'Sign Up' : 'Log In'}</h2>
        <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button onClick={handleAuth}>{isRegistering ? 'Create Account' : 'Login'}</Button>
        <p className="text-center text-sm">
          {isRegistering ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button className="text-blue-600 underline" onClick={() => setIsRegistering(!isRegistering)}>
            {isRegistering ? 'Log in' : 'Sign up'}
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">ResuMe AI</h1>
        <Button onClick={handleSignOut}>Sign Out</Button>
      </div>

      <div className="input-grid">
        <Card className="input-card">
          <CardContent className="space-y-4 p-4">
            <label className="block font-medium mb-1">Paste Your Resume</label>
            <ReactQuill
              value={resume}
              onChange={setResume}
              theme="snow"
              className="bg-white rounded-xl"
            />
          </CardContent>
        </Card>

        <Card className="input-card">
          <CardContent className="space-y-4 p-4">
            <label className="block font-medium mb-1">Paste Job Description</label>
            <ReactQuill
              value={jobDescription}
              onChange={setJobDescription}
              theme="snow"
            />
          </CardContent>
        </Card>
      </div>

      <div className="text-center">
        <Button onClick={() => handleAnalyze()} disabled={loading}>
          {loading ? <Loader2 className="animate-spin mr-2" /> : null}
          Analyze Resume
        </Button>
      </div>

      {suggestions && (
      <Card>
        <CardContent className="p-4 space-y-4">
          <h2 className="text-xl font-semibold mb-2">Suggestions</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-800">
          {suggestions
            .split(/\\d+\\.\\s+/) // split on numbered bullets like "1. "
            .filter(line => line.trim().length > 0)
            .map((suggestion, index) => (
              <li key={index}>{suggestion.trim()}</li>
          ))}
          </ul>
        </CardContent>
      </Card>
      )}

      {modifiedResume ? (
        <Card>
          <CardContent className="p-4">
            <h2 className="text-xl font-semibold mb-2">Modified Resume</h2>
            <Textarea rows={10} value={modifiedResume} readOnly />
          </CardContent>
        </Card>
      ) : (
        suggestions && (
          <Card>
            <CardContent className="p-4 space-y-4">
              <p>To unlock your optimized resume, please subscribe to ResuMe AI.</p>
              <Button onClick={handleCheckout}>Subscribe with Stripe</Button>
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
}