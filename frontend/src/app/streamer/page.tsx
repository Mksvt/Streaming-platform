'use client';

import { useState, useEffect } from 'react';
import { Copy, Check, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import VideoPlayer from '@/components/VideoPlayer';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fetchUserById } from '@/lib/api';
import { User } from '@/types/user'; 
import io from 'socket.io-client';

export default function StreamerPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isKeyVisible, setIsKeyVisible] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser: User = JSON.parse(storedUser);
      if (!parsedUser.streamKey) {
        fetchUserById(parsedUser.id).then((data) => {
          parsedUser.streamKey = data.streamKey;
          localStorage.setItem('user', JSON.stringify(parsedUser));
          setUser(parsedUser);
        });
      } else {
        setUser(parsedUser);
      }
    } else {
      toast.error('You must be logged in to view this page.');
      // In a real app, you'd redirect to the login page
      // window.location.href = '/';
    }
  }, []);

  useEffect(() => {
    const socket = io('http://localhost:3001');

    if (user) {
      socket.emit('stream-started', { userId: user.id });
    }

    return () => {
      if (user) {
        socket.emit('stream-ended', { userId: user.id });
      }
      socket.disconnect();
    };
  }, [user]);

  const copyToClipboard = (text: string, type: 'key' | 'url') => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`Copied ${type} to clipboard!`);
      if (type === 'key') {
        setCopiedKey(true);
        setTimeout(() => setCopiedKey(false), 2000);
      } else {
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
      }
    });
  };

  // The URL for the streamer to preview their own stream
  const streamUrl = user
    ? `http://localhost:8000/live/${user.username}/index.m3u8`
    : '';

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-foreground">
        <p>Loading user data...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left side: Stream Preview */}
      <div className="lg:col-span-2">
        <h1 className="text-3xl font-bold mb-4">Streamer Dashboard</h1>
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Live Stream Preview</CardTitle>
            <CardDescription>
              This is what your viewers see. There might be a slight delay.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="aspect-video bg-black rounded-md overflow-hidden border">
              {streamUrl ? (
                <VideoPlayer src={streamUrl} autoPlay muted />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <p className="text-muted-foreground">
                    Stream preview will appear here
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right side: Setup and Info */}
      <div className="space-y-8">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Streaming Setup</CardTitle>
            <CardDescription>
              Use these details in your streaming software (e.g., OBS).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="server-url">RTMP Server URL</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="server-url"
                  value="rtmp://localhost:1935/live"
                  readOnly
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    copyToClipboard('rtmp://localhost:1935/live', 'url')
                  }
                >
                  {copiedUrl ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="stream-key">Stream Key</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="stream-key"
                  type={isKeyVisible ? 'text' : 'password'}
                  value={user.streamKey}
                  readOnly
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsKeyVisible(!isKeyVisible)}
                >
                  {isKeyVisible ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(user.streamKey, 'key')}
                >
                  {copiedKey ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Welcome, {user.displayName}!</CardTitle>
            <CardDescription>You are ready to go live.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Start your stream in OBS or other software, and it will appear in
              the preview window on the left. Viewers can watch on the "Viewer"
              page.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
