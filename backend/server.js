require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const OpenAI = require('openai');
const path = require('path');

const app = express();
const port = process.env.PORT || 5000;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

app.post('/analyze', upload.single('resume'), async (req, res) => {
    try {
        const { jobDescription } = req.body;
        if (!req.file) {
            return res.status(400).json({ error: 'No resume uploaded.' });
        }

        // Read the resume file
        const resumeText = fs.readFileSync(req.file.path, 'utf-8');
        
        // Generate AI-based resume analysis
        const analysisPrompt = `Analyze the following resume and compare it to the provided job description. Identify strengths, weaknesses, and suggest improvements.
        
        Resume:
        ${resumeText}
        
        Job Description:
        ${jobDescription}`;
        
        const analysisResponse = await openai.completions.create({
            model: 'gpt-4',
            prompt: analysisPrompt,
            max_tokens: 300
        });

        // Generate AI-based resume optimization suggestions
        const optimizationPrompt = `Provide resume optimization suggestions based on the job description provided.
        
        Resume:
        ${resumeText}
        
        Job Description:
        ${jobDescription}`;
        
        const optimizationResponse = await openai.completions.create({
            model: 'gpt-4',
            prompt: optimizationPrompt,
            max_tokens: 300
        });

        // Generate AI-based cover letter
        const coverLetterPrompt = `Generate a professional cover letter for the following job description, incorporating details from the provided resume:
        
        Resume:
        ${resumeText}
        
        Job Description:
        ${jobDescription}`;
        
        const coverLetterResponse = await openai.completions.create({
            model: 'gpt-4',
            prompt: coverLetterPrompt,
            max_tokens: 300
        });

        // Delete the uploaded file after processing
        fs.unlinkSync(req.file.path);

        res.json({
            analysis: analysisResponse.choices[0].text.trim(),
            optimization: optimizationResponse.choices[0].text.trim(),
            coverLetter: coverLetterResponse.choices[0].text.trim()
        });
    } catch (error) {
        console.error('Error processing resume:', error);
        res.status(500).json({ error: 'Failed to process resume.' });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
