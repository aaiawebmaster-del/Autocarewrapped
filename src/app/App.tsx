import { lazy, Suspense, useState } from 'react';
import { AuthGate } from './components/AuthGate';
import { DEMO_RECORD_NUMBER } from '@/lib/demoReport';

const ReportingPage = lazy(() => import('./components/ReportingPage'));

function normalizePathname(pathname: string): string {
  const trimmed = pathname.replace(/\/+$/, '');
  return trimmed || '/';
}

function isReportingPath(pathname: string): boolean {
  return normalizePathname(pathname) === '/reporting';
}

function isDemoPath(pathname: string): boolean {
  return normalizePathname(pathname) === '/demo';
}

/** Public share link: keep /demo and attach the Demo Company record (no SSO). */
function ensureDemoSearchParams(): void {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);
  params.set('record', DEMO_RECORD_NUMBER);
  if (!params.has('embed')) params.set('embed', '1');
  window.history.replaceState(null, '', `/demo?${params.toString()}`);
}

export default function App() {
  const [pathname] = useState(() => {
    if (typeof window === 'undefined') return '/';
    const path = normalizePathname(window.location.pathname);
    if (isDemoPath(path)) {
      ensureDemoSearchParams();
      return '/';
    }
    return path;
  });

  if (isReportingPath(pathname)) {
    return (
      <Suspense fallback={<div className="size-full bg-black" />}>
        <ReportingPage />
      </Suspense>
    );
  }

  return (
    <div className="size-full bg-black">
      <AuthGate />
    </div>
  );
}