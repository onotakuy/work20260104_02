'use client';

import { useEffect, useState } from 'react';

interface Video {
  id: string;
  youtube_url: string;
  youtube_video_id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  duration_seconds: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
}

export default function VideoList() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchVideos = async () => {
    try {
      const response = await fetch('/api/videos');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch videos');
      }

      setVideos(data.videos || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleProcess = async (videoId: string) => {
    setProcessingId(videoId);
    try {
      const response = await fetch(`/api/videos/${videoId}/process`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process video');
      }

      // 動画一覧を再取得
      await fetchVideos();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setProcessingId(null);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: '待機中', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
      processing: { label: '処理中', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
      completed: { label: '完了', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
      failed: { label: '失敗', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.pending;

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 dark:text-gray-400">読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg dark:bg-red-900 dark:border-red-700 dark:text-red-200">
        {error}
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 dark:text-gray-400">登録されている動画がありません</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {videos.map((video) => (
        <div
          key={video.id}
          className="border border-gray-300 rounded-lg overflow-hidden hover:shadow-lg transition-shadow dark:border-gray-600 dark:bg-gray-800"
        >
          <div className="relative">
            <img
              src={video.thumbnail_url}
              alt={video.title}
              className="w-full h-48 object-cover"
            />
            <div className="absolute top-2 right-2">
              {getStatusBadge(video.status)}
            </div>
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-lg mb-2 line-clamp-2 dark:text-white">
              {video.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
              {video.description || '説明なし'}
            </p>
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-3">
              <span>再生時間: {formatDuration(video.duration_seconds)}</span>
              <a
                href={video.youtube_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                動画を見る →
              </a>
            </div>
            {video.status === 'pending' && (
              <button
                onClick={() => handleProcess(video.id)}
                disabled={processingId === video.id}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {processingId === video.id ? '処理中...' : '動画を処理'}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
