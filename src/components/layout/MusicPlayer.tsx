import { useRef, useEffect, useState } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, Heart, Shuffle, Repeat, Maximize2, ChevronDown } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { usePlayer } from "@/contexts/PlayerContext";
import { cn } from "@/lib/utils";
import { CloudlyOrb } from "../voice/CloudlyOrb";
import { useVoiceAssistant } from "@/hooks/useVoiceAssistant";
import { Visualizer } from "../music/Visualizer";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { LiquidEffect } from "@/components/ui/liquid-effect";

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const {
    currentSong,
    isPlaying,
    volume,
    progress,
    duration,
    togglePlay,
    nextSong,
    prevSong,
    setVolume,
    setProgress,
    toggleLike,
  } = usePlayer();

  const { orbState, toggleRecording } = useVoiceAssistant();
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleCanPlay = () => {
      if (isPlaying) {
        audio.play().catch(error => {
          console.error("Playback failed:", error);
        });
      }
    };

    // When song changes, load it
    audio.load();

    // Wait for audio to be ready before playing
    audio.addEventListener('canplay', handleCanPlay);

    // If already playing when song changes, play immediately when ready
    if (isPlaying) {
      audio.play().catch(error => {
        console.error("Playback failed:", error);
      });
    } else {
      audio.pause();
    }

    return () => {
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [isPlaying, currentSong]); // Re-run when song or play state changes

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Handle seeking when progress is set manually (optional, usually tricky with state loops)
  // For now, let's rely on the slider's onValueChange updating the audio time directly too?
  // No, the context `setProgress` just updates state. We need a way to seek.
  // Let's modify the Slider's onValueChange.

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setProgress(value[0]);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime);
    }
  };

  const handleEnded = () => {
    nextSong();
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 100) {
      setIsExpanded(false);
    }
  };


  if (!currentSong) return null;

  return (
    <>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.2 }}
            onDragEnd={handleDragEnd}
            className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-3xl flex flex-col items-center justify-center p-8"
          >
            {/* Ambient Background Effect */}
            {/* Ambient Background Effect */}
            <div className="absolute inset-0 z-[-1] overflow-hidden pointer-events-none">
              {currentSong.coverUrl ? (
                <LiquidEffect
                  imageUrl={currentSong.coverUrl}
                  className="absolute inset-0 w-full h-full opacity-60 scale-110"
                  intensity={0.4}
                />
              ) : (
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] opacity-30 blur-[100px]"
                  style={{ background: `radial-gradient(circle, #444 0%, transparent 70%)` }}
                />
              )}
              {/* Overlay for readability */}
              <div className="absolute inset-0 bg-background/30 backdrop-blur-3xl" />
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="absolute top-6 right-6 hover:bg-white/10 rounded-full transition-colors"
              onClick={() => setIsExpanded(false)}
            >
              <ChevronDown className="h-8 w-8" />
            </Button>

            <div className="flex flex-col items-center gap-8 max-w-4xl w-full">
              <div className="relative group">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                  className="relative z-10"
                >
                  <img
                    src={currentSong.coverUrl}
                    alt={currentSong.title}
                    className="w-64 h-64 md:w-96 md:h-96 rounded-2xl shadow-2xl object-cover ring-1 ring-white/10"
                  />
                </motion.div>

                {/* Visualizer Overlay */}
                <div className="absolute -bottom-12 left-0 right-0 flex justify-center z-20">
                  <Visualizer className="h-24 gap-2" />
                </div>
              </div>

              <div className="text-center space-y-2 relative z-10">
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70"
                >
                  {currentSong.title}
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-xl text-muted-foreground"
                >
                  {currentSong.artist}
                </motion.p>
              </div>

              {/* Lyrics Placeholder */}
              <div className="w-full max-w-lg h-32 overflow-y-auto text-center text-muted-foreground/50 space-y-1 mask-linear-fade relative z-10">
                <p>Lyrics not available</p>
                <p className="text-sm">(Lyrics integration coming soon)</p>
              </div>

              {/* Expanded Controls */}
              <div className="w-full max-w-md space-y-6 relative z-10">
                <div className="flex w-full items-center gap-4">
                  <span className="text-sm text-muted-foreground w-12 text-right">
                    {formatTime(progress)}
                  </span>
                  <Slider
                    value={[progress]}
                    max={duration || 100}
                    step={1}
                    onValueChange={handleSeek}
                    className="flex-1 cursor-pointer"
                  />
                  <span className="text-sm text-muted-foreground w-12">
                    {formatTime(duration)}
                  </span>
                </div>

                <div className="flex items-center justify-center gap-8">
                  <motion.div whileTap={{ scale: 0.9 }}>
                    <Button variant="ghost" size="icon" onClick={prevSong} className="h-12 w-12 hover:bg-white/10 rounded-full">
                      <SkipBack className="h-8 w-8" />
                    </Button>
                  </motion.div>

                  <motion.div whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.05 }}>
                    <Button
                      onClick={togglePlay}
                      className="h-20 w-20 rounded-full bg-primary text-primary-foreground hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                    >
                      {isPlaying ? <Pause className="h-10 w-10 fill-current" /> : <Play className="h-10 w-10 ml-1 fill-current" />}
                    </Button>
                  </motion.div>

                  <motion.div whileTap={{ scale: 0.9 }}>
                    <Button variant="ghost" size="icon" onClick={nextSong} className="h-12 w-12 hover:bg-white/10 rounded-full">
                      <SkipForward className="h-8 w-8" />
                    </Button>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-0 left-0 right-0 z-50 h-24 border-t bg-background/80 backdrop-blur-md flex items-center justify-between px-4 transition-all duration-300 supports-[backdrop-filter]:bg-background/60">
        <audio
          ref={audioRef}
          key={currentSong.id} // Forces remount on song change
          src={currentSong.audioUrl}
          crossOrigin="anonymous"
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          onError={(e) => console.error("Audio playback error:", e.currentTarget.error)}
          onLoadedMetadata={(e) => {
            const audio = e.currentTarget;
            console.log("Audio loaded:", audio.src, "Duration:", audio.duration);
          }}
        />
        {/* Currently playing info */}
        <div className="flex items-center gap-4 w-64 group/player">
          <div className="relative group cursor-pointer overflow-hidden rounded-md" onClick={() => setIsExpanded(true)}>
            <img
              src={currentSong.coverUrl}
              alt={currentSong.title}
              className="h-14 w-14 object-cover shadow-md transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
              <Maximize2 className="h-6 w-6 text-white drop-shadow-md" />
            </div>
          </div>
          <div className="min-w-0">
            <p className="font-medium text-foreground truncate cursor-pointer hover:text-primary transition-colors" onClick={() => setIsExpanded(true)}>{currentSong.title}</p>
            <p className="text-sm text-muted-foreground truncate">{currentSong.artist}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => toggleLike(currentSong.id, !!currentSong.liked)}
            className="shrink-0 hover:bg-white/10 hover:text-red-500 transition-colors"
          >
            <Heart
              className={cn(
                "h-5 w-5 transition-all duration-300",
                currentSong.liked ? "fill-red-500 text-red-500 scale-110" : "text-muted-foreground"
              )}
            />
          </Button>
        </div>

        {/* Player controls */}
        <div className="flex flex-col items-center gap-2 flex-1 max-w-xl">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-white/10 rounded-full">
              <Shuffle className="h-4 w-4" />
            </Button>

            <Button variant="ghost" size="icon" onClick={prevSong} className="text-foreground hover:bg-white/10 rounded-full">
              <SkipBack className="h-5 w-5" />
            </Button>

            <motion.div whileTap={{ scale: 0.9 }}>
              <Button
                onClick={togglePlay}
                className="h-10 w-10 rounded-full bg-foreground text-background hover:bg-foreground/90 hover:scale-105 transition-transform shadow-lg flex items-center justify-center"
              >
                {isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 ml-0.5 fill-current" />}
              </Button>
            </motion.div>

            <Button variant="ghost" size="icon" onClick={nextSong} className="text-foreground hover:bg-white/10 rounded-full">
              <SkipForward className="h-5 w-5" />
            </Button>

            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-white/10 rounded-full">
              <Repeat className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress bar */}
          <div className="flex w-full items-center gap-2 group/progress">
            <span className="text-xs text-muted-foreground w-10 text-right tabular-nums">
              {formatTime(progress)}
            </span>
            <Slider
              value={[progress]}
              max={duration || 100}
              step={1}
              onValueChange={handleSeek}
              className="flex-1 cursor-pointer transition-all hover:h-2"
            />
            <span className="text-xs text-muted-foreground w-10 tabular-nums">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Volume control */}
        <div className="flex items-center gap-4 w-64 justify-end">
          <CloudlyOrb state={orbState} className="mr-2" onClick={toggleRecording} />
          <div className="flex items-center gap-2 group">
            <Volume2 className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            <Slider
              value={[volume * 100]}
              max={100}
              step={1}
              onValueChange={(value) => setVolume(value[0] / 100)}
              className="w-24 cursor-pointer"
            />
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsExpanded(true)} className="ml-2 hover:bg-white/10 rounded-full">
            <Maximize2 className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </div>
    </>
  );
}
