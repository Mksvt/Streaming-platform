'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, User, Mail, Lock, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  displayName: string;
}

interface RegisterFormProps {
  onSuccess?: (data: any) => void;
  onSwitchToLogin?: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({
  onSuccess,
  onSwitchToLogin,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RegisterFormData>();

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);

      const response = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Registration failed');
      }

      // Save JWT token to localStorage
      if (result.token) {
        localStorage.setItem('token', result.token);
        console.log('JWT token saved:', result.token);
      }

      toast.success(
        'Registration successful! Redirecting to streamer dashboard...'
      );

      // Pass user data to parent component
      onSuccess?.(result);

      // Don't reset form immediately to show success message
      setTimeout(() => {
        reset();
      }, 1000);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Registration failed'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Створити акаунт</CardTitle>
        <CardDescription className="text-center">
          Приєднуйтесь до нашої стрімінгової платформи
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Ім'я користувача</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                {...register('username', {
                  required: "Ім'я користувача є обов'язковим",
                  minLength: {
                    value: 3,
                    message: "Ім'я користувача має бути не менше 3 символів",
                  },
                  maxLength: {
                    value: 30,
                    message: "Ім'я користувача має бути менше 30 символів",
                  },
                })}
                type="text"
                id="username"
                placeholder="Введіть ім'я користувача"
                className="pl-9"
              />
            </div>
            {errors.username && (
              <p className="text-sm text-destructive">
                {errors.username.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                {...register('email', {
                  required: "Email є обов'язковим",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Некоректна email адреса',
                  },
                })}
                type="email"
                id="email"
                placeholder="Введіть email"
                className="pl-9"
              />
            </div>
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">Відображуване ім'я</Label>
            <Input
              {...register('displayName', {
                required: "Відображуване ім'я є обов'язковим",
                maxLength: {
                  value: 50,
                  message: "Відображуване ім'я має бути менше 50 символів",
                },
              })}
              type="text"
              id="displayName"
              placeholder="Введіть відображуване ім'я"
            />
            {errors.displayName && (
              <p className="text-sm text-destructive">
                {errors.displayName.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Пароль</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                {...register('password', {
                  required: "Пароль є обов'язковим",
                  minLength: {
                    value: 6,
                    message: 'Пароль має бути не менше 6 символів',
                  },
                })}
                type={showPassword ? 'text' : 'password'}
                id="password"
                placeholder="Введіть пароль"
                className="pl-9 pr-9"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Створюю акаунт...
              </>
            ) : (
              'Створити акаунт'
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <div className="text-sm text-center text-muted-foreground">
          Вже маєте акаунт?{' '}
          <Button
            variant="link"
            className="p-0 h-auto font-normal"
            onClick={onSwitchToLogin}
          >
            Увійти
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default RegisterForm;
