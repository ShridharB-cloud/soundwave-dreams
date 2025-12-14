import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload as UploadIcon, Music, Image, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { musicService } from "@/services/music";

const Upload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    artist: "",
    album: "",
  });

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAudioFile(e.target.files[0]);
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCoverFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioFile) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select an audio file.",
      });
      return;
    }

    setIsUploading(true);
    
    try {
      const data = new FormData();
      data.append("title", formData.title);
      data.append("artist", formData.artist);
      data.append("album", formData.album);
      data.append("audio", audioFile);
      if (coverFile) {
        data.append("cover", coverFile);
      }

      await musicService.uploadSong(data);
      
      toast({
        title: "Upload successful!",
        description: `"${formData.title}" has been added to your library.`,
      });
      
      // Reset form
      setFormData({ title: "", artist: "", album: "" });
      setAudioFile(null);
      setCoverFile(null);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.error || "Failed to upload song",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Upload Music</h1>
          <p className="text-muted-foreground mt-1">Share your music with the world</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Audio File Upload */}
          <div className="space-y-2">
            <Label>Audio File</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors bg-card relative">
              <input
                type="file"
                accept="audio/*"
                onChange={handleAudioChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                required={!audioFile}
              />
              <Music className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              {audioFile ? (
                <div>
                  <p className="text-primary font-medium truncate">{audioFile.name}</p>
                  <p className="text-sm text-muted-foreground mt-1">{(audioFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
              ) : (
                <>
                  <p className="text-foreground font-medium">Drop your audio file here or click to browse</p>
                  <p className="text-sm text-muted-foreground mt-1">MP3, WAV, or M4A up to 50MB</p>
                </>
              )}
            </div>
          </div>

          {/* Cover Image Upload */}
          <div className="space-y-2">
            <Label>Cover Image</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors bg-card relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Image className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              {coverFile ? (
                <div>
                  <p className="text-primary font-medium truncate">{coverFile.name}</p>
                  <p className="text-sm text-muted-foreground mt-1">{(coverFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
              ) : (
                <>
                  <p className="text-foreground font-medium">Drop your cover image here or click to browse</p>
                  <p className="text-sm text-muted-foreground mt-1">JPG or PNG, recommended 500x500px</p>
                </>
              )}
            </div>
          </div>

          {/* Metadata Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Enter song title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="artist">Artist</Label>
              <Input
                id="artist"
                placeholder="Enter artist name"
                value={formData.artist}
                onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="album">Album</Label>
              <Input
                id="album"
                placeholder="Enter album name (optional)"
                value={formData.album}
                onChange={(e) => setFormData({ ...formData, album: e.target.value })}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <UploadIcon className="h-4 w-4 mr-2" />
                Upload Song
              </>
            )}
          </Button>
        </form>
      </div>
  );
};

export default Upload;
