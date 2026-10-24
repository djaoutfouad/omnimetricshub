import { TOOLS_DATA } from '../data/tools';
import { ARTICLES_DATA } from '../data/articles';
import { SITE_URL, getAbsoluteUrl, SITE_CONFIG } from '../config/site';

export interface RouteMeta {
  title: string;
  description: string;
  canonicalPath: string;
  schemaData: Record<string, unknown> | null;
  ogType?: 'website' | 'article';
  ogImage?: string;
}

const ALIAS_MAP: Record<string, string> = {
  'loan-amortization-emi-guide': 'understanding-loan-amortization-emi',
  'compound-interest-growth-guide': 'compound-interest-explained',
  'late-payment-interest-guide': 'late-payment-interest-and-commercial-debt',
  'salary-take-home-pay-guide': 'salary-to-hourly-and-take-home-pay',
  'ecommerce-landed-cost-guide': 'landed-cost-and-tariffs-guide',
};

export const TOOL_ALIAS_MAP: Record<string, string> = {
  'profit-margin-markup': 'profit-margin',
  'break-even-point': 'break-even',
  'landed-cost-pricing': 'landed-cost',
  'net-salary-tax': 'salary-tax',
  'payment-fees': 'payment-gateway-fees',
  'roas': 'roas-calculator',
  'customer-lifetime-value': 'customer-ltv',
  'clv': 'customer-ltv',
  'late-interest': 'late-payment-interest',
};

// Strict, high-precision metadata maps calibrated for SEO [Title 45-58 chars, Desc 130-155 chars]
const TOOL_METADATA_MAP: Record<string, { title: string; description: string }> = {
  'payment-gateway-fees': {
    title: 'Payment Fee & Gross-Up Calculator | OmniMetrics',
    description:
      'Calculate processing fees for Stripe, PayPal, and merchant gateways. Estimate net payouts or solve for the gross invoice amount required to cover costs.',
  },
  'profit-margin': {
    title: 'Profit Margin & Markup Calculator | OmniMetrics',
    description:
      'Calculate gross profit margin, markup percentage, cost of goods, and target selling price for products and services with real-time mathematical formulas.',
  },
  'break-even': {
    title: 'Break-Even Point & Sales Unit Tool | OmniMetrics',
    description:
      'Calculate your business break-even point in units and revenue. Discover your safety margin and required sales volume based on fixed and variable costs.',
  },
  'roas-calculator': {
    title: 'ROAS & Ad Spend Profit Calculator | OmniMetrics',
    description:
      'Calculate return on ad spend multiplier, break-even ROAS, cost per acquisition, and net campaign profit after product COGS and marketing expenses.',
  },
  'conversion-rate-cpa': {
    title: 'Conversion Rate & CPA Calculator | OmniMetrics',
    description:
      'Calculate website conversion rates, cost per acquisition, cost per click, and projected visitor traffic required to achieve specific sales revenue goals.',
  },
  'landed-cost': {
    title: 'Total Landed Cost & Duty Calculator | OmniMetrics',
    description:
      'Calculate total landed cost for imported inventory including manufacturing FOB, ocean shipping, customs tariffs, port fees, and retail markup targets.',
  },
  'freelance-rate': {
    title: 'Freelance Hourly & Day Rate Tool | OmniMetrics',
    description:
      'Calculate sustainable freelance hourly, daily, and project rates based on target personal income, self-employment taxes, overhead, and billable hours.',
  },
  'late-payment-interest': {
    title: 'Late Payment Interest Calculator | OmniMetrics',
    description:
      'Calculate overdue invoice interest and statutory debt compensation fees for late B2B payments using standard European and UK commercial debt formulas.',
  },
  'compound-interest': {
    title: 'Compound Interest Growth Calculator | OmniMetrics',
    description:
      'Forecast long-term investment growth with monthly contributions and annual compounding interest. Project principal versus compound returns over time.',
  },
  'loan-emi': {
    title: 'Loan EMI & Amortization Calculator | OmniMetrics',
    description:
      'Calculate monthly loan EMI payments, total interest payable, and full loan amortization schedule for mortgages, auto loans, and personal financing.',
  },
  'customer-ltv': {
    title: 'Customer Lifetime Value Calculator | OmniMetrics',
    description:
      'Calculate customer lifetime value (LTV / CLV), profit LTV, and allowable customer acquisition cost (CAC) based on churn rate and average gross margins.',
  },
  'salary-tax': {
    title: 'Net Salary & Take-Home Pay Tool | OmniMetrics',
    description:
      'Estimate annual and monthly net take-home salary after federal and state income tax deductions, social security withholdings, and payroll taxes.',
  },
};

