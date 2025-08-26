'use client';

import { useState } from 'react';
import RegisterForm from '@/components/RegisterForm';

export default function Home() {
  const [isLogin, setIsLogin] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [userData, setUserData] = useState(null);

  const handleRegistrationSuccess = (data: any) => {
    setUserData(data);
    setIsRegistered(true);
  };

  if (isRegistered && userData) {
    // Redirect to streamer page
    window.location.href = '/streamer';
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Streaming Platform
          </h1>
          <p className="text-xl text-blue-200">
            Платформа для стрімінгу та перегляду відео
          </p>
          
          {/* Navigation Links */}
          <div className="mt-6 flex justify-center space-x-4">
            <a
              href="/streamer"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              🎬 Streamer Dashboard
            </a>
            <a
              href="/viewer"
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              📺 Watch Streams
            </a>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="text-white">
              <h2 className="text-3xl font-bold mb-4">
                Починайте стрімити зараз
              </h2>
              <ul className="space-y-3 text-lg">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                  Легко налаштовуйте трансляції
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                  Автоматичне збереження ефірів
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                  Переглядайте у будь-якому браузері
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                  Безкоштовно та без обмежень
                </li>
              </ul>
            </div>

            <div>
              {!isLogin ? (
                <RegisterForm 
                  onSwitchToLogin={() => setIsLogin(true)}
                  onSuccess={handleRegistrationSuccess}
                />
              ) : (
                <div className="bg-white rounded-lg shadow-lg p-8">
                  <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Увійти</h2>
                    <p className="text-gray-600 mb-6">Форма входу буде додана пізніше</p>
                    <button
                      onClick={() => setIsLogin(false)}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Створити акаунт
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
