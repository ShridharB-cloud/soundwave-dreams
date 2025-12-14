import { MainLayout } from "@/components/layout/MainLayout";
import { ContentRow } from "@/components/music/ContentRow";
import { SongCard } from "@/components/music/SongCard";
import { PlaylistCard } from "@/components/music/PlaylistCard";
import { useSongs, usePlaylists, useLikedSongs, useRecentlyPlayed } from "@/hooks/useMusic";
import heroBackground from "@/assets/hero-background.jpg";
import { Song } from "@/types/music";
import { authService } from "@/services/auth";

const Index = () => {
  const user = authService.getCurrentUser();
  const { data: songs = [], isLoading: isLoadingSongs } = useSongs();
  const { data: playlists = [], isLoading: isLoadingPlaylists } = usePlaylists();
  const { data: likedSongs = [], isLoading: isLoadingLiked } = useLikedSongs();
  const { data: recentlyPlayed = [], isLoading: isLoadingRecent } = useRecentlyPlayed();

  const newUploads = [...songs].reverse().slice(0, 6);

  if (isLoadingSongs || isLoadingPlaylists || isLoadingLiked || isLoadingRecent) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <>
      {/* Hero Section */}
      <section className="relative -mx-6 -mt-6 mb-8 h-80 overflow-hidden">
        <img
          src={heroBackground}
          alt="Cloudly music streaming"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        
        <div className="relative z-10 flex h-full flex-col justify-end p-8">
          <h1 className="text-4xl font-bold text-foreground mb-2 animate-slide-up">
            Welcome back, <span className="text-primary">{user?.name || 'Music Lover'}</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-lg animate-slide-up" style={{ animationDelay: "0.1s" }}>
            Your personal music streaming experience. Discover new sounds, create playlists, and enjoy your favorites.
          </p>
        </div>
      </section>

      {/* Recently Played */}
      {recentlyPlayed.length > 0 && (
        <ContentRow title="Recently Played">
          {recentlyPlayed.map((song: Song) => (
            <SongCard key={song.id} song={song} queue={recentlyPlayed} />
          ))}
        </ContentRow>
      )}

      {/* Your Playlists */}
      {playlists.length > 0 && (
        <ContentRow title="Your Playlists">
          {playlists.map((playlist) => (
            <PlaylistCard key={playlist.id} playlist={playlist} />
          ))}
        </ContentRow>
      )}

      {/* Liked Songs */}
      {likedSongs.length > 0 && (
        <ContentRow title="Liked Songs">
          {likedSongs.map((song: Song) => (
            <SongCard key={song.id} song={song} queue={likedSongs} />
          ))}
        </ContentRow>
      )}

      {/* New Uploads */}
      {newUploads.length > 0 && (
        <ContentRow title="New Uploads">
          {newUploads.map((song) => (
            <SongCard key={song.id} song={song} queue={newUploads} />
          ))}
        </ContentRow>
      )}

      {/* All Songs */}
      <ContentRow title="Browse All">
        {songs.map((song) => (
          <SongCard key={song.id} song={song} queue={songs} />
        ))}
      </ContentRow>
    </>
  );
};

export default Index;
