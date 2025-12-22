import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export const processVoiceCommand = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No audio file provided" });
        }

        const audioPath = req.file.path;

        // 1. Transcribe audio using Whisper
        let userText = "";
        try {
            console.log(`[Voice] Starting transcription for ${audioPath}`);
            const transcription = await openai.audio.transcriptions.create({
                file: fs.createReadStream(audioPath),
                model: "whisper-1",
            });
            userText = transcription.text;
            console.log(`[Voice] Transcribed: "${userText}"`);
        } catch (transcribeError) {
            console.error("[Voice] Transcription Failed:", transcribeError.response ? transcribeError.response.data : transcribeError.message);
            // Attempt cleanup even on failure
            try { fs.unlinkSync(audioPath); } catch (e) { }
            return res.status(500).json({ message: "Transcribing audio failed", error: transcribeError.message });
        }

        if (!userText) {
            try { fs.unlinkSync(audioPath); } catch (e) { }
            return res.status(400).json({ message: "No speech detected" });
        }

        // 2. Interpret intent using GPT-4o
        try {
            const completion = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: `You are a music assistant for 'Cloudly'. 
            Analyze the user's natural language command and map it to a JSON object controlling the player.
            
            Available commands:
            - play: { action: "play", song: "optional song name query" }
            - pause: { action: "pause" }
            - next: { action: "next" }
            - prev: { action: "prev" }
            - volume: { action: "volume", value: number (0-100) }
            - shuffle: { action: "shuffle" }
            - unknown: { action: "unknown", message: "I didn't catch that." }
            
            If the user requests a specific song, set action to 'play' and 'song' to the search term.
            Return ONLY valid JSON.`,
                    },
                    { role: "user", content: userText },
                ],
                response_format: { type: "json_object" },
            });

            const commandStr = completion.choices[0].message.content;
            const command = JSON.parse(commandStr);

            console.log(`[Voice] Command:`, command);

            // Cleanup uploaded file
            try { fs.unlinkSync(audioPath); } catch (e) { }

            res.json({
                transcript: userText,
                command: command,
            });
        } catch (gptError) {
            console.error("[Voice] GPT-4o Failed:", gptError);
            try { fs.unlinkSync(audioPath); } catch (e) { }
            res.status(500).json({ message: "Understanding intent failed", error: gptError.message });
        }
    } catch (error) {
        console.error("[Voice] Error:", error);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ message: "Voice processing failed", error: error.message });
    }
};
