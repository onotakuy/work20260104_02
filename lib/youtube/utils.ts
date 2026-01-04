import ytdl from 'ytdl-core';

/**
 * YouTube URLから動画IDを抽出
 */
export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

/**
 * YouTube URLが有効かチェック
 */
export function isValidYouTubeUrl(url: string): boolean {
  return extractVideoId(url) !== null;
}

/**
 * YouTube動画情報を取得
 */
export async function getYouTubeVideoInfo(videoId: string) {
  try {
    const info = await ytdl.getInfo(videoId);
    
    return {
      videoId: info.videoDetails.videoId,
      title: info.videoDetails.title,
      description: info.videoDetails.description || '',
      thumbnailUrl: info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1]?.url || '',
      duration: parseInt(info.videoDetails.lengthSeconds) || 0,
      channelTitle: info.videoDetails.ownerChannelName || info.videoDetails.author?.name,
      publishedAt: info.videoDetails.publishDate,
    };
  } catch (error) {
    console.error('Error fetching YouTube video info:', error);
    throw new Error(`Failed to fetch video info: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
