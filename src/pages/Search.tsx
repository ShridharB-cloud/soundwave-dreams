import { useSearchParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout"; // Verify if layout wrapper is needed or if handled by App.tsx
import { SongCard } from "@/components/music/SongCard";
import { useSongs } from "@/hooks/useMusic"; // We might need a specific useSearch hook or filter client-side for now
import { Song } from "@/types/music";

const Search = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q")?.toLowerCase() || "";
  const { data: songs = [], isLoading } = useSongs();

  // Client-side filtering for now as backend search might not be ready or we can reuse getSongs
  const filteredSongs = songs.filter(
    (song: Song) =>
      song.title.toLowerCase().includes(query) ||
      song.artist.toLowerCase().includes(query) ||
      song.album?.toLowerCase().includes(query)
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Search Results</h1>
        <p className="text-muted-foreground mt-1">
          Found {filteredSongs.length} results for "{query}"
        </p>
      </div>

      {filteredSongs.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredSongs.map((song) => (
            <SongCard key={song.id} song={song} queue={filteredSongs} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <p className="text-lg">No songs found matching "{query}"</p>
        </div>
      )}
    </>
  );
};

export default Search;
