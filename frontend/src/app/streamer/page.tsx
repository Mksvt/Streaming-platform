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

interface StreamerPageProps {
  user: {
    username: string;
    displayName: string;
    streamKey: string;
    isStreamer: boolean;
  };
}

export default function StreamerPage() {
  const [showStreamKey, setShowStreamKey] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamTitle, setStreamTitle] = useState('');
  const [streamDescription, setStreamDescription] = useState('');
  const [streamInfo, setStreamInfo] = useState<{
    streamId: string;
    rtmpUrl: string;
    hlsUrl: string;
  } | null>(null);

  // Тимчасові дані для тестування
  const user = {
    username: 'heur',
    displayName: 'Heur',
    streamKey: 'heur-stream-key-12345',
    isStreamer: true,
  };

  const copyStreamKey = async () => {
    try {
      await navigator.clipboard.writeText(user.streamKey);
      toast.success('Ключ потоку скопійовано!');
    } catch (error) {
      toast.error('Не вдалось скопіювати ключ потоку');
    }
  };

  const startStream = async () => {
    if (!streamTitle.trim()) {
      toast.error('Будь ласка, введіть назву стріму');
      return;
    }

    // Get token from localStorage
    const token = localStorage.getItem('token');
    console.log('Token from localStorage:', token);

    if (!token) {
      toast.error(
        'Не знайдено токен автентифікації. Будь ласка, зареєструйтесь або увійдіть.'
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
        throw new Error(result.error || 'Не вдалось запустити стрім');
      }

      setIsStreaming(true);
      toast.success('Стрім запущено! RTMP потік тепер в ефірі.');

      // Store stream info
      setStreamInfo(result);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Не вдалось запустити стрім'
      );
    }
  };

  const stopStream = async () => {
    if (!streamInfo?.streamId) {
      toast.error('Немає активного стріму для зупинки');
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
        throw new Error(result.error || 'Не вдалось зупинити стрім');
      }

      setIsStreaming(false);
      setStreamInfo(null);
      toast.success('Стрім зупинено!');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Не вдалось зупинити стрім'
      );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Ласкаво просимо, {user.displayName}! 🎬
          </h1>
          <p className="text-xl text-muted-foreground">
            Ваша панель керування стрімами
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
          {/* Stream Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Налаштування стріму
              </CardTitle>
              <CardDescription>
                Налаштуйте параметри вашої трансляції
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="stream-title">Назва стріму</Label>
                <Input
                  id="stream-title"
                  type="text"
                  value={streamTitle}
                  onChange={(e) => setStreamTitle(e.target.value)}
                  placeholder="Введіть назву вашого стріму"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stream-description">Опис</Label>
                <textarea
                  id="stream-description"
                  value={streamDescription}
                  onChange={(e) => setStreamDescription(e.target.value)}
                  rows={3}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Опишіть ваш стрім"
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
                    Почати стрім
                  </Button>
                ) : (
                  <Button
                    onClick={stopStream}
                    variant="destructive"
                    className="w-full gap-2"
                    size="lg"
                  >
                    <Square className="h-4 w-4" />
                    Зупинити стрім
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
                Налаштування OBS
              </CardTitle>
              <CardDescription>
                Інформація для підключення OBS Studio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Ключ потоку</Label>
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
                    Налаштування OBS Studio:
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  <p>
                    <strong>Тип стріму:</strong> Власний
                  </p>
                  <p>
                    <strong>Сервер:</strong> rtmp://localhost:1935/live
                  </p>
                  <p>
                    <strong>Ключ потоку:</strong> {user.streamKey}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-secondary/50 border-secondary">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">
                    Перегляд вашого стріму:
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <p className="mb-2">
                    Після початку стріму, глядачі зможуть переглядати за
                    адресою:
                  </p>
                  <code className="block bg-muted p-2 rounded text-xs break-all">
                    http://localhost:8000/live/{user.streamKey}/index.m3u8
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
                  🎥 В ефірі зараз: {streamTitle}
                </CardTitle>
                <CardDescription className="text-green-700">
                  Ваш стрім наразі транслюється і записується!
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <Card>
                    <CardContent className="p-3">
                      <strong>ID стріму:</strong> {streamInfo.streamId}
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
                      <strong>Глядачі можуть переглядати:</strong>{' '}
                      <Button variant="link" className="p-0 h-auto" asChild>
                        <a href={streamInfo.hlsUrl} target="_blank">
                          Відкрити стрім
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
