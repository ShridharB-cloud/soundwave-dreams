import express from "express";
import multer from "multer";
import path from "path";
import { processVoiceCommand } from "../controllers/voice.controller.js";

const router = express.Router();

// Configure Multer for temporary audio storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "temp/");
    },
    filename: (req, file, cb) => {
        cb(null, `voice-${Date.now()}${path.extname(file.originalname)}`);
    },
});

const upload = multer({ storage });

// Route to handle voice commands
router.post("/command", upload.single("audio"), processVoiceCommand);

export default router;
