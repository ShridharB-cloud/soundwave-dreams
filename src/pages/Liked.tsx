import { SongCard } from "@/components/music/SongCard";
import { Heart } from "lucide-react";
import { useLikedSongs } from "@/hooks/useMusic";

const Liked = () => {
  const { data: likedSongs = [], isLoading, isError, error } = useLikedSongs();
  console.log('[DEBUG] Liked Page - likedSongs:', likedSongs, 'isLoading:', isLoading, 'isError:', isError, 'error:', error);

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
        <h2 className="text-xl font-bold text-destructive mb-2">Error loading liked songs</h2>
        <p className="text-muted-foreground mb-4">{(error as Error)?.message || "Something went wrong"}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-2">
          <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center">
            <Heart className="h-8 w-8 text-primary-foreground fill-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Liked Songs</h1>
            <p className="text-muted-foreground">{likedSongs.length} songs</p>
          </div>
        </div>
      </div>

      {likedSongs.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {likedSongs.map((song) => (
            <SongCard key={song.id} song={song} queue={likedSongs} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Heart className="h-16 w-16 mb-4 opacity-20" />
          <p className="text-lg font-medium">No liked songs yet</p>
          <p className="text-sm">Start exploring and like songs to see them here</p>
        </div>
      )}
    </>
  );
};

export default Liked;
