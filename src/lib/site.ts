export const SITE_NAME = "E-LearningLKA";
export const SITE_DESCRIPTION =
  "A learning platform for Sri Lankan students and teachers to organise classes, share materials, complete assessments, and follow progress.";

const DEPLOYED_ORIGIN = "https://elearninglka.duckdns.org";

// Read at call time: Docker receives APP_ORIGIN when the container starts,
// after the portable frontend image has already been built.
export function getPublicSiteOrigin(): string {
  const configuredOrigin = process.env.APP_ORIGIN;
  if (!configuredOrigin) return DEPLOYED_ORIGIN;

  try {
    const url = new URL(configuredOrigin);
    const hostname = url.hostname.toLowerCase();
    const isLocalHost = hostname === "localhost"
      || hostname.endsWith(".localhost")
      || hostname.endsWith(".local")
      || hostname === "[::1]"
      || /^(?:0|10|127)\./.test(hostname)
      || /^192\.168\./.test(hostname)
      || /^172\.(?:1[6-9]|2\d|3[01])\./.test(hostname)
      || !hostname.includes(".");

    if (url.protocol !== "https:" || url.username || url.password || isLocalHost) {
      return DEPLOYED_ORIGIN;
    }

    return url.origin;
  } catch {
    return DEPLOYED_ORIGIN;
  }
}
