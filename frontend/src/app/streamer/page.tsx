'use client';

import { useState, useEffect } from 'react';
import {
  Video,
  Settings,
  Copy,
  Eye,
  EyeOff,
  Play,
  Square,
  Monitor,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface User {
  id: string;
  username: string;
  displayName: string;
  streamKey: string;
  isStreamer: boolean;
}

export default function StreamerPage() {
  const [user, setUser] = useState<User | null>(null);
  const [showStreamKey, setShowStreamKey] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamTitle, setStreamTitle] = useState('');
  const [streamDescription, setStreamDescription] = useState('');
  const [streamInfo, setStreamInfo] = useState<{
    streamId: string;
    rtmpUrl: string;
    hlsUrl: string;
  } | null>(null);

  useEffect(() => {
    const userDataString = localStorage.getItem('user');
    if (userDataString) {
      setUser(JSON.parse(userDataString));
    } else {
      window.location.href = '/';
    }
  }, []);

  const copyStreamKey = async () => {
    if (!user) return;
    try {
      await navigator.clipboard.writeText(user.streamKey);
      toast.success('Stream key copied!');
    } catch (error) {
      toast.error('Failed to copy stream key');
    }
  };

  const startStream = async () => {
    if (!streamTitle.trim()) {
      toast.error('Please enter stream title');
      return;
    }

    // Get token from localStorage
    const token = localStorage.getItem('token');
    console.log('Token from localStorage:', token);

    if (!token) {
      toast.error(
        'Authentication token not found. Please register or sign in.'
      );
      return;
    }

    try {
      const response = await fetch(
        'http://localhost:3001/api/streams/start-test-stream',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: streamTitle,
            description: streamDescription,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to start stream');
      }

      setIsStreaming(true);
      toast.success('Stream started! RTMP stream is now live.');

      // Store stream info
      setStreamInfo(result);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to start stream'
      );
    }
  };

  const stopStream = async () => {
    if (!streamInfo?.streamId) {
      toast.error('No active stream to stop');
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3001/api/streams/${streamInfo.streamId}/stop`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to stop stream');
      }

      setIsStreaming(false);
      setStreamInfo(null);
      toast.success('Stream stopped!');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to stop stream'
      );
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Welcome, {user.displayName}! 🎬
          </h1>
          <p className="text-xl text-muted-foreground">
            Your streaming control panel
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
          {/* Stream Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Stream Settings
              </CardTitle>
              <CardDescription>
                Configure your stream parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="stream-title">Stream Title</Label>
                <Input
                  id="stream-title"
                  type="text"
                  value={streamTitle}
                  onChange={(e) => setStreamTitle(e.target.value)}
                  placeholder="Enter your stream title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stream-description">Description</Label>
                <textarea
                  id="stream-description"
                  value={streamDescription}
                  onChange={(e) => setStreamDescription(e.target.value)}
                  rows={3}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Describe your stream"
                />
              </div>

              <div className="pt-4">
                {!isStreaming ? (
                  <Button
                    onClick={startStream}
                    className="w-full gap-2"
                    size="lg"
                  >
                    <Play className="h-4 w-4" />
                    Start Stream
                  </Button>
                ) : (
                  <Button
                    onClick={stopStream}
                    variant="destructive"
                    className="w-full gap-2"
                    size="lg"
                  >
                    <Square className="h-4 w-4" />
                    Stop Stream
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Stream Key & OBS Setup */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                OBS Setup
              </CardTitle>
              <CardDescription>
                Information for connecting OBS Studio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Stream Key</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type={showStreamKey ? 'text' : 'password'}
                    value={user.streamKey}
                    readOnly
                    className="flex-1 bg-muted"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowStreamKey(!showStreamKey)}
                  >
                    {showStreamKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Button variant="outline" size="icon" onClick={copyStreamKey}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Card className="bg-primary/5 border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    OBS Studio Settings:
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  <p>
                    <strong>Stream Type:</strong> Custom
                  </p>
                  <p>
                    <strong>Server:</strong> rtmp://localhost:1935/live
                  </p>
                  <p>
                    <strong>Stream Key:</strong> {user.streamKey}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-secondary/50 border-secondary">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Watch your stream:</CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <p className="mb-2">
                    After starting the stream, viewers can watch at:
                  </p>
                  <code className="block bg-muted p-2 rounded text-xs break-all">
                    http://localhost:8000/live/{user.username}/index.m3u8
                  </code>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </div>

        {/* Current Stream Status */}
        {isStreaming && streamInfo && (
          <div className="max-w-6xl mx-auto mt-8">
            <Card className="border-green-200 bg-green-50/50">
              <CardHeader className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Badge variant="destructive" className="bg-red-600">
                    🔴 LIVE
                  </Badge>
                </div>
                <CardTitle className="text-green-900">
                  🎥 Currently Live: {streamTitle}
                </CardTitle>
                <CardDescription className="text-green-700">
                  Your stream is currently broadcasting and recording!
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <Card>
                    <CardContent className="p-3">
                      <strong>Stream ID:</strong> {streamInfo.streamId}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3">
                      <strong>RTMP URL:</strong> {streamInfo.rtmpUrl}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3">
                      <strong>HLS URL:</strong> {streamInfo.hlsUrl}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3">
                      <strong>Viewers can watch:</strong>{' '}
                      <Button variant="link" className="p-0 h-auto" asChild>
                        <a href={streamInfo.hlsUrl} target="_blank">
                          Open Stream
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
