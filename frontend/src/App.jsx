import { useState } from 'react';
import axios from 'axios';

export default function App() {
  const [resume, setResume] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [optimization, setOptimization] = useState(null);
  const [coverLetter, setCoverLetter] = useState(null);
  const [loading, setLoading] = useState(false);

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
      setAnalysis(response.data.analysis);
      setOptimization(response.data.optimization);
      setCoverLetter(response.data.coverLetter);
    } catch (error) {
      console.error('Error uploading resume:', error);
      alert('Failed to process resume. Please try again.');
    }
    setLoading(false);
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
        {analysis && (
          <div className="mt-4 p-4 bg-green-100 border border-green-500 rounded">
            <h2 className="font-semibold">Analysis Result:</h2>
            <p>{analysis}</p>
          </div>
        )}
        {optimization && (
          <div className="mt-4 p-4 bg-yellow-100 border border-yellow-500 rounded">
            <h2 className="font-semibold">Optimization Suggestions:</h2>
            <p>{optimization}</p>
          </div>
        )}
        {coverLetter && (
          <div className="mt-4 p-4 bg-blue-100 border border-blue-500 rounded">
            <h2 className="font-semibold">Generated Cover Letter:</h2>
            <p>{coverLetter}</p>
          </div>
        )}
      </div>
    </div>
  );
}