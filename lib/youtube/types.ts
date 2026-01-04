export interface YouTubeVideoInfo {
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  duration: number; // 秒
  channelTitle?: string;
  publishedAt?: string;
}

export interface VideoProcessingStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  error?: string;
}
