import React, { useState, useEffect, Suspense } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { CurrencySymbol, CategoryType, ToolItem, ArticleItem } from './types';
import { getInitialCurrencyFromUrl } from './utils/shareableState';
import { TOOLS_DATA } from './data/tools';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { FloatingActionButton } from './components/FloatingActionButton';
import { ScrollToTop } from './components/ScrollToTop';
import { ConsentBanner } from './components/ConsentBanner';
import { ErrorBoundary } from './components/ErrorBoundary';

// Pages (kept synchronous for static SSR prerendering in src/prerender.tsx)
import { HomePage } from './pages/HomePage';
import { CalculatorPage } from './pages/CalculatorPage';
import { CalculatorsIndexPage } from './pages/CalculatorsIndexPage';
import { BlogIndexPage } from './pages/BlogIndexPage';
import { GuidePage } from './pages/GuidePage';
import { AboutPage } from './pages/AboutPage';
import { MethodologyPage } from './pages/MethodologyPage';
import { ContactPage } from './pages/ContactPage';
import { LegalPage } from './pages/LegalPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Lazy-loaded Modals (only loaded on demand when opened by the user on the client)
import type { LegalTabType } from './components/modals/LegalModal';

const CalculatorModal = React.lazy(() =>
  import('./components/modals/CalculatorModal').then((m) => ({ default: m.CalculatorModal }))
);
const ArticleModal = React.lazy(() =>
  import('./components/modals/ArticleModal').then((m) => ({ default: m.ArticleModal }))
);
const SuggestModal = React.lazy(() =>
  import('./components/modals/SuggestModal').then((m) => ({ default: m.SuggestModal }))
);
const ContactModal = React.lazy(() =>
  import('./components/modals/ContactModal').then((m) => ({ default: m.ContactModal }))
);
const LegalModal = React.lazy(() =>
  import('./components/modals/LegalModal').then((m) => ({ default: m.LegalModal }))
);

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currency, setCurrency] = useState<CurrencySymbol>(() => {
    const urlCurrency = getInitialCurrencyFromUrl();
    if (urlCurrency) {
      return urlCurrency;
    }
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('omni_preferred_currency') as CurrencySymbol;
        if (saved && ['$', '€', '£', 'C$', 'A$', '¥', '₹'].includes(saved)) {
          return saved;
        }
      } catch {
        // ignore
      }
    }
    return '$';
  });

  useEffect(() => {
    const urlCurrency = getInitialCurrencyFromUrl(location.search);
    if (urlCurrency) {
      setCurrency(urlCurrency);
    }
  }, [location.search]);

  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const handleCurrencyChange = (c: CurrencySymbol) => {
    setCurrency(c);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('omni_preferred_currency', c);
      } catch {
        // ignore
      }
    }
  };

  // Modals state
  const [activeTool, setActiveTool] = useState<ToolItem | null>(null);
  const [activeArticle, setActiveArticle] = useState<ArticleItem | null>(null);
  const [isSuggestOpen, setIsSuggestOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<LegalTabType | null>(null);

  const handleReset = () => {
    setSelectedCategory('ALL');
    setSearchQuery('');
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenToolById = (toolId: string) => {
    const tool = TOOLS_DATA.find((t) => t.id === toolId || t.slug === toolId);
    if (tool) {
      setActiveTool(tool);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between selection:bg-emerald-500 selection:text-white relative">
      <ScrollToTop />

      {/* Top Header */}
      <Header
        currency={currency}
        onCurrencyChange={handleCurrencyChange}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onReset={handleReset}
        onOpenContact={() => navigate('/contact')}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full pb-16">
        <ErrorBoundary>
          <Routes>
            <Route
              path="/"
              element={
                <HomePage
                  currency={currency}
                  selectedCategory={selectedCategory}
                  onSelectCategory={setSelectedCategory}
                  searchQuery={searchQuery}
                  onResetSearch={handleReset}
                  onLaunchTool={setActiveTool}
                  onSelectArticle={setActiveArticle}
                  onOpenToolById={handleOpenToolById}
                />
              }
            />
            <Route
              path="/calculators"
              element={<CalculatorsIndexPage currency={currency} />}
            />
            <Route
              path="/tools"
              element={<CalculatorsIndexPage currency={currency} />}
            />
            <Route
              path="/blog"
              element={<BlogIndexPage />}
            />
            <Route
              path="/guides"
              element={<BlogIndexPage />}
            />
            <Route
              path="/blog/:slugOrId"
              element={<GuidePage />}
            />
            <Route
              path="/tools/:slugOrId"
              element={<CalculatorPage currency={currency} />}
            />
            <Route
              path="/calculators/:slugOrId"
              element={<CalculatorPage currency={currency} />}
            />
            <Route
              path="/calculator/:slugOrId"
              element={<CalculatorPage currency={currency} />}
            />
            <Route
              path="/guides/:slugOrId"
              element={<GuidePage />}
            />
            <Route
              path="/articles/:slugOrId"
              element={<GuidePage />}
            />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/methodology" element={<MethodologyPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/privacy" element={<LegalPage />} />
            <Route path="/terms" element={<LegalPage />} />
            <Route path="/disclaimer" element={<LegalPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </ErrorBoundary>
      </main>

      {/* Footer */}
      <Footer
        onOpenCalculator={handleOpenToolById}
        onOpenLegal={setLegalModalTab}
        onOpenContact={() => navigate('/contact')}
        onOpenSuggest={() => setIsSuggestOpen(true)}
      />

      {/* Privacy Consent Banner */}
      <ConsentBanner />

      {/* Floating Action Button */}
      <FloatingActionButton onClick={() => setIsSuggestOpen(true)} />

      {/* Calculator Modal (lazy-loaded on demand) */}
      {activeTool && (
        <Suspense fallback={null}>
          <CalculatorModal
            tool={activeTool}
            currency={currency}
            onClose={() => setActiveTool(null)}
          />
        </Suspense>
      )}

      {/* Article Modal (lazy-loaded on demand) */}
      {activeArticle && (
        <Suspense fallback={null}>
          <ArticleModal
            article={activeArticle}
            onClose={() => setActiveArticle(null)}
          />
        </Suspense>
      )}

      {/* Suggest Modal (lazy-loaded on demand) */}
      {isSuggestOpen && (
        <Suspense fallback={null}>
          <SuggestModal
            isOpen={isSuggestOpen}
            onClose={() => setIsSuggestOpen(false)}
          />
        </Suspense>
      )}

      {/* Contact Modal (lazy-loaded on demand) */}
      {isContactOpen && (
        <Suspense fallback={null}>
          <ContactModal
            isOpen={isContactOpen}
            onClose={() => setIsContactOpen(false)}
          />
        </Suspense>
      )}

      {/* Legal Modal (lazy-loaded on demand) */}
      {legalModalTab && (
        <Suspense fallback={null}>
          <LegalModal
            initialTab={legalModalTab}
            onClose={() => setLegalModalTab(null)}
          />
        </Suspense>
      )}
    </div>
  );
}
