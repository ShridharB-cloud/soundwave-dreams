import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Music, ListMusic, Heart, Settings } from "lucide-react";
import { usePlaylists, useLikedSongs, useMySongs } from "@/hooks/useMusic";

import { authService } from "@/services/auth";

const Profile = () => {
  const { data: songs = [] } = useMySongs();
  const { data: playlists = [] } = usePlaylists();
  const { data: likedSongs = [] } = useLikedSongs();
  const user = authService.getCurrentUser();

  const stats = [
    { label: "Songs Uploaded", value: songs.length, icon: Music },
    { label: "Playlists Created", value: playlists.length, icon: ListMusic },
    { label: "Liked Songs", value: likedSongs.length, icon: Heart },
  ];

  if (!user) {
    return (
        <div className="flex flex-col items-center justify-center h-full">
            <h2 className="text-2xl font-bold mb-4">Please log in to view your profile</h2>
            <Button onClick={() => window.location.href = '/login'}>Login</Button>
        </div>
    );
  }

  const joinYear = user.createdAt ? new Date(user.createdAt).getFullYear() : new Date().getFullYear();

  return (
    <>
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="flex items-center gap-6 mb-8 p-6 rounded-xl bg-card border border-border">
          <Avatar className="h-24 w-24">
            <AvatarImage src={user.avatarUrl} />
            <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground">{user.name}</h1>
            <p className="text-muted-foreground">{user.email}</p>
            <p className="text-sm text-muted-foreground mt-1">Member since {joinYear}</p>
          </div>
          <Button variant="secondary">
            <Settings className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="p-6 rounded-xl bg-card border border-border text-center"
            >
              <stat.icon className="h-8 w-8 mx-auto text-primary mb-2" />
              <p className="text-3xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Profile Settings */}
        <div className="p-6 rounded-xl bg-card border border-border">
          <h2 className="text-xl font-semibold text-foreground mb-6">Profile Settings</h2>
          <div className="grid gap-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <Input id="name" defaultValue={user.name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue={user.email} disabled />
            </div>
            <Button className="w-fit">Save Changes</Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;
