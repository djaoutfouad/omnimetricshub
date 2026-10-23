import { useEffect } from 'react';
import { SITE_URL, getAbsoluteUrl, SITE_CONFIG } from '../config/site';

interface SeoProps {
  title: string;
  description: string;
  keywords?: string[];
  canonicalPath?: string;
  schemaData?: Record<string, unknown> | null;
}

export const SeoHead = ({
  title,
  description,
  canonicalPath = '',
  schemaData,
}: SeoProps) => {
  useEffect(() => {
    // Document Title (kept concise under 58 chars)
    const fullTitle = title.includes('OmniMetrics')
      ? title
      : `${title} | OmniMetrics`;
    document.title = fullTitle;

    // Helper to set or create meta tag, pruning any duplicates
    const setMetaTag = (attrName: string, attrValue: string, content: string) => {
      const elements = document.querySelectorAll(`meta[${attrName}="${attrValue}"]`);
      if (elements.length > 0) {
        elements[0].setAttribute('content', content);
        for (let i = 1; i < elements.length; i++) {
          elements[i].remove();
        }
      } else {
        const element = document.createElement('meta');
        element.setAttribute(attrName, attrValue);
        element.setAttribute('content', content);
        document.head.appendChild(element);
      }
    };

    // Meta Description
    setMetaTag('name', 'description', description);

    // Meta Keywords: strictly remove from DOM per modern search engine guidelines
    const existingKeywords = document.querySelectorAll('meta[name="keywords"]');
    existingKeywords.forEach((el) => el.remove());

    // Canonical Link - strictly maintain exactly one canonical tag ending with trailing slash
    const canonicalUrl = getAbsoluteUrl(canonicalPath);
    const existingCanonicals = document.querySelectorAll('link[rel="canonical"]');
    if (existingCanonicals.length > 0) {
      existingCanonicals[0].setAttribute('href', canonicalUrl);
      for (let i = 1; i < existingCanonicals.length; i++) {
        existingCanonicals[i].remove();
      }
    } else {
      const canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      canonicalLink.setAttribute('href', canonicalUrl);
      document.head.appendChild(canonicalLink);
    }

    // OpenGraph Tags
    setMetaTag('property', 'og:site_name', 'OmniMetrics Hub');
    setMetaTag('property', 'og:title', fullTitle);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:url', canonicalUrl);
    setMetaTag('property', 'og:type', canonicalPath.startsWith('/blog/') || canonicalPath.startsWith('/guides/') ? 'article' : 'website');
    setMetaTag('property', 'og:image', SITE_CONFIG.defaultOgImage);

    // Twitter Card Tags
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', fullTitle);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', SITE_CONFIG.defaultOgImage);

    // JSON-LD Structured Data
    const scriptId = 'json-ld-structured-data';
    let scriptTag = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = scriptId;
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }

    if (schemaData) {
      scriptTag.textContent = JSON.stringify(schemaData);
    } else {
      scriptTag.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebSite',
            name: 'OmniMetrics Hub',
            url: `${SITE_URL}/`,
            description: 'High-precision financial, e-commerce, freelance, and marketing calculators for founders and creators.',
          },
          {
            '@type': 'Organization',
            name: 'OmniMetrics Hub',
            url: `${SITE_URL}/`,
            logo: SITE_CONFIG.logoUrl,
            contactPoint: {
              '@type': 'ContactPoint',
              email: SITE_CONFIG.contactEmail,
              contactType: 'Customer Support',
            },
          },
        ],
      });
    }
  }, [title, description, canonicalPath, schemaData]);

  return null;
};
