import { lazy, Suspense, useState } from 'react';
import { AuthGate } from './components/AuthGate';

const ReportingPage = lazy(() => import('./components/ReportingPage'));

function normalizePathname(pathname: string): string {
  const trimmed = pathname.replace(/\/+$/, '');
  return trimmed || '/';
}

function isReportingPath(pathname: string): boolean {
  return normalizePathname(pathname) === '/reporting';
}

export default function App() {
  const [pathname] = useState(() =>
    typeof window !== 'undefined' ? normalizePathname(window.location.pathname) : '/',
  );

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