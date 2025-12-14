import api from '@/lib/api';
import { Song, Playlist } from '@/types/music';

// Helper to map _id to id
const transformSong = (song: any): Song => {
  if (!song) return song;
  return {
    ...song,
    id: song._id || song.id,
  };
};

// Helper to map _id to id for playlists
const transformPlaylist = (playlist: any): Playlist => {
  if (!playlist) return playlist;
  return {
    ...playlist,
    id: playlist._id || playlist.id,
    songs: playlist.songs ? playlist.songs.map((s: any) => transformSong(s.song || s)) : [] 
  };
};

export const musicService = {
  getAllSongs: async (): Promise<Song[]> => {
    const response = await api.get('/songs');
    return response.data.songs.map(transformSong);
  },

  getAllPlaylists: async (): Promise<Playlist[]> => {
    const response = await api.get('/playlists');
    return response.data.playlists.map(transformPlaylist);
  },

  createPlaylist: async (name: string, description?: string, isPublic?: boolean): Promise<Playlist> => {
    const response = await api.post('/playlists', { name, description, isPublic });
    return transformPlaylist(response.data.playlist);
  },

  getPlaylist: async (id: string): Promise<Playlist> => {
    const response = await api.get(`/playlists/${id}`);
    return transformPlaylist(response.data.playlist);
  },

  updatePlaylist: async (id: string, updates: Partial<Playlist>): Promise<Playlist> => {
    const response = await api.put(`/playlists/${id}`, updates);
    return transformPlaylist(response.data.playlist);
  },

  deletePlaylist: async (id: string): Promise<void> => {
    await api.delete(`/playlists/${id}`);
  },

  addSongToPlaylist: async (playlistId: string, songId: string): Promise<Playlist> => {
    const response = await api.post(`/playlists/${playlistId}/songs`, { songId });
    return transformPlaylist(response.data.playlist);
  },

  removeSongFromPlaylist: async (playlistId: string, songId: string): Promise<Playlist> => {
    const response = await api.delete(`/playlists/${playlistId}/songs/${songId}`);
    return transformPlaylist(response.data.playlist);
  },

  getLikedSongs: async (): Promise<Song[]> => {
    const response = await api.get('/songs/liked');
    return response.data.songs.map(transformSong);
  },

  getRecentlyPlayed: async (): Promise<Song[]> => {
    const response = await api.get('/songs/recent');
    return response.data.songs.map(transformSong);
  },

  uploadSong: async (formData: FormData): Promise<Song> => {
    const response = await api.post('/songs/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return transformSong(response.data.song);
  },

  toggleLikeSong: async (songId: string, isLiked: boolean): Promise<void> => {
    if (isLiked) {
      await api.delete(`/songs/${songId}/like`);
    } else {
      await api.post(`/songs/${songId}/like`);
    }
  }
};
