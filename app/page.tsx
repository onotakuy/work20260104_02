'use client';

import { useState } from 'react';
import VideoForm from '@/components/VideoForm';
import VideoList from '@/components/VideoList';

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleVideoAdded = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <main className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 dark:text-white">監視カメラ管理ダッシュボード</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
          YouTube監視カメラ動画から情報を取得・管理します
        </p>

        <div className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-2xl font-semibold mb-4 dark:text-white">新しい動画を登録</h2>
            <VideoForm onSuccess={handleVideoAdded} />
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4 dark:text-white">登録済み動画</h2>
          <VideoList key={refreshKey} />
        </div>
      </div>
    </main>
  );
}
