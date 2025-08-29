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
      toast.success('HLS URL скопійовано!');
    } catch (error) {
      toast.error('Не вдалось скопіювати URL');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground text-xl">
            Завантажуємо стріми...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            🎥 Перегляд Live стрімів
          </h1>
          <p className="text-xl text-muted-foreground">
            Дивіться живі трансляції з нашої платформи
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Stream Selector */}
          {availableStreams.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📺 Доступні Live стріми
                  <Badge variant="destructive" className="bg-red-600">
                    {availableStreams.length} Live
                  </Badge>
                </CardTitle>
                <CardDescription>Оберіть стрім для перегляду</CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={currentStream} onValueChange={setCurrentStream}>
                  <SelectTrigger>
                    <SelectValue placeholder="Оберіть стрім" />
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
                <CardTitle>📺 Немає активних стрімів</CardTitle>
                <CardDescription>
                  Наразі немає активних трансляцій. Запросіть стрімера почати
                  трансляцію!
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Card className="bg-primary/5 border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-sm">
                      💡 Як переглядати:
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <p>1. Почекайте, поки стрімер почне трансляцію</p>
                    <p>
                      2. Або перейдіть до{' '}
                      <Button variant="link" className="p-0 h-auto" asChild>
                        <a href="/streamer">Streamer Dashboard</a>
                      </Button>
                      , щоб почати власний стрім
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
                              'Не вдалось завантажити стрім. Переконайтесь, що стрім активний.'
                            );
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted">
                          <div className="text-center">
                            <Play className="w-16 h-16 mx-auto mb-4 text-primary" />
                            <p className="text-lg font-medium">
                              Натисніть Play для початку перегляду
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
                            Пауза
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4" />
                            Відтворити
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
                            Увімкнути звук
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-4 h-4" />
                            Вимкнути звук
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
                  <CardTitle>📡 Інформація про стрім</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium text-muted-foreground mb-2">
                        Поточний стрім:
                      </h3>
                      <p className="text-lg font-semibold text-primary">
                        {currentStream}
                      </p>
                    </div>

                    <div>
                      <h3 className="font-medium text-muted-foreground mb-2">
                        Ключ стріму:
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
                        💡 Як переглядати:
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-1">
                      <p>
                        1. Переконайтесь, що стрімер в ефірі (статус "Live Now")
                      </p>
                      <p>2. Натисніть кнопку Play вище</p>
                      <p>3. Для зовнішнього плеєра скопіюйте HLS URL вище</p>
                      <p>
                        4. Для мобільного перегляду використовуйте VLC або
                        подібний HLS-сумісний додаток
                      </p>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>

              {/* Alternative Players */}
              <Card>
                <CardHeader>
                  <CardTitle>🔧 Альтернативні плеєри</CardTitle>
                  <CardDescription>
                    Використовуйте зовнішні програми для перегляду
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
                          Відкрийте VLC → Медіа → Відкрити мережевий потік →
                          Вставте HLS URL
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button
                          variant="secondary"
                          className="w-full gap-2"
                          onClick={() => {
                            window.open(`vlc://${streamUrl}`);
                            toast.success('Відкриваємо в VLC...');
                          }}
                        >
                          <ExternalLink className="h-4 w-4" />
                          Відкрити в VLC
                        </Button>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          Прямий HLS лінк
                        </CardTitle>
                        <CardDescription>
                          Скопіюйте та вставте цей URL в будь-який HLS-сумісний
                          плеєр
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button
                          variant="secondary"
                          className="w-full gap-2"
                          onClick={copyHLSUrl}
                        >
                          <Copy className="h-4 w-4" />
                          Скопіювати HLS URL
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
