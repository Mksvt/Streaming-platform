'use client';

import { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Loader2,
  Copy,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function ViewerPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentStream, setCurrentStream] = useState('');
  const [availableStreams, setAvailableStreams] = useState<
    Array<{
      _id: string;
      title: string;
      user?: {
        displayName?: string;
        username?: string;
      };
      streamKey: string;
    }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [streamUrl, setStreamUrl] = useState('');

  // Fetch available streams from backend
  useEffect(() => {
    const fetchStreams = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/streams/live');
        if (response.ok) {
          const data = await response.json();
          setAvailableStreams(data.streams || []);
          if (data.streams && data.streams.length > 0) {
            setCurrentStream(data.streams[0]._id);
            setStreamUrl(
              `http://localhost:8000/live/${data.streams[0].streamKey}/index.m3u8`
            );
          }
        }
      } catch (error) {
        console.error('Failed to fetch streams:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStreams();
    const interval = setInterval(fetchStreams, 5000);
    return () => clearInterval(interval);
  }, []);

  // Update stream URL when current stream changes
  useEffect(() => {
    if (currentStream && availableStreams.length > 0) {
      const selectedStream = availableStreams.find(
        (stream) => stream._id === currentStream
      );
      if (selectedStream) {
        setStreamUrl(
          `http://localhost:8000/live/${selectedStream.streamKey}/index.m3u8`
        );
      }
    }
  }, [currentStream, availableStreams]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const copyHLSUrl = async () => {
    try {
      await navigator.clipboard.writeText(streamUrl);
      toast.success('HLS URL copied!');
    } catch (error) {
      toast.error('Failed to copy URL');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground text-xl">Loading streams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            🎥 Watch Live Streams
          </h1>
          <p className="text-xl text-muted-foreground">
            Watch live broadcasts from our platform
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Stream Selector */}
          {availableStreams.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📺 Available Live Streams
                  <Badge variant="destructive" className="bg-red-600">
                    {availableStreams.length} Live
                  </Badge>
                </CardTitle>
                <CardDescription>Select a stream to watch</CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={currentStream} onValueChange={setCurrentStream}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a stream" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStreams.map((stream) => (
                      <SelectItem key={stream._id} value={stream._id}>
                        {stream.title} -{' '}
                        {stream.user?.displayName || stream.user?.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}

          {/* Stream Player */}
          {availableStreams.length === 0 ? (
            <Card>
              <CardHeader className="text-center">
                <CardTitle>📺 No Active Streams</CardTitle>
                <CardDescription>
                  There are no active broadcasts right now. Ask a streamer to
                  start streaming!
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Card className="bg-primary/5 border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-sm">💡 How to watch:</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <p>1. Wait for a streamer to start broadcasting</p>
                    <p>
                      2. Or go to{' '}
                      <Button variant="link" className="p-0 h-auto" asChild>
                        <a href="/streamer">Streamer Dashboard</a>
                      </Button>{' '}
                      to start your own stream
                    </p>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Video Player */}
              <Card className="mb-8">
                <CardContent className="p-0">
                  <div className="bg-black rounded-lg overflow-hidden">
                    <div className="relative aspect-video">
                      {isPlaying ? (
                        <video
                          src={streamUrl}
                          controls
                          autoPlay
                          muted={isMuted}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            console.error('Video error:', e);
                            toast.error(
                              'Failed to load stream. Make sure the stream is active.'
                            );
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted">
                          <div className="text-center">
                            <Play className="w-16 h-16 mx-auto mb-4 text-primary" />
                            <p className="text-lg font-medium">
                              Click Play to start watching
                            </p>
                            <p className="text-sm text-muted-foreground mt-2">
                              Stream URL: {streamUrl}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Custom Controls */}
                    <div className="bg-card border-t p-4 flex items-center justify-center space-x-4">
                      <Button onClick={togglePlay} className="gap-2">
                        {isPlaying ? (
                          <>
                            <Pause className="w-4 h-4" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4" />
                            Play
                          </>
                        )}
                      </Button>

                      <Button
                        variant="secondary"
                        onClick={toggleMute}
                        className="gap-2"
                      >
                        {isMuted ? (
                          <>
                            <VolumeX className="w-4 h-4" />
                            Unmute
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-4 h-4" />
                            Mute
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Stream Info */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>📡 Stream Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium text-muted-foreground mb-2">
                        Current Stream:
                      </h3>
                      <p className="text-lg font-semibold text-primary">
                        {currentStream}
                      </p>
                    </div>

                    <div>
                      <h3 className="font-medium text-muted-foreground mb-2">
                        Stream Key:
                      </h3>
                      <p className="text-lg font-semibold text-green-600">
                        {availableStreams.find((s) => s._id === currentStream)
                          ?.streamKey || 'N/A'}
                      </p>
                    </div>

                    <div className="md:col-span-2">
                      <h3 className="font-medium text-muted-foreground mb-2">
                        HLS URL:
                      </h3>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 bg-muted px-3 py-2 rounded text-sm break-all">
                          {streamUrl}
                        </code>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={copyHLSUrl}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Card className="mt-6 bg-primary/5 border-primary/20">
                    <CardHeader>
                      <CardTitle className="text-sm">
                        💡 How to watch:
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-1">
                      <p>
                        1. Make sure the streamer is live (status "Live Now")
                      </p>
                      <p>2. Click the Play button above</p>
                      <p>3. For external player, copy the HLS URL above</p>
                      <p>
                        4. For mobile viewing, use VLC or similar HLS-compatible
                        app
                      </p>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>

              {/* Alternative Players */}
              <Card>
                <CardHeader>
                  <CardTitle>🔧 Alternative Players</CardTitle>
                  <CardDescription>
                    Use external applications to watch
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          VLC Media Player
                        </CardTitle>
                        <CardDescription>
                          Open VLC → Media → Open Network Stream → Paste HLS URL
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button
                          variant="secondary"
                          className="w-full gap-2"
                          onClick={() => {
                            window.open(`vlc://${streamUrl}`);
                            toast.success('Opening in VLC...');
                          }}
                        >
                          <ExternalLink className="h-4 w-4" />
                          Open in VLC
                        </Button>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          Direct HLS Link
                        </CardTitle>
                        <CardDescription>
                          Copy and paste this URL into any HLS-compatible player
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button
                          variant="secondary"
                          className="w-full gap-2"
                          onClick={copyHLSUrl}
                        >
                          <Copy className="h-4 w-4" />
                          Copy HLS URL
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
