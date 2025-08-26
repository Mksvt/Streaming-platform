'use client';

import { useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ViewerPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentStream, setCurrentStream] = useState('');
  const [availableStreams, setAvailableStreams] = useState<Array<{
    _id: string;
    title: string;
    user?: {
      displayName?: string;
      username?: string;
    };
    streamKey: string; // Added streamKey to the type definition
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [streamUrl, setStreamUrl] = useState(''); // Added streamUrl state

  // Fetch available streams from backend
  useEffect(() => {
    const fetchStreams = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/streams/live');
        if (response.ok) {
          const data = await response.json(); // Expecting { streams: [], count: N }
          setAvailableStreams(data.streams || []);
          if (data.streams && data.streams.length > 0) {
            setCurrentStream(data.streams[0]._id);
            // Use streamKey for HLS URL instead of stream ID
            setStreamUrl(`http://localhost:8000/live/${data.streams[0].streamKey}/index.m3u8`);
          }
        }
      } catch (error) {
        console.error('Failed to fetch streams:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStreams();
    // Poll for new streams every 5 seconds
    const interval = setInterval(fetchStreams, 5000);
    return () => clearInterval(interval);
  }, []);

  // Update stream URL when current stream changes
  useEffect(() => {
    if (currentStream && availableStreams.length > 0) {
      const selectedStream = availableStreams.find(stream => stream._id === currentStream);
      if (selectedStream) {
        // Use streamKey for HLS URL instead of stream ID
        setStreamUrl(`http://localhost:8000/live/${selectedStream.streamKey}/index.m3u8`);
      }
    }
  }, [currentStream, availableStreams]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading streams...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            🎥 Live Stream Viewer
          </h1>
          <p className="text-xl text-blue-200">
            Watch live streams from our platform
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Stream Selector */}
          {availableStreams.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                📺 Available Live Streams
              </h2>
              <select
                value={currentStream}
                onChange={(e) => setCurrentStream(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {availableStreams.map((stream) => (
                  <option key={stream._id} value={stream._id}>
                    {stream.title} - {stream.user?.displayName || stream.user?.username}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Stream Player */}
          {availableStreams.length === 0 ? (
            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                📺 No Live Streams Available
              </h2>
              <p className="text-gray-600 mb-4">
                There are no active streams right now. Ask a streamer to go live!
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">💡 How to watch:</h3>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Wait for a streamer to start broadcasting</li>
                  <li>Or go to <a href="/streamer" className="text-blue-600 hover:underline">Streamer Dashboard</a> to start your own stream</li>
                </ol>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-black rounded-lg shadow-2xl overflow-hidden mb-8">
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
                        toast.error('Failed to load stream. Make sure the stream is live.');
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-800">
                      <div className="text-center text-white">
                        <Play className="w-16 h-16 mx-auto mb-4 text-blue-400" />
                        <p className="text-lg">Click Play to start watching</p>
                        <p className="text-sm text-gray-400 mt-2">
                          Stream URL: {streamUrl}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Custom Controls */}
                <div className="bg-gray-800 p-4 flex items-center justify-center space-x-4">
                  <button
                    onClick={togglePlay}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="w-4 h-4 mr-2" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Play
                      </>
                    )}
                  </button>

                  <button
                    onClick={toggleMute}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center"
                  >
                    {isMuted ? (
                      <>
                        <VolumeX className="w-4 h-4 mr-2" />
                        Unmute
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-4 h-4 mr-2" />
                        Mute
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Stream Info */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  📡 Stream Information
                </h2>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">Current Stream:</h3>
                    <p className="text-lg font-semibold text-blue-600">{currentStream}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">Stream Key:</h3>
                    <p className="text-lg font-semibold text-green-600">
                      {availableStreams.find(s => s._id === currentStream)?.streamKey || 'N/A'}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">HLS URL:</h3>
                    <code className="bg-gray-100 px-3 py-2 rounded text-sm break-all">
                      {streamUrl}
                    </code>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">💡 How to watch:</h3>
                  <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                    <li>Make sure the streamer is live (green "Live Now" status)</li>
                    <li>Click the Play button above</li>
                    <li>If using external player, copy the HLS URL above</li>
                    <li>For mobile, use VLC or similar HLS-compatible app</li>
                  </ol>
                </div>
              </div>

              {/* Alternative Players */}
              <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  🔧 Alternative Players
                </h2>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">VLC Media Player</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Open VLC → Media → Open Network Stream → Paste HLS URL
                    </p>
                    <button
                      onClick={() => {
                        window.open(`vlc://${streamUrl}`);
                        toast.success('Opening in VLC...');
                      }}
                      className="bg-orange-600 text-white px-4 py-2 rounded text-sm hover:bg-orange-700"
                    >
                      Open in VLC
                    </button>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">Direct HLS Link</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Copy and paste this URL in any HLS-compatible player
                    </p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(streamUrl);
                        toast.success('HLS URL copied to clipboard!');
                      }}
                      className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
                    >
                      Copy HLS URL
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
