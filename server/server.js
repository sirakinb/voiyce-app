const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});


const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Configure Multer for audio uploads
// We'll store them in 'uploads/' just to be safe, though not strictly needed for mock.
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = 'uploads';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// POST /transcribe
app.post('/transcribe', upload.single('audio'), async (req, res) => {
    console.log("Received audio file:", req.file);

    if (!req.file) {
        return res.status(400).json({ error: "No audio file provided" });
    }

    // --- REAL OPENAI WHISPER & LLM LOGIC ---
    try {
        // 1. Transcribe with Whisper
        const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(req.file.path),
            model: "whisper-1",
        });

        const rawText = transcription.text;
        console.log("Raw Transcription:", rawText);

        // 2. Restructure/Refine with LLM (GPT-4o)
        // Handle empty or unclear transcriptions, never make up text
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `You are a helpful assistant that cleans up voice transcriptions. Your rules:
1. ONLY output text that was actually spoken. NEVER add, invent, or make up any content.
2. Fix punctuation and grammar while preserving the original meaning exactly.
3. If the transcription is empty, contains only noise words (like "um", "uh"), or is completely unintelligible, respond with EXACTLY: "Sorry, I didn't catch that. Could you please repeat?"
4. If the user appears to be dictating a list or code, format it accordingly.
5. Do not add conversational filler or explanations. Just output the cleaned text or the repeat request.`
                },
                { role: "user", content: rawText || "" }
            ],
        });

        const structuredText = completion.choices[0].message.content;
        console.log("Refined Text:", structuredText);

        // Cleanup file
        fs.unlink(req.file.path, (err) => {
            if (err) console.error("Failed to delete temp file:", err);
        });

        res.json({ text: structuredText });

    } catch (error) {
        console.error("OpenAI API Error:", error);

        // Attempt cleanup even on error
        if (fs.existsSync(req.file.path)) {
            fs.unlink(req.file.path, () => { });
        }

        res.status(500).json({ error: "Transcription failed", details: error.message });
    }
});

// POST /summarize
app.post('/summarize', async (req, res) => {
    const { text } = req.body;

    if (!text) {
        return res.status(400).json({ error: "No text provided" });
    }

    console.log("Summarizing text:", text);

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: "You are my personal assistant. You are summarizing MY thoughts. When summarizing, ALWAYS use the first person ('I', 'my'). Do not say 'the speaker' or 'the user'. Summarize the text as if YOU are the one who spoke it. Keep it concise."
                },
                { role: "user", content: text }
            ],
        });

        const summary = completion.choices[0].message.content;
        console.log("Summary:", summary);

        res.json({ text: summary });

    } catch (error) {
        console.error("OpenAI API Error:", error);
        res.status(500).json({ error: "Summarization failed", details: error.message });
    }
});

app.listen(port, () => {
    console.log(`Voiyce Backend running at http://localhost:${port}`);
});
