import { useState, useEffect, useRef, useCallback } from 'react';
import { usePlayer } from '../contexts/PlayerContext';
import { useQueryClient } from '@tanstack/react-query';
import { Song } from '@/types/music';
import { toast } from 'sonner';
import { musicService } from '@/services/music';

// Types for Web Speech API (for wake word only)
interface IWindow extends Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
}

export type OrbState = 'idle' | 'listening' | 'processing' | 'speaking' | 'active';

export function useVoiceAssistant() {
    const [orbState, setOrbState] = useState<OrbState>('idle');
    const [transcript, setTranscript] = useState('');

    // MediaRecorder refs
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    // Wake Word refs
    const recognitionRef = useRef<any>(null);
    const isWakeWordListeningRef = useRef(false);

    const {
        currentSong,
        togglePlay,
        nextSong,
        prevSong,
        setVolume,
        playSong,
        isPlaying,
        volume,
        toggleLike,
        shuffleQueue
    } = usePlayer();

    const queryClient = useQueryClient();
    const synth = window.speechSynthesis;

    // --- Command Execution Logic ---
    const handleCommand = useCallback(async (command: any) => {
        console.log("Executing command:", command);
        const action = command.action;

        switch (action) {
            case 'play':
                if (command.song) {
                    await findAndPlaySong(command.song);
                } else {
                    if (!isPlaying) togglePlay();
                    speak("Resuming music");
                }
                break;
            case 'pause':
                if (isPlaying) togglePlay();
                speak("Paused");
                break;
            case 'next':
                nextSong();
                speak("Skipping");
                break;
            case 'prev':
                prevSong();
                speak("Previous song");
                break;
            case 'volume':
                if (command.value) {
                    setVolume(Math.min(1, Math.max(0, command.value / 100)));
                    speak(`Volume set to ${command.value}%`);
                }
                break;
            case 'shuffle':
                shuffleQueue();
                speak("Shuffling your queue");
                break;
            case 'unknown':
                speak(command.message || "I didn't quite get that.");
                break;
            default:
                console.warn("Unknown action:", action);
        }
    }, [isPlaying, togglePlay, nextSong, prevSong, setVolume, shuffleQueue]);

    const findAndPlaySong = async (query: string) => {
        toast.info(`Searching: ${query}`);
        let list = queryClient.getQueryData(['songs']) as Song[] | { songs: Song[] };
        let songs: Song[] = [];

        if (Array.isArray(list)) songs = list;
        else if ((list as any)?.songs) songs = (list as any).songs;

        // Force fetch if empty
        if (!songs?.length) {
            try {
                songs = await musicService.getAllSongs();
                queryClient.setQueryData(['songs'], songs);
            } catch (e) {
                speak("I can't reach the music library right now.");
                return;
            }
        }

        const match = songs.find(s =>
            s.title.toLowerCase().includes(query.toLowerCase()) ||
            s.artist.toLowerCase().includes(query.toLowerCase())
        );

        if (match) {
            playSong(match);
            speak(`Playing ${match.title}`);
        } else {
            speak(`I couldn't find ${query}`);
        }
    };

    // --- Audio Recording & Backend ---
    const startRecording = async () => {
        try {
            // Stop wake word listener temporarily
            if (recognitionRef.current) recognitionRef.current.stop();
            isWakeWordListeningRef.current = false;

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                setOrbState('processing');
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                await sendToBackend(audioBlob);

                // Cleanup stream
                stream.getTracks().forEach(track => track.stop());

                // Restart wake word listener logic handles itself in state transition usually, 
                // but we explicitly restart here after processing
                if (recognitionRef.current) {
                    try { recognitionRef.current.start(); isWakeWordListeningRef.current = true; } catch (e) { }
                }
                setOrbState('idle');
            };

            mediaRecorder.start();
            setOrbState('listening');
            setTranscript("Listening...");

            // Record for 4 seconds then stop automatically
            setTimeout(() => {
                if (mediaRecorder.state === 'recording') {
                    mediaRecorder.stop();
                }
            }, 4000);

        } catch (error) {
            console.error("Error accessing microphone:", error);
            setOrbState('idle');
            toast.error("Microphone access denied");
        }
    };

    const sendToBackend = async (audioBlob: Blob) => {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'command.webm');

        try {
            const response = await fetch('http://localhost:3001/api/voice/command', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('Backend processing failed');

            const data = await response.json();
            console.log("Voice Response:", data);

            if (data.transcript) setTranscript(data.transcript);
            if (data.command) {
                setOrbState('active');
                await handleCommand(data.command);
            }
        } catch (error) {
            console.error("Voice command error:", error);
            speak("Sorry, something went wrong.");
        }
    };

    const speak = (text: string) => {
        if (synth.speaking) synth.cancel();
        setOrbState('speaking');
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onend = () => {
            setOrbState('idle');
        };
        synth.speak(utterance);
    };

    // --- Wake Word Logic (Web Speech API) ---
    useEffect(() => {
        const { webkitSpeechRecognition, SpeechRecognition } = window as unknown as IWindow;
        const Recognition = SpeechRecognition || webkitSpeechRecognition;

        if (!Recognition) return;

        const recognition = new Recognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
            const results = Array.from(event.results);
            const lastResult: any = results[results.length - 1];
            const text = lastResult[0].transcript.trim().toLowerCase();

            // Simple wake word check on interim results for speed
            if (orbState === 'idle' && (text.endsWith('hey cloudly') || text.includes('hey cloud') || text.includes('cloudly'))) {
                console.log("Wake word detected!");
                startRecording();
            }
        };

        recognition.onend = () => {
            // Use a timeout to restart only if we intend to imply continuous listening
            // but avoid conflict if we are recording
            if (orbState === 'idle' && !mediaRecorderRef.current) {
                setTimeout(() => {
                    try { recognition.start(); } catch (e) { }
                }, 1000);
            }
        };

        recognitionRef.current = recognition;
        try {
            recognition.start();
            isWakeWordListeningRef.current = true;
        } catch (e) {
            console.warn("Wake word listener failed to start", e);
        }

        return () => {
            recognition.stop();
        };
    }, [orbState]); // Dependency on orbState to avoid restarting during recording

    const toggleRecording = () => {
        console.log("🔴 [DEBUG] Orb Clicked! Current State:", orbState);
        if (orbState === 'listening') {
            // If manual stop, we stop the recorder
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                console.log("🔴 [DEBUG] Stopping recording manually...");
                mediaRecorderRef.current.stop();
            }
        } else if (orbState === 'idle' || orbState === 'active') {
            console.log("🔴 [DEBUG] Starting recording manually...");
            startRecording();
        }
    };

    return {
        orbState,
        transcript,
        isListening: orbState === 'listening',
        toggleRecording
    };
}
