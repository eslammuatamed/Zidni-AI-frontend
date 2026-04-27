export const MAX_LESSON_VIDEO_DURATION_SECONDS = 20 * 60;

export interface VideoFileMetadata {
  durationSeconds: number | null;
  width: number | null;
  height: number | null;
}

export function extractVideoMetadata(file: File, timeoutMs = 8000): Promise<VideoFileMetadata> {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') {
      resolve({ durationSeconds: null, width: null, height: null });
      return;
    }

    const video = document.createElement('video');
    video.preload = 'metadata';
    const url = URL.createObjectURL(file);
    let settled = false;

    const finish = (metadata: VideoFileMetadata) => {
      if (settled) return;
      settled = true;
      URL.revokeObjectURL(url);
      resolve(metadata);
    };

    const timeout = window.setTimeout(() => {
      finish({ durationSeconds: null, width: null, height: null });
    }, Math.max(2000, timeoutMs));

    video.onloadedmetadata = () => {
      window.clearTimeout(timeout);
      const durationSeconds = Number.isFinite(video.duration) ? Math.round(video.duration) : null;
      const width = video.videoWidth > 0 ? Math.round(video.videoWidth) : null;
      const height = video.videoHeight > 0 ? Math.round(video.videoHeight) : null;
      finish({ durationSeconds, width, height });
    };

    video.onerror = () => {
      window.clearTimeout(timeout);
      finish({ durationSeconds: null, width: null, height: null });
    };

    video.src = url;
  });
}
