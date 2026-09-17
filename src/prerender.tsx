import fs from 'fs';
import path from 'path';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { getAllStaticRoutes, getRouteMetadata, TOOL_ALIAS_MAP } from './utils/routeMetadata';
import { getAbsoluteUrl, SITE_URL, SITE_CONFIG } from './config/site';

const DIST_DIR = path.resolve(process.cwd(), 'dist');
const TEMPLATE_PATH = path.join(DIST_DIR, 'index.html');

async function prerender() {
  console.log('🚀 Starting OmniMetrics Hub Static Pre-Rendering (SSG)...');

  if (!fs.existsSync(TEMPLATE_PATH)) {
    throw new Error(
      `Template index.html not found at ${TEMPLATE_PATH}. Please run "vite build" first.`
    );
  }

  const rawTemplate = fs.readFileSync(TEMPLATE_PATH, 'utf-8');

  // Clean the base template of any prior head SEO tags to ensure exactly 1 canonical & 1 description per page
  const cleanTemplate = rawTemplate
    .replace(/<title>[\s\S]*?<\/title>/gi, '')
    .replace(/<link\s+[^>]*rel=["']canonical["'][^>]*>/gi, '')
    .replace(/<meta\s+[^>]*name=["']description["'][^>]*>/gi, '')
    .replace(/<meta\s+[^>]*name=["']keywords["'][^>]*>/gi, '')
    .replace(/<meta\s+[^>]*property=["']og:[^"']*["'][^>]*>/gi, '')
    .replace(/<meta\s+[^>]*name=["']twitter:[^"']*["'][^>]*>/gi, '')
    .replace(/<script\s+[^>]*id=["']json-ld-structured-data["'][^>]*>[\s\S]*?<\/script>/gi, '');

  const routes = getAllStaticRoutes();
  console.log(`📄 Found ${routes.length} static routes to pre-render.`);

  let renderedCount = 0;

  for (const route of routes) {
    const meta = getRouteMetadata(route);
    const canonicalUrl = getAbsoluteUrl(meta.canonicalPath);

    // 1. Render App to static HTML string
    const appHtml = renderToString(
      React.createElement(
        MemoryRouter,
        { initialEntries: [route] },
        React.createElement(App)
      )
    );

    // 2. Prepare structured data
    const schemaData =
      meta.schemaData || {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebSite',
            name: 'OmniMetrics Hub',
            url: `${SITE_URL}/`,
            description:
              'High-precision financial, e-commerce, freelance, and marketing calculators for founders and creators.',
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
      };

    // 3. Build head elements (strictly 1 title, 1 canonical, 1 description)
    const headMetaTags = `
    <title>${escapeHtml(meta.title)}</title>
    <meta name="description" content="${escapeAttr(meta.description)}" />
    ${meta.keywords && meta.keywords.length > 0 ? `<meta name="keywords" content="${escapeAttr(meta.keywords.join(', '))}" />` : ''}
    <link rel="canonical" href="${canonicalUrl}" />
    <!-- OpenGraph Tags -->
    <meta property="og:site_name" content="OmniMetrics Hub" />
    <meta property="og:title" content="${escapeAttr(meta.title)}" />
    <meta property="og:description" content="${escapeAttr(meta.description)}" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:type" content="${meta.ogType || 'website'}" />
    <meta property="og:image" content="${meta.ogImage || SITE_CONFIG.defaultOgImage}" />
    <!-- Twitter Card Tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeAttr(meta.title)}" />
    <meta name="twitter:description" content="${escapeAttr(meta.description)}" />
    <meta name="twitter:image" content="${meta.ogImage || SITE_CONFIG.defaultOgImage}" />
    <!-- Schema.org JSON-LD -->
    <script type="application/ld+json" id="json-ld-structured-data">${JSON.stringify(schemaData)}</script>
`;

    // 4. Inject metadata & rendered app into pristine clean template
    let html = cleanTemplate;

    // Inject head tags before </head>
    html = html.replace('</head>', `${headMetaTags}</head>`);

    // Inject prerendered React HTML into root div
    html = html.replace(
      /<div id=["']root["']>[\s\S]*?<\/div>/,
      `<div id="root">${appHtml}</div>`
    );

    // 5. Determine target file path
    let outFilePath: string;
    if (route === '/') {
      outFilePath = path.join(DIST_DIR, 'index.html');
    } else if (route === '/404') {
      outFilePath = path.join(DIST_DIR, '404.html');
    } else {
      const routePath = route.startsWith('/') ? route.slice(1) : route;
      const targetDir = path.join(DIST_DIR, routePath);
      fs.mkdirSync(targetDir, { recursive: true });
      outFilePath = path.join(targetDir, 'index.html');
    }

    fs.writeFileSync(outFilePath, html, 'utf-8');
    renderedCount++;
  }

  // 6. Generate dynamic sitemap.xml in dist/ containing ONLY canonical URLs
  const indexableRoutes = routes.filter((r) => {
    if (r === '/404') return false;
    // Exclude secondary prefix variants from sitemap (they have canonical links to /tools/ and /blog/)
    if (r.startsWith('/calculators/')) return false;
    if (r.startsWith('/calculator/')) return false;
    if (r.startsWith('/guides/')) return false;
    if (r.startsWith('/articles/')) return false;
    // Exclude legacy alias routes from sitemap
    if (r.startsWith('/tools/')) {
      const slug = r.split('/')[2];
      if (TOOL_ALIAS_MAP[slug]) return false;
    }
    return true;
  });
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${indexableRoutes
  .map((r) => {
    const loc = getAbsoluteUrl(r);
    const priority = r === '/' ? '1.0' : r.startsWith('/tools/') ? '0.9' : r.startsWith('/blog/') ? '0.8' : '0.6';
    const changefreq = r === '/' || r === '/calculators' || r === '/blog' ? 'weekly' : 'monthly';
    return `  <url>
    <loc>${loc}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
  })
  .join('\n')}
</urlset>
`;
  fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), sitemapXml.trim() + '\n', 'utf-8');

  // 7. Generate dynamic robots.txt in dist/ referencing active SITE_URL
  const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${getAbsoluteUrl('/sitemap.xml')}
`;
  fs.writeFileSync(path.join(DIST_DIR, 'robots.txt'), robotsTxt, 'utf-8');

  console.log(`✅ Successfully pre-rendered ${renderedCount} pages into dist/`);
  console.log(`✅ Synchronized sitemap.xml and robots.txt with ${SITE_URL}`);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

prerender().catch((err) => {
  console.error('❌ Prerendering failed:', err);
  process.exit(1);
});
