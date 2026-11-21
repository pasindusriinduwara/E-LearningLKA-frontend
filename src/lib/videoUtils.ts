/** Only web URLs and local absolute paths may be opened as learning resources. */
export function getSafeResourceUrl(value?: string | null): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed || /[\u0000-\u001f\u007f\\]/.test(trimmed)) return "";
  if (trimmed.startsWith("/")) return trimmed.startsWith("//") ? "" : trimmed;

  const hasScheme = /^[a-z][a-z\d+.-]*:/i.test(trimmed);
  try {
    const url = new URL(hasScheme ? trimmed : `https://${trimmed}`);
    if (!["http:", "https:"].includes(url.protocol) || !url.hostname || url.username || url.password) return "";
    return url.href;
  } catch {
    return "";
  }
}

export interface EmbedVideoResult {
  embedUrl: string;
  isDirectVideo: boolean;
  originalUrl: string;
}

const youtubeHosts = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com"]);
const shortYoutubeHosts = new Set(["youtu.be", "www.youtu.be"]);
const vimeoHosts = new Set(["vimeo.com", "www.vimeo.com", "player.vimeo.com"]);

/** Build iframe URLs from known providers; other safe web URLs remain external links. */
export function getEmbedVideoUrl(value?: string | null): EmbedVideoResult {
  const originalUrl = getSafeResourceUrl(value);
  const unavailable = { embedUrl: "", isDirectVideo: false, originalUrl };
  if (!originalUrl) return unavailable;

  const url = new URL(originalUrl, "https://local.invalid");
  if (/\.(mp4|webm|ogg)$/i.test(url.pathname)) {
    return { embedUrl: originalUrl, isDirectVideo: true, originalUrl };
  }
  if (originalUrl.startsWith("/") || url.port) return unavailable;

  let youtubeId: string | null | undefined;
  if (shortYoutubeHosts.has(url.hostname)) youtubeId = url.pathname.match(/^\/([\w-]{11})\/?$/)?.[1];
  else if (youtubeHosts.has(url.hostname)) {
    youtubeId = url.pathname === "/watch" ? url.searchParams.get("v") : url.pathname.match(/^\/(?:embed|shorts|live|v|e)\/([\w-]{11})\/?$/)?.[1];
  }
  if (youtubeId && /^[\w-]{11}$/.test(youtubeId)) {
    return {
      embedUrl: `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0`,
      isDirectVideo: false,
      originalUrl: `https://www.youtube.com/watch?v=${youtubeId}`,
    };
  }

  if (url.hostname === "drive.google.com") {
    const driveId = url.pathname.match(/^\/file\/d\/([\w-]+)(?:\/(?:view|preview))?\/?$/)?.[1]
      || (["/open", "/uc"].includes(url.pathname) ? url.searchParams.get("id") : null);
    if (driveId && /^[\w-]+$/.test(driveId)) {
      return { embedUrl: `https://drive.google.com/file/d/${driveId}/preview`, isDirectVideo: false, originalUrl };
    }
  }

  if (vimeoHosts.has(url.hostname)) {
    const vimeoId = url.pathname.match(/^\/(?:video\/|channels\/[^/]+\/|groups\/[^/]+\/videos\/|album\/\d+\/video\/)?(\d+)\/?$/)?.[1];
    if (vimeoId) {
      return { embedUrl: `https://player.vimeo.com/video/${vimeoId}?autoplay=1`, isDirectVideo: false, originalUrl };
    }
  }
  return unavailable;
}
