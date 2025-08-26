'use client';

import { useState, useEffect } from 'react';
import { Video, Settings, Copy, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

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

  const copyStreamKey = async () => {
    try {
      await navigator.clipboard.writeText(user.streamKey);
      toast.success('Stream key copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy stream key');
    }
  };

  const startStream = async () => {
    if (!streamTitle.trim()) {
      toast.error('Please enter a stream title');
      return;
    }

    // Get token from localStorage
    const token = localStorage.getItem('token');
    console.log('Token from localStorage:', token);

    if (!token) {
      toast.error('No authentication token found. Please register or login first.');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/streams/start-test-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: streamTitle,
          description: streamDescription
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to start stream');
      }

      setIsStreaming(true);
      toast.success('Stream started! RTMP stream is now live.');
      
      // Store stream info
      setStreamInfo(result);
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to start stream');
    }
  };

  const stopStream = async () => {
    if (!streamInfo?.streamId) {
      toast.error('No active stream to stop');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/streams/${streamInfo.streamId}/stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to stop stream');
      }

      setIsStreaming(false);
      setStreamInfo(null);
      toast.success('Stream stopped!');
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to stop stream');
    }
  };

  // Тимчасові дані для тестування
  const user = {
    username: 'heur',
    displayName: 'Heur',
    streamKey: 'heur-stream-key-12345',
    isStreamer: true
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Welcome, {user.displayName}! 🎬
          </h1>
          <p className="text-xl text-blue-200">
            Your streaming dashboard
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
          {/* Stream Configuration */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Settings className="mr-3 h-6 w-6 text-blue-600" />
              Stream Settings
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stream Title
                </label>
                <input
                  type="text"
                  value={streamTitle}
                  onChange={(e) => setStreamTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your stream title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={streamDescription}
                  onChange={(e) => setStreamDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe your stream"
                />
              </div>

              <div className="pt-4">
                {!isStreaming ? (
                  <button
                    onClick={startStream}
                    className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
                  >
                    🚀 Start Streaming
                  </button>
                ) : (
                  <button
                    onClick={stopStream}
                    className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors"
                  >
                    ⏹️ Stop Streaming
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Stream Key & OBS Setup */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Video className="mr-3 h-6 w-6 text-blue-600" />
              OBS Setup
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stream Key
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type={showStreamKey ? 'text' : 'password'}
                    value={user.streamKey}
                    readOnly
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                  <button
                    onClick={() => setShowStreamKey(!showStreamKey)}
                    className="px-3 py-2 text-gray-600 hover:text-gray-800"
                  >
                    {showStreamKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                  <button
                    onClick={copyStreamKey}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">OBS Studio Settings:</h3>
                <div className="text-sm text-blue-800 space-y-1">
                  <p><strong>Stream Type:</strong> Custom</p>
                  <p><strong>Server:</strong> rtmp://localhost:1935/live</p>
                  <p><strong>Stream Key:</strong> {user.streamKey}</p>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-green-900 mb-2">View Your Stream:</h3>
                <p className="text-sm text-green-800">
                  Once streaming, viewers can watch at: <br />
                  <code className="bg-green-100 px-2 py-1 rounded">
                    http://localhost:8000/live/{user.streamKey}/index.m3u8
                  </code>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Current Stream Status */}
        {isStreaming && streamInfo && (
          <div className="max-w-6xl mx-auto mt-8">
            <div className="bg-green-100 border border-green-300 rounded-lg p-6">
              <h3 className="text-xl font-bold text-green-900 mb-2 text-center">
                🎥 Live Now: {streamTitle}
              </h3>
              <p className="text-green-700 text-center mb-4">
                Your stream is currently live and being recorded!
              </p>
              
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="bg-white p-3 rounded border">
                  <strong>Stream ID:</strong> {streamInfo.streamId}
                </div>
                <div className="bg-white p-3 rounded border">
                  <strong>RTMP URL:</strong> {streamInfo.rtmpUrl}
                </div>
                <div className="bg-white p-3 rounded border">
                  <strong>HLS URL:</strong> {streamInfo.hlsUrl}
                </div>
                <div className="bg-white p-3 rounded border">
                  <strong>Viewers can watch at:</strong> <a href={streamInfo.hlsUrl} target="_blank" className="text-blue-600 hover:underline">Open Stream</a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
