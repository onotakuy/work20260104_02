export interface Database {
  public: {
    Tables: {
      camera_videos: {
        Row: {
          id: string;
          youtube_url: string;
          youtube_video_id: string;
          title: string | null;
          description: string | null;
          thumbnail_url: string | null;
          duration_seconds: number | null;
          status: 'pending' | 'processing' | 'completed' | 'failed';
          r2_video_path: string | null;
          r2_thumbnail_path: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          youtube_url: string;
          youtube_video_id: string;
          title?: string | null;
          description?: string | null;
          thumbnail_url?: string | null;
          duration_seconds?: number | null;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          r2_video_path?: string | null;
          r2_thumbnail_path?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          youtube_url?: string;
          youtube_video_id?: string;
          title?: string | null;
          description?: string | null;
          thumbnail_url?: string | null;
          duration_seconds?: number | null;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          r2_video_path?: string | null;
          r2_thumbnail_path?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      video_analyses: {
        Row: {
          id: string;
          camera_video_id: string;
          analysis_type: 'motion_detection' | 'object_detection' | 'frame_extraction';
          frame_number: number | null;
          timestamp_seconds: number | null;
          detected_objects: any | null;
          confidence_score: number | null;
          r2_image_path: string | null;
          metadata: any | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          camera_video_id: string;
          analysis_type: 'motion_detection' | 'object_detection' | 'frame_extraction';
          frame_number?: number | null;
          timestamp_seconds?: number | null;
          detected_objects?: any | null;
          confidence_score?: number | null;
          r2_image_path?: string | null;
          metadata?: any | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          camera_video_id?: string;
          analysis_type?: 'motion_detection' | 'object_detection' | 'frame_extraction';
          frame_number?: number | null;
          timestamp_seconds?: number | null;
          detected_objects?: any | null;
          confidence_score?: number | null;
          r2_image_path?: string | null;
          metadata?: any | null;
          created_at?: string;
        };
      };
    };
  };
}