const ARTICLE_METADATA_MAP: Record<string, { title: string; description: string }> = {
  'payment-gateway-fees-breakdown': {
    title: 'Payment Processing Fees Breakdown | OmniMetrics',
    description:
      'Learn how payment gateway fees work across Stripe and PayPal. Understand interchange deductions, assessment fees, and the gross-up pricing formula.',
  },
  'margin-vs-markup-guide': {
    title: 'Margin vs Markup Pricing Math Guide | OmniMetrics',
    description:
      'Master the difference between margin and markup. Avoid common retail pricing pitfalls that erode cash flow and discover how to price products for profit.',
  },
  'how-to-calculate-roas': {
    title: 'How to Calculate ROAS & Ad Spend | OmniMetrics',
    description:
      'Learn how to calculate Return on Ad Spend (ROAS), determine your break-even threshold, and evaluate campaign profitability after COGS and overhead.',
  },
  'how-to-calculate-break-even': {
    title: 'How to Calculate Break-Even Point | OmniMetrics',
    description:
      'Step-by-step guide to calculating business break-even volume and revenue. Learn contribution margin formulas, fixed cost management, and safety buffers.',
  },
  'freelancer-pricing-formula': {
    title: 'Freelancer Hourly Pricing Formula | OmniMetrics',
    description:
      'Discover the mathematical formula to price your freelance services. Factor in non-billable hours, self-employment taxes, benefits, and target income.',
  },
  'customer-ltv-guide': {
    title: 'Customer Lifetime Value (LTV) Guide | OmniMetrics',
    description:
      'Comprehensive guide to Customer Lifetime Value (LTV). Learn to calculate profit LTV, evaluate retention metrics, and maintain a healthy 3:1 LTV to CAC.',
  },
  'compound-interest-explained': {
    title: 'Compound Interest Wealth Formula | OmniMetrics',
    description:
      'Explore the exponential mechanics of compound interest. Learn how recurring monthly contributions and reinvested gains accelerate long-term net worth.',
  },
  'understanding-loan-amortization-emi': {
    title: 'Loan Amortization & Monthly EMI Guide | OmniMetrics',
    description:
      'Understand how loan amortization schedules work. Learn how monthly EMI payments divide between principal and interest, and how early payoffs save money.',
  },
  'landed-cost-and-tariffs-guide': {
    title: 'Total Landed Cost & Tariffs Guide | OmniMetrics',
    description:
      'Demystify total landed cost for imported goods. Calculate customs duties, ocean freight, port charges, and insurance to protect e-commerce profit margins.',
  },
  'late-payment-interest-and-commercial-debt': {
    title: 'Late Payment Commercial Debt Guide | OmniMetrics',
    description:
      'Learn how statutory interest and recovery fees work on overdue B2B invoices. Protect your business cash flow with enforceable commercial payment terms.',
  },
  'salary-to-hourly-and-take-home-pay': {
    title: 'Gross vs Net Salary Paycheck Guide | OmniMetrics',
    description:
      'Convert annual gross salary into net take-home pay and hourly equivalents. Learn about tax brackets, FICA withholdings, and true disposable earnings.',
  },
  'conversion-rate-and-cpa-guide': {
    title: 'Conversion Rate & CPA Math Guide | OmniMetrics',
    description:
      'Understand the mathematics behind conversion rate (CR) and CPA. Learn how minor conversion rate uplifts create massive reductions in customer ad spend.',
  },
};

