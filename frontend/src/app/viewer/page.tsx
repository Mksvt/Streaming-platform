'use client';

import { useState, useEffect } from 'react';
import VideoPlayer from '@/components/VideoPlayer';
import { Loader2, WifiOff } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import io from 'socket.io-client';

interface Stream {
  _id: string;
  title: string;
  description: string;
  user: {
    _id: string;
    username: string;
    displayName: string;
    avatar?: string;
  };
  category: string;
  startedAt: string;
}

export default function ViewerPage() {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [currentStream, setCurrentStream] = useState<Stream | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const socket = io('http://localhost:3001');

    socket.on('streams-updated', (updatedStreams: Stream[]) => {
      setStreams(updatedStreams);
      setIsLoading(false);

      if (updatedStreams.length === 0) {
        setCurrentStream(null); 
      } else if (
        !currentStream ||
        !updatedStreams.some((stream) => stream._id === currentStream._id)
      ) {
        setCurrentStream(updatedStreams[0]); 
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [currentStream]);

  const handleStreamChange = (streamId: string) => {
    const selected = streams.find((s) => s._id === streamId);
    if (selected) {
      setCurrentStream(selected);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background text-foreground">
        <Loader2 className="h-16 w-16 animate-spin" />
        <p className="ml-4 text-xl">Finding Live Streams...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      <div className="flex-1 flex flex-col">
        <main className="flex-1 bg-black flex items-center justify-center">
          {currentStream ? (
            <VideoPlayer
              src={`http://localhost:8000/live/${currentStream.user.username}/index.m3u8`}
              autoPlay
            />
          ) : (
            <div className="text-center text-white">
              <WifiOff className="mx-auto h-24 w-24 text-muted-foreground" />
              <h2 className="mt-6 text-4xl font-bold">No Live Streams</h2>
              <p className="mt-2 text-lg text-muted-foreground">
                There are no channels streaming right now.
              </p>
            </div>
          )}
        </main>
        {currentStream && (
          <footer className="p-4 border-t border-border bg-card">
            <div>
              <h2 className="text-2xl font-bold">{currentStream.title}</h2>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <img
                    src={
                      currentStream.user.avatar ||
                      `https://avatar.vercel.sh/${currentStream.user.username}.png`
                    }
                    alt={currentStream.user.displayName}
                    className="h-10 w-10 rounded-full"
                  />
                  <div>
                    <p className="font-semibold">
                      {currentStream.user.displayName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      @{currentStream.user.username}
                    </p>
                  </div>
                </div>
                <Badge>{currentStream.category || 'No Category'}</Badge>
              </div>
              <p className="mt-2 text-muted-foreground">
                {currentStream.description || 'No description.'}
              </p>
            </div>
          </footer>
        )}
      </div>
      {streams.length > 0 && (
        <aside className="w-80 border-l border-border p-4 flex flex-col space-y-4 overflow-y-auto">
          <h3 className="text-xl font-bold">Live Channels</h3>
          {streams.map((stream) => (
            <Card
              key={stream._id}
              className={`cursor-pointer hover:border-primary transition-all ${
                currentStream?._id === stream._id
                  ? 'border-primary ring-2 ring-primary'
                  : 'border-border'
              }`}
              onClick={() => handleStreamChange(stream._id)}
            >
              <CardHeader className="p-4">
                <CardTitle className="text-base truncate">
                  {stream.title}
                </CardTitle>
                <CardDescription>{stream.user.displayName}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </aside>
      )}
    </div>
  );
}
