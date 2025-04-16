import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

export default function ResumeAnalyzer() {
  const [resume, setResume] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [suggestions, setSuggestions] = useState('');
  const [modifiedResume, setModifiedResume] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const userId = 'demo-user-123'; // 🔐 Replace with real auth-based userId when available

  const handleAnalyze = async () => {
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

  const handleSubscribe = async () => {
    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
      });
      const data = await response.json();
      window.location.href = data.checkoutUrl;
    } catch (error) {
      console.error('Subscription error:', error);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-center">Resume Analyzer</h1>

      <Card>
        <CardContent className="space-y-4 p-4">
          <div>
            <label className="block font-medium mb-1">Paste Your Resume</label>
            <ReactQuill
              value={resume}
              onChange={setResume}
              theme="snow"
              className="bg-white rounded-xl"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Paste Job Description</label>
            <ReactQuill
              value={jobDescription}
              onChange={setJobDescription}
              theme="snow"
            />
          </div>
          <Button onClick={handleAnalyze} disabled={loading}>
            {loading ? <Loader2 className="animate-spin mr-2" /> : null}
            Analyze Resume
          </Button>
        </CardContent>
      </Card>

      {suggestions && (
        <Card>
          <CardContent className="p-4">
            <h2 className="text-xl font-semibold mb-2">Suggestions</h2>
            <p className="whitespace-pre-wrap">{suggestions}</p>
          </CardContent>
        </Card>
      )}

      {modifiedResume && (
        isSubscribed ? (
          <Card>
            <CardContent className="p-4">
              <h2 className="text-xl font-semibold mb-2">Modified Resume</h2>
              <Textarea rows={10} value={modifiedResume} readOnly />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-4 space-y-4">
              <p>Subscribe to unlock your optimized resume.</p>
              <Button onClick={handleSubscribe}>Subscribe with Stripe</Button>
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
}