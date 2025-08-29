'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import RegisterForm from '@/components/RegisterForm';
import LoginForm from '@/components/LoginForm';
import { Play, Users, Zap, Shield } from 'lucide-react';

export default function Home() {
  const [isLogin, setIsLogin] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [userData, setUserData] = useState(null);

  const handleRegistrationSuccess = (data: any) => {
    setUserData(data);
    setIsRegistered(true);
  };

  const handleLoginSuccess = (data: any) => {
    setUserData(data);
    setIsRegistered(true);
  };

  if (isRegistered && userData) {
    // Redirect to streamer page
    window.location.href = '/streamer';
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-foreground mb-4">
            Streaming Platform
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Платформа для стрімінгу та перегляду відео
          </p>

          {/* Navigation Links */}
          <div className="flex justify-center space-x-4">
            <Button size="lg" className="gap-2" asChild>
              <a href="/streamer">
                <Play className="h-4 w-4" />
                Streamer Dashboard
              </a>
            </Button>
            <Button size="lg" variant="secondary" className="gap-2" asChild>
              <a href="/viewer">
                <Users className="h-4 w-4" />
                Watch Streams
              </a>
            </Button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            {/* Features Section */}
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-6">
                  Починайте стрімити зараз
                </h2>
                <div className="grid gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Zap className="h-5 w-5 text-primary" />
                        Легко налаштовуйте трансляції
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>
                        Інтуїтивний інтерфейс для швидкого початку стрімінгу
                      </CardDescription>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        Автоматичне збереження ефірів
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>
                        Всі трансляції автоматично зберігаються для перегляду
                        пізніше
                      </CardDescription>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Play className="h-5 w-5 text-primary" />
                        Переглядайте у будь-якому браузері
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>
                        Підтримка всіх сучасних браузерів без додаткових
                        плагінів
                      </CardDescription>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        Безкоштовно та без обмежень
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>
                        Користуйтесь всіма функціями платформи абсолютно
                        безкоштовно
                      </CardDescription>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            {/* Auth Forms Section */}
            <div className="flex justify-center">
              {!isLogin ? (
                <RegisterForm
                  onSwitchToLogin={() => setIsLogin(true)}
                  onSuccess={handleRegistrationSuccess}
                />
              ) : (
                <LoginForm
                  onSwitchToRegister={() => setIsLogin(false)}
                  onSuccess={handleLoginSuccess}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
