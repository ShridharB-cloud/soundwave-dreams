import { useNavigate, useParams } from "react-router-dom";
import { usePlaylist, useDeletePlaylist, useUpdatePlaylist, useSongs, useAddSongToPlaylist, useRemoveSongFromPlaylist } from "@/hooks/useMusic";
import { Button } from "@/components/ui/button";
import { Loader2, Play, Music, MoreVertical, Trash, Edit, Plus, X } from "lucide-react";
import { usePlayer } from "@/contexts/PlayerContext";
import { SongCard } from "@/components/music/SongCard";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

const PlaylistDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { playSong } = usePlayer();
  
  const { data: playlist, isLoading, isError } = usePlaylist(id || "");
  const deletePlaylist = useDeletePlaylist();
  const updatePlaylist = useUpdatePlaylist();
  const addSong = useAddSongToPlaylist();
  const removeSong = useRemoveSongFromPlaylist();
  const { data: allSongs = [] } = useSongs();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddSongOpen, setIsAddSongOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [searchSong, setSearchSong] = useState("");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isError || !playlist) {
     return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <h2 className="text-xl font-bold text-destructive mb-2">Error loading playlist</h2>
        <Button onClick={() => navigate("/playlists")}>Go Back</Button>
      </div>
    );
  }

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this playlist?")) {
      await deletePlaylist.mutateAsync(playlist.id);
      toast({ title: "Playlist deleted" });
      navigate("/playlists");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    await updatePlaylist.mutateAsync({
      id: playlist.id,
      updates: { name: editName, description: editDesc }
    });
    setIsEditOpen(false);
    toast({ title: "Playlist updated" });
  };

  const handleAddSong = async (songId: string) => {
    try {
      await addSong.mutateAsync({ playlistId: playlist.id, songId });
      toast({ title: "Song added" });
    } catch (error) {
       toast({ variant: "destructive", title: "Failed to add song" });
    }
  };

  const handleRemoveSong = async (songId: string) => {
     try {
      await removeSong.mutateAsync({ playlistId: playlist.id, songId });
      toast({ title: "Song removed" });
    } catch (error) {
       toast({ variant: "destructive", title: "Failed to remove song" });
    }
  };

  const filteredSongsToAdd = allSongs.filter(s => 
    !playlist.songs.find(ps => ps.id === s.id) &&
    (s.title.toLowerCase().includes(searchSong.toLowerCase()) || 
     s.artist.toLowerCase().includes(searchSong.toLowerCase()))
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-end gap-6 bg-gradient-to-b from-secondary/50 to-background p-6 rounded-xl">
        <div className="h-52 w-52 shadow-xl rounded-lg overflow-hidden shrink-0">
          <img src={playlist.coverUrl} alt={playlist.name} className="h-full w-full object-cover" />
        </div>
        <div className="flex-1 w-full space-y-4">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">{playlist.name}</h1>
            <p className="text-lg text-muted-foreground">{playlist.description}</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
             <span>{playlist.songCount} songs</span>
             <span>•</span>
             <span>{typeof playlist.createdBy === 'object' ? (playlist.createdBy as any).name : playlist.createdBy}</span> 
          </div>
          
          <div className="flex items-center gap-4 pt-2">
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90 rounded-full"
              onClick={() => playlist.songs.length > 0 && playSong(playlist.songs[0], playlist.songs)}
            >
              <Play className="h-5 w-5 mr-2 fill-current" />
              Play
            </Button>
            
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" onClick={() => {
                        setEditName(playlist.name);
                        setEditDesc(playlist.description);
                    }}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Playlist</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleUpdate} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Name</Label>
                            <Input value={editName} onChange={e => setEditName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Input value={editDesc} onChange={e => setEditDesc(e.target.value)} />
                        </div>
                        <DialogFooter>
                            <Button type="submit">Save Changes</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem className="text-destructive" onClick={handleDelete}>
                  <Trash className="h-4 w-4 mr-2" />
                  Delete Playlist
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

       {/* Songs List */}
       <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Songs</h2>
                <Dialog open={isAddSongOpen} onOpenChange={setIsAddSongOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Songs
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Add Songs to Playlist</DialogTitle>
                            <Input 
                                placeholder="Search songs..." 
                                value={searchSong} 
                                onChange={e => setSearchSong(e.target.value)}
                                className="mt-4"
                            />
                        </DialogHeader>
                        <div className="space-y-2 mt-4">
                            {filteredSongsToAdd.length === 0 ? (
                                <p className="text-center text-muted-foreground py-4">No songs found</p>
                            ) : (
                                filteredSongsToAdd.map(song => (
                                    <div key={song.id} className="flex items-center justify-between p-2 hover:bg-secondary rounded-md">
                                        <div className="flex items-center gap-3">
                                            <img src={song.coverUrl} className="h-10 w-10 rounded object-cover" />
                                            <div>
                                                <p className="font-medium">{song.title}</p>
                                                <p className="text-xs text-muted-foreground">{song.artist}</p>
                                            </div>
                                        </div>
                                        <Button size="sm" variant="ghost" onClick={() => handleAddSong(song.id)}>
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {playlist.songs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground border-2 border-dashed border-muted rounded-xl">
                    <Music className="h-16 w-16 mb-4 opacity-20" />
                    <p className="text-lg font-medium">This playlist is empty</p>
                    <Button variant="link" onClick={() => setIsAddSongOpen(true)}>Add songs now</Button>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                     {playlist.songs.map((song) => (
                        <div key={song.id} className="relative group">
                             <SongCard song={song} queue={playlist.songs} />
                             <Button 
                                variant="destructive" 
                                size="icon" 
                                className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    handleRemoveSong(song.id);
                                }}
                             >
                                <X className="h-3 w-3" />
                             </Button>
                        </div>
                     ))}
                </div>
            )}
       </div>
    </div>
  );
};

export default PlaylistDetail;