export function getRouteMetadata(rawPath: string): RouteMeta {
  const cleanPath = rawPath.replace(/\/+$/, '') || '/';

  // 1. Homepage
  if (cleanPath === '/') {
    return {
      title: 'Financial & Business Calculators | OmniMetrics',
      description:
        'Free high-precision financial calculators for founders, freelancers, and businesses. Calculate processing fees, profit margins, ROAS, and freelance rates.',
      canonicalPath: '/',
      ogType: 'website',
      schemaData: {
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
      },
    };
  }

  // 2. Calculators Index (/calculators or /tools)
  if (cleanPath === '/calculators' || cleanPath === '/tools') {
    return {
      title: 'Free Business Calculators Directory | OmniMetrics',
      description:
        'Explore our directory of 12 free financial, e-commerce, marketing, freelance, and loan calculators with real-time math and detailed formula guides.',
      canonicalPath: '/calculators/',
      ogType: 'website',
      schemaData: {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Free Business Calculators Directory | OmniMetrics',
        description:
          'Browse all 12 free financial, e-commerce, marketing, freelance, and investment calculators.',
        url: getAbsoluteUrl('/calculators/'),
        hasPart: TOOLS_DATA.map((tool) => ({
          '@type': 'WebApplication',
          name: tool.fullTitle,
          url: getAbsoluteUrl(`/tools/${tool.slug}/`),
        })),
      },
    };
  }

  // 2b. Blog & Knowledge Base Index (/blog or /guides)
  if (cleanPath === '/blog' || cleanPath === '/guides') {
    return {
      title: 'Business & Financial Math Guides | OmniMetrics',
      description:
        'Step-by-step mathematical guides covering payment gateway fees, unit economics, keystone pricing, break-even thresholds, loan EMI, and billing rates.',
      canonicalPath: '/blog/',
      ogType: 'website',
      schemaData: {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'CollectionPage',
            name: 'Business & Financial Math Guides | OmniMetrics',
            description:
              'In-depth mathematical guides, pricing formulas, payment gateway fee breakdowns, break-even methodologies, and unit economics benchmarks.',
            url: getAbsoluteUrl('/blog/'),
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: `${SITE_URL}/`,
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Guides & Knowledge Base',
                item: getAbsoluteUrl('/blog/'),
              },
            ],
          },
        ],
      },
    };
  }

  // 2c. Methodology Page (/methodology)
  if (cleanPath === '/methodology') {
    return {
      title: 'Financial Calculation Methodology | OmniMetrics',
      description:
        'Learn about our client-side mathematical standards, formula sources, rounding precision rules, and private financial calculation architecture.',
      canonicalPath: '/methodology/',
      ogType: 'website',
      schemaData: {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'AboutPage',
            name: 'Financial Calculation Methodology | OmniMetrics',
            description:
              'Comprehensive overview of OmniMetrics Hub mathematical formulas, client-side privacy architecture, rounding conventions, and computational modeling standards.',
            url: getAbsoluteUrl('/methodology/'),
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: `${SITE_URL}/`,
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Calculation Methodology',
                item: getAbsoluteUrl('/methodology/'),
              },
            ],
          },
        ],
      },
    };
  }

  // 3. Calculator Detail (/tools/:slugOrId, /calculators/:slugOrId, /calculator/:slugOrId)
  if (
    cleanPath.startsWith('/tools/') ||
    cleanPath.startsWith('/calculators/') ||
    cleanPath.startsWith('/calculator/')
  ) {
    const rawSlugOrId = cleanPath.split('/')[2];
    const slugOrId = TOOL_ALIAS_MAP[rawSlugOrId] || rawSlugOrId;
    const tool = TOOLS_DATA.find((t) => t.slug === slugOrId || t.id === slugOrId);

    if (tool) {
      const toolSeo = TOOL_METADATA_MAP[tool.slug] || {
        title: `${tool.name} Calculator | OmniMetrics`,
        description: tool.metaDescription || tool.description,
      };

      return {
        title: toolSeo.title,
        description: toolSeo.description,
        canonicalPath: `/tools/${tool.slug}/`,
        ogType: 'website',
        schemaData: {
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'WebApplication',
              name: tool.fullTitle,
              applicationCategory: 'FinanceApplication',
              operatingSystem: 'Any (Web Browser)',
              browserRequirements: 'Requires JavaScript. Requires HTML5.',
              offers: {
                '@type': 'Offer',
                price: '0.00',
                priceCurrency: 'USD',
              },
              description: toolSeo.description,
              url: getAbsoluteUrl(`/tools/${tool.slug}/`),
            },
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                {
                  '@type': 'ListItem',
                  position: 1,
                  name: 'Home',
                  item: `${SITE_URL}/`,
                },
                {
                  '@type': 'ListItem',
                  position: 2,
                  name: tool.category,
                  item: `${SITE_URL}/#${tool.category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
                },
                {
                  '@type': 'ListItem',
                  position: 3,
                  name: tool.name,
                  item: getAbsoluteUrl(`/tools/${tool.slug}/`),
                },
              ],
            },
            {
              '@type': 'FAQPage',
              mainEntity: tool.detailedGuide.faqs.map((faq) => ({
                '@type': 'Question',
                name: faq.q,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: faq.a,
                },
              })),
            },
          ],
        },
      };
    }
  }

  // 4. Guide / Blog Detail (/blog/:slugOrId, /guides/:slugOrId, or /articles/:slugOrId)
  if (
    cleanPath.startsWith('/blog/') ||
    cleanPath.startsWith('/guides/') ||
    cleanPath.startsWith('/articles/')
  ) {
    const rawSlugOrId = cleanPath.split('/')[2];
    const resolvedSlug = ALIAS_MAP[rawSlugOrId] || rawSlugOrId;
    const article = ARTICLES_DATA.find(
      (a) =>
        a.slug === resolvedSlug ||
        a.id === resolvedSlug ||
        a.slug === rawSlugOrId ||
        a.id === rawSlugOrId
    );

    if (article) {
      const articleKey = article.slug || article.id;
      const articleSeo = ARTICLE_METADATA_MAP[articleKey] || {
        title: `${article.title} | OmniMetrics`,
        description: article.snippet,
      };
      const canonicalUrl = getAbsoluteUrl(`/blog/${articleKey}/`);

      return {
        title: articleSeo.title,
        description: articleSeo.description,
        canonicalPath: `/blog/${articleKey}/`,
        ogType: 'article',
        schemaData: {
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'Article',
              headline: article.title,
              description: articleSeo.description,
              author: {
                '@type': 'Organization',
                name: 'OmniMetrics Editorial & Analytical Desk',
                url: `${SITE_URL}/about/`,
              },
              publisher: {
                '@type': 'Organization',
                name: 'OmniMetrics Hub',
                url: `${SITE_URL}/`,
                logo: {
                  '@type': 'ImageObject',
                  url: SITE_CONFIG.logoUrl,
                },
              },
              ...(article.publishedDate ? { datePublished: article.publishedDate } : {}),
              ...(article.lastReviewedDate ? { dateModified: article.lastReviewedDate } : {}),
              mainEntityOfPage: canonicalUrl,
            },
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                {
                  '@type': 'ListItem',
                  position: 1,
                  name: 'Home',
                  item: `${SITE_URL}/`,
                },
                {
                  '@type': 'ListItem',
                  position: 2,
                  name: 'Guides & Knowledge Base',
                  item: `${SITE_URL}/blog/`,
                },
                {
                  '@type': 'ListItem',
                  position: 3,
                  name: article.title,
                  item: canonicalUrl,
                },
              ],
            },
          ],
        },
      };
    }
  }

  // 5. About Page
  if (cleanPath === '/about') {
    return {
      title: 'About Our Financial Tools Mission | OmniMetrics',
      description:
        'OmniMetrics Hub provides free, high-precision, client-side financial and business calculation tools for founders, digital creators, and freelancers.',
      canonicalPath: '/about/',
      ogType: 'website',
      schemaData: {
        '@context': 'https://schema.org',
        '@type': 'AboutPage',
        name: 'About OmniMetrics Hub',
        description:
          'Learn about OmniMetrics Hub, our quantitative mission, client-side privacy architecture, and open financial engineering calculators.',
        url: getAbsoluteUrl('/about/'),
        mainEntity: {
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
      },
    };
  }

  // 6. Contact Page
  if (cleanPath === '/contact') {
    return {
      title: 'Contact Support & Inquiries Team | OmniMetrics',
      description:
        'Get in touch with the OmniMetrics Hub team for financial formula feedback, mathematical inquiries, calculator suggestions, or editorial support.',
      canonicalPath: '/contact/',
      ogType: 'website',
      schemaData: {
        '@context': 'https://schema.org',
        '@type': 'ContactPage',
        name: 'Contact OmniMetrics Hub',
        description:
          'Get in touch with the OmniMetrics Hub team for mathematical feedback, advertising inquiries, or calculation suggestions.',
        url: getAbsoluteUrl('/contact/'),
        mainEntity: {
          '@type': 'Organization',
          name: 'OmniMetrics Hub',
          email: SITE_CONFIG.contactEmail,
          url: `${SITE_URL}/`,
        },
      },
    };
  }

  // 7. Legal Pages
  if (cleanPath === '/privacy') {
    return {
      title: 'Privacy Policy & Data Protection | OmniMetrics',
      description:
        'Read our privacy policy: 100% private client-side calculations, zero financial data tracking, local preference cache, and secure email delivery.',
      canonicalPath: '/privacy/',
      ogType: 'website',
      schemaData: {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Privacy Policy | OmniMetrics Hub',
        description:
          'Read our privacy policy: 100% private client-side calculations, zero financial data tracking, local preference cache, and secure email delivery.',
        url: getAbsoluteUrl('/privacy/'),
        publisher: {
          '@type': 'Organization',
          name: 'OmniMetrics Hub',
          url: `${SITE_URL}/`,
          logo: SITE_CONFIG.logoUrl,
        },
      },
    };
  }

  if (cleanPath === '/terms') {
    return {
      title: 'Terms of Service & Acceptable Use | OmniMetrics',
      description:
        'Understand the terms of service, acceptable use guidelines, intellectual property rights, and service conditions for using OmniMetrics Hub tools.',
      canonicalPath: '/terms/',
      ogType: 'website',
      schemaData: {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Terms of Service | OmniMetrics Hub',
        description:
          'Understand the terms of service, acceptable use guidelines, intellectual property rights, and service conditions for using OmniMetrics Hub tools.',
        url: getAbsoluteUrl('/terms/'),
        publisher: {
          '@type': 'Organization',
          name: 'OmniMetrics Hub',
          url: `${SITE_URL}/`,
          logo: SITE_CONFIG.logoUrl,
        },
      },
    };
  }

  if (cleanPath === '/disclaimer') {
    return {
      title: 'Financial & Math Calculation Disclaimer | OmniMetrics',
      description:
        'Important disclaimer regarding mathematical estimates, educational calculation scope, tax limitations, and seeking licensed professional advice.',
      canonicalPath: '/disclaimer/',
      ogType: 'website',
      schemaData: {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Financial & Mathematical Disclaimer | OmniMetrics Hub',
        description:
          'Important disclaimer regarding mathematical estimates, educational calculation scope, tax limitations, and seeking licensed professional advice.',
        url: getAbsoluteUrl('/disclaimer/'),
        publisher: {
          '@type': 'Organization',
          name: 'OmniMetrics Hub',
          url: `${SITE_URL}/`,
          logo: SITE_CONFIG.logoUrl,
        },
      },
    };
  }

  // Fallback 404
  return {
    title: 'Requested Page Not Found (Error 404) | OmniMetrics',
    description:
      'The requested financial calculator or guide page could not be found on OmniMetrics Hub. Return to the homepage or search our free tool directory.',
    canonicalPath: '/404/',
    ogType: 'website',
    schemaData: null,
  };
}

export function getAllStaticRoutes(): string[] {
  const routes: string[] = [
    '/',
    '/calculators',
    '/tools',
    '/blog',
    '/guides',
    '/methodology',
    '/about',
    '/contact',
    '/privacy',
    '/terms',
    '/disclaimer',
    '/404',
  ];

  // Add all calculator routes (both /tools/, /calculators/, and /calculator/)
  for (const tool of TOOLS_DATA) {
    routes.push(`/tools/${tool.slug}`);
    routes.push(`/calculators/${tool.slug}`);
    routes.push(`/calculator/${tool.slug}`);
  }

  // Add tool aliases so they pre-render static HTML with canonical URLs (no 404s)
  for (const alias of Object.keys(TOOL_ALIAS_MAP)) {
    routes.push(`/tools/${alias}`);
  }

  // Add all guide and blog routes (including /blog/, /guides/, /articles/)
  for (const article of ARTICLES_DATA) {
    if (article.slug) {
      routes.push(`/blog/${article.slug}`);
      routes.push(`/guides/${article.slug}`);
      routes.push(`/articles/${article.slug}`);
    }
  }

  return routes;
}
