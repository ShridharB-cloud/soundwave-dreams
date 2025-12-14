import { useState } from "react";
import { PlaylistCard } from "@/components/music/PlaylistCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Loader2, Music } from "lucide-react";
import { usePlaylists, useCreatePlaylist } from "@/hooks/useMusic";
import { useToast } from "@/components/ui/use-toast";

const Playlists = () => {
  const { data: playlists = [], isLoading, isError } = usePlaylists();
  const createPlaylist = useCreatePlaylist();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistDesc, setNewPlaylistDesc] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    try {
      await createPlaylist.mutateAsync({
        name: newPlaylistName,
        description: newPlaylistDesc,
      });
      toast({
        title: "Success",
        description: "Playlist created successfully",
      });
      setIsOpen(false);
      setNewPlaylistName("");
      setNewPlaylistDesc("");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create playlist",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <h2 className="text-xl font-bold text-destructive mb-2">Error loading playlists</h2>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Your Playlists</h1>
          <p className="text-muted-foreground mt-1">Create and manage your collections</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Create Playlist
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Playlist</DialogTitle>
              <DialogDescription>
                Give your playlist a name and description.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="My Awesome Playlist"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  disabled={createPlaylist.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  placeholder="Songs for coding..."
                  value={newPlaylistDesc}
                  onChange={(e) => setNewPlaylistDesc(e.target.value)}
                  disabled={createPlaylist.isPending}
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createPlaylist.isPending || !newPlaylistName.trim()}>
                  {createPlaylist.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {playlists.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {playlists.map((playlist) => (
            <PlaylistCard key={playlist.id} playlist={playlist} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Music className="h-16 w-16 mb-4 opacity-20" />
          <p className="text-lg font-medium">No playlists yet</p>
          <p className="text-sm">Create your first playlist to get started</p>
        </div>
      )}
    </>
  );
};

export default Playlists;
