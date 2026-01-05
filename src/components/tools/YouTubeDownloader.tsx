'use client';

import { ArrowLeft, Download, Play, Link, AlertCircle, CheckCircle } from 'lucide-react';
import { useState } from 'react';

interface YouTubeDownloaderProps {
  onBack: () => void;
}

export function YouTubeDownloader({ onBack }: YouTubeDownloaderProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [videoInfo, setVideoInfo] = useState<any>(null);

  const handleDownload = async () => {
    if (!url.trim()) {
      setError('Lütfen bir YouTube URL\'si girin');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Mock video bilgisi
      const mockVideoInfo = {
        title: 'Örnek Video Başlığı',
        thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
        duration: '3:32',
        views: '1.2M',
        uploadDate: '2023-01-15'
      };

      setVideoInfo(mockVideoInfo);
      setSuccess('Video başarıyla analiz edildi! İndirme seçenekleri hazır.');
    } catch (err) {
      setError('Video analiz edilirken bir hata oluştu. Lütfen geçerli bir YouTube URL\'si girin.');
    } finally {
      setLoading(false);
    }
  };

  const downloadVideo = (quality: string) => {
    console.log(`Video indiriliyor: ${quality} kalitesinde`);
    setSuccess(`${quality} kalitesinde video indiriliyor...`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 py-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="p-2 bg-gradient-to-r from-[#9c6cfe] to-[#0ad2dd] rounded-lg flex-shrink-0">
                <Play className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-2xl font-black text-gray-900 truncate">YOUTUBE DOWNLOADER</h1>
                <p className="text-xs sm:text-base text-gray-600 truncate">YouTube videolarını indirin</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">YouTube Video İndirici</h2>
            <p className="text-gray-600">
              YouTube video URL'sini girin ve istediğiniz kalitede indirin
            </p>
          </div>

          {/* URL Input */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              YouTube Video URL'si
            </label>
            <div className="flex gap-4">
              <div className="flex-1">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c6cfe] focus:border-transparent"
                />
              </div>
              <button
                onClick={handleDownload}
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-[#9c6cfe] to-[#0ad2dd] text-white rounded-lg hover:from-[#8b5cf6] hover:to-[#0bc4cf] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Analiz Ediliyor...
                  </>
                ) : (
                  <>
                    <Link className="w-4 h-4" />
                    Analiz Et
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              <p className="text-green-700">{success}</p>
            </div>
          )}

          {/* Video Info */}
          {videoInfo && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Video Bilgileri</h3>
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex gap-6">
                  <img
                    src={videoInfo.thumbnail}
                    alt="Video thumbnail"
                    className="w-48 h-36 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">{videoInfo.title}</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p><span className="font-medium">Süre:</span> {videoInfo.duration}</p>
                      <p><span className="font-medium">Görüntülenme:</span> {videoInfo.views}</p>
                      <p><span className="font-medium">Yüklenme Tarihi:</span> {videoInfo.uploadDate}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Download Options */}
          {videoInfo && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">İndirme Seçenekleri</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Video Quality Options */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Video Kalitesi</h4>
                  <div className="space-y-2">
                    <button
                      onClick={() => downloadVideo('1080p')}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      1080p HD
                    </button>
                    <button
                      onClick={() => downloadVideo('720p')}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      720p HD
                    </button>
                    <button
                      onClick={() => downloadVideo('480p')}
                      className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      480p
                    </button>
                    <button
                      onClick={() => downloadVideo('360p')}
                      className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      360p
                    </button>
                  </div>
                </div>

                {/* Audio Only Options */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Sadece Ses</h4>
                  <div className="space-y-2">
                    <button
                      onClick={() => downloadVideo('MP3 320kbps')}
                      className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      MP3 320kbps
                    </button>
                    <button
                      onClick={() => downloadVideo('MP3 128kbps')}
                      className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      MP3 128kbps
                    </button>
                    <button
                      onClick={() => downloadVideo('AAC')}
                      className="w-full px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      AAC
                    </button>
                  </div>
                </div>

                {/* Other Options */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Diğer Seçenekler</h4>
                  <div className="space-y-2">
                    <button
                      onClick={() => downloadVideo('Thumbnail')}
                      className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Thumbnail
                    </button>
                    <button
                      onClick={() => downloadVideo('Subtitles')}
                      className="w-full px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Altyazılar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8 bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">Nasıl Kullanılır?</h3>
            <ol className="list-decimal list-inside space-y-2 text-blue-800">
              <li>YouTube'da istediğiniz videoyu açın</li>
              <li>Video URL'sini kopyalayın</li>
              <li>URL'yi yukarıdaki kutuya yapıştırın</li>
              <li>"Analiz Et" butonuna tıklayın</li>
              <li>İstediğiniz kalitede indirme seçeneğini seçin</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}