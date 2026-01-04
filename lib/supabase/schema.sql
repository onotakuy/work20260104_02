-- 監視カメラ動画テーブル
CREATE TABLE IF NOT EXISTS camera_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  youtube_url TEXT NOT NULL UNIQUE,
  youtube_video_id TEXT NOT NULL,
  title TEXT,
  description TEXT,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  r2_video_path TEXT,
  r2_thumbnail_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 動画解析結果テーブル
CREATE TABLE IF NOT EXISTS video_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  camera_video_id UUID NOT NULL REFERENCES camera_videos(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('motion_detection', 'object_detection', 'frame_extraction')),
  frame_number INTEGER,
  timestamp_seconds DECIMAL(10, 2),
  detected_objects JSONB,
  confidence_score DECIMAL(5, 2),
  r2_image_path TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_camera_videos_status ON camera_videos(status);
CREATE INDEX IF NOT EXISTS idx_camera_videos_youtube_video_id ON camera_videos(youtube_video_id);
CREATE INDEX IF NOT EXISTS idx_video_analyses_camera_video_id ON video_analyses(camera_video_id);
CREATE INDEX IF NOT EXISTS idx_video_analyses_analysis_type ON video_analyses(analysis_type);
CREATE INDEX IF NOT EXISTS idx_video_analyses_timestamp ON video_analyses(timestamp_seconds);

-- 更新日時の自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_camera_videos_updated_at BEFORE UPDATE ON camera_videos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
