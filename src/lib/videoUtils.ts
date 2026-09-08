/**
 * Utility to convert various video URLs (YouTube, youtu.be, Shorts, Google Drive, Vimeo, MP4)
 * into iframe-embeddable or HTML5-compatible player sources.
 */
export interface EmbedVideoResult {
  embedUrl: string;
  isDirectVideo: boolean;
  originalUrl: string;
}

export function getEmbedVideoUrl(url?: string | null): EmbedVideoResult {
  if (!url || typeof url !== "string") {
    return { embedUrl: "", isDirectVideo: false, originalUrl: "" };
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return { embedUrl: "", isDirectVideo: false, originalUrl: "" };
  }

  // Ensure protocol for external URLs if missing
  const normalizedUrl =
    trimmed.startsWith("http://") || trimmed.startsWith("https://")
      ? trimmed
      : `https://${trimmed}`;

  // 1. Direct video files (.mp4, .webm, .ogg)
  if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(trimmed)) {
    return {
      embedUrl: normalizedUrl,
      isDirectVideo: true,
      originalUrl: normalizedUrl,
    };
  }

  // 2. YouTube youtu.be/<id>
  const youtuBeMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (youtuBeMatch) {
    return {
      embedUrl: `https://www.youtube-nocookie.com/embed/${youtuBeMatch[1]}?autoplay=1&rel=0`,
      isDirectVideo: false,
      originalUrl: `https://www.youtube.com/watch?v=${youtuBeMatch[1]}`,
    };
  }

  // 3. YouTube watch?v=<id>, shorts/<id>, or embed/<id>
  const youtubeMatch = trimmed.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=))([a-zA-Z0-9_-]{11})/
  );
  if (youtubeMatch) {
    return {
      embedUrl: `https://www.youtube-nocookie.com/embed/${youtubeMatch[1]}?autoplay=1&rel=0`,
      isDirectVideo: false,
      originalUrl: `https://www.youtube.com/watch?v=${youtubeMatch[1]}`,
    };
  }

  // 4. Google Drive
  const gDriveMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (gDriveMatch) {
    return {
      embedUrl: `https://drive.google.com/file/d/${gDriveMatch[1]}/preview`,
      isDirectVideo: false,
      originalUrl: normalizedUrl,
    };
  }

  // 5. Vimeo
  const vimeoMatch = trimmed.match(
    /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)/
  );
  if (vimeoMatch) {
    return {
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[3]}?autoplay=1`,
      isDirectVideo: false,
      originalUrl: normalizedUrl,
    };
  }

  // Fallback (e.g. Zoom recording, standard embed, or direct URL)
  return {
    embedUrl: normalizedUrl,
    isDirectVideo: false,
    originalUrl: normalizedUrl,
  };
}
