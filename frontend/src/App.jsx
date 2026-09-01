import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';

import { useAppStore } from './store/useAppStore';
import { BrandSplash } from './components/feedback/BrandSplash';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const AppPage = lazy(() => import('./pages/AppPage'));
const SharedReport = lazy(() => import('./pages/SharedReport'));
const ValidationPage = lazy(() => import('./pages/ValidationPage'));

function AppPreferences() {
  const location = useLocation();
  const theme = useAppStore((s) => s.theme);
  const lang = useAppStore((s) => s.lang);

  useEffect(() => {
    document.documentElement.dataset.theme = theme === 'light' ? 'light' : 'dark';
    document.documentElement.style.colorScheme = theme === 'light' ? 'light' : 'dark';
    document.documentElement.lang = lang === 'en' ? 'en' : 'id';
  }, [theme, lang]);

  useEffect(() => {
    const scrollable =
      location.pathname === '/' ||
      location.pathname.startsWith('/laporan/') ||
      location.pathname.startsWith('/validasi');
    document.documentElement.classList.toggle('document-scroll', scrollable);
    document.documentElement.classList.toggle('app-scroll-lock', !scrollable);
    return () => {
      document.documentElement.classList.remove('document-scroll', 'app-scroll-lock');
    };
  }, [location.pathname]);

  return null;
}

function Page({ label, children }) {
  return <Suspense fallback={<BrandSplash label={label} />}>{children}</Suspense>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AppPreferences />
      <Routes>
        <Route
          path="/"
          element={
            <Page label="Memuat halaman utama S.A.F.E House">
              <LandingPage />
            </Page>
          }
        />
        <Route
          path="/app"
          element={
            <Page label="Memuat peta audit S.A.F.E House">
              <AppPage />
            </Page>
          }
        />
        <Route
          path="/laporan/:slug"
          element={
            <Page label="Memuat laporan S.A.F.E House">
              <SharedReport />
            </Page>
          }
        />
        <Route
          path="/validasi"
          element={
            <Page label="Memuat halaman validasi S.A.F.E House">
              <ValidationPage />
            </Page>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
