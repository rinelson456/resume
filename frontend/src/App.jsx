import { useState, useRef } from 'react';
import axios from 'axios';
//import html2pdf from 'html2pdf.js';

export default function App() {
  const [resume, setResume] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [optimization, setOptimization] = useState(null);
  const [coverLetter, setCoverLetter] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadedResumes, setUploadedResumes] = useState([]);

  const reportRef = useRef();

  const handleFileChange = (e) => {
    setResume(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resume || !jobDescription) {
      alert('Please upload a resume and enter a job description.');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('resume', resume);
    formData.append('jobDescription', jobDescription);

    try {
      const response = await axios.post('http://localhost:5000/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const { analysis, optimization, coverLetter } = response.data;
      setAnalysis(analysis);
      setOptimization(optimization);
      setCoverLetter(coverLetter);

      // Save uploaded resume in dashboard state
      setUploadedResumes(prev => [...prev, { name: resume.name, analysis, optimization, coverLetter }]);
    } catch (error) {
      console.error('Error uploading resume:', error);
      alert('Failed to process resume. Please try again.');
    }
    setLoading(false);
  };

  const handleExport = () => {
    const element = reportRef.current;
    const opt = {
      margin:       1,
      filename:     'resume_analysis.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    window.html2pdf().set(opt).from(element).save();
  };

  const handleStripeCheckout = async () => {
    // Replace this with actual Stripe checkout call
    alert('Redirecting to Stripe Checkout...');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4">Resume Analyzer</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="file" onChange={handleFileChange} className="w-full p-2 border rounded" />
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste job description here..."
            className="w-full p-2 border rounded h-24"
          />
          <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
            {loading ? 'Processing...' : 'Analyze Resume'}
          </button>
        </form>

        <button
          onClick={handleStripeCheckout}
          className="mt-4 w-full bg-purple-500 text-white p-2 rounded hover:bg-purple-600"
        >
          Upgrade with Stripe
        </button>

        {(analysis || optimization || coverLetter) && (
          <div className="mt-4 p-4 bg-gray-100 border border-gray-400 rounded" ref={reportRef}>
            {analysis && (
              <div className="mb-2">
                <h2 className="font-semibold">Analysis Result:</h2>
                <p>{analysis}</p>
              </div>
            )}
            {optimization && (
              <div className="mb-2">
                <h2 className="font-semibold">Optimization Suggestions:</h2>
                <p>{optimization}</p>
              </div>
            )}
            {coverLetter && (
              <div>
                <h2 className="font-semibold">Generated Cover Letter:</h2>
                <p>{coverLetter}</p>
              </div>
            )}
            <button
              onClick={handleExport}
              className="mt-4 w-full bg-green-500 text-white p-2 rounded hover:bg-green-600"
            >
              Export as PDF
            </button>
          </div>
        )}

        {uploadedResumes.length > 0 && (
          <div className="mt-6">
            <h2 className="text-lg font-bold mb-2">Your Uploaded Resumes</h2>
            <ul className="space-y-2">
              {uploadedResumes.map((item, index) => (
                <li key={index} className="p-2 border rounded bg-white">
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm text-gray-600">Analysis: {item.analysis.slice(0, 100)}...</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}