/**
 * Centralized Site Configuration
 * Single source of truth for base canonical domain and absolute URLs.
 * To change domain in the future, update VITE_SITE_URL in .env or modify the default fallback here.
 */
export const SITE_URL: string = (
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SITE_URL) ||
  'https://omnimetricshub.pages.dev'
).replace(/\/+$/, '');

export const SITE_CONFIG = {
  name: 'OmniMetrics Hub',
  siteUrl: SITE_URL,
  logoUrl: `${SITE_URL}/assets/images/logo.png`,
  contactEmail: 'omnimetricshub@gmail.com',
  defaultOgImage: `${SITE_URL}/assets/images/logo.png`,
  emailjs: {
    serviceId: 'service_qfoy2xa',
    templateId: 'template_rza5fvr',
    publicKey: 'EKAHPvvVCQPeT4Szb',
  },
};

/**
 * Generates an absolute URL from a given relative path using the centralized site URL.
 * Policy: Root path returns trailing slash ('https://omnimetricshub.pages.dev/'),
 * and all subpaths strictly include trailing slash ('https://omnimetricshub.pages.dev/tools/slug/'),
 * while static asset files (.xml, .txt, .svg, .png) preserve standard file endings without slash.
 */
export function getAbsoluteUrl(path: string = ''): string {
  const trimmed = path.trim();
  if (!trimmed || trimmed === '/') {
    return `${SITE_URL}/`;
  }
  // Check if it's a file extension like .xml, .txt, .png, .svg
  if (/\.[a-zA-Z0-9]+$/.test(trimmed)) {
    const cleanPath = trimmed.replace(/^\/+/, '');
    return `${SITE_URL}/${cleanPath}`;
  }
  const cleanPath = trimmed.replace(/^\/+|\/+$/g, '');
  return `${SITE_URL}/${cleanPath}/`;
}
