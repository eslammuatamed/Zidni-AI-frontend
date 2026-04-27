import { isHlsUrl } from '@/utils/media';

export interface HlsInstance {
  loadSource(src: string): void;
  attachMedia(media: HTMLMediaElement): void;
  destroy(): void;
}

export interface HlsConstructor {
  new (): HlsInstance;
  isSupported(): boolean;
}

declare global {
  interface Window {
    Hls?: HlsConstructor;
  }
}

const HLS_SCRIPT_SRC = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.17/dist/hls.min.js';

let loaderPromise: Promise<HlsConstructor | null> | null = null;

export const loadHlsLibrary = async (): Promise<HlsConstructor | null> => {
  if (typeof window === 'undefined') {
    return null;
  }

  if (window.Hls && typeof window.Hls.isSupported === 'function') {
    return window.Hls;
  }

  if (loaderPromise) {
    return loaderPromise;
  }

  loaderPromise = new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = HLS_SCRIPT_SRC;
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      if (window.Hls && window.Hls.isSupported()) {
        resolve(window.Hls);
      } else {
        loaderPromise = null;
        resolve(null);
      }
    };
    script.onerror = () => {
      loaderPromise = null;
      resolve(null);
    };
    document.head.appendChild(script);
  });

  return loaderPromise;
};

export const setupVideoSource = async (
  videoEl: HTMLVideoElement | null,
  source: string | null,
  destroy: () => void
): Promise<HlsInstance | null> => {
  if (!videoEl) {
    return null;
  }

  destroy();

  if (!source) {
    videoEl.removeAttribute('src');
    videoEl.load();
    return null;
  }

  if (isHlsUrl(source)) {
    const Hls = await loadHlsLibrary();
    if (Hls && Hls.isSupported()) {
      const instance = new Hls();
      instance.loadSource(source);
      instance.attachMedia(videoEl);
      return instance;
    }

    if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
      videoEl.src = source;
      videoEl.load();
      return null;
    }
  }

  videoEl.src = source;
  videoEl.load();
  return null;
};
