import { Suspense } from 'react';
import HomePageContent from './home-content';

function HomePageFallback() {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
        <p className="mt-3 text-slate-600">Loading...</p>
      </div>
    </main>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<HomePageFallback />}>
      <HomePageContent />
    </Suspense>
  );
}
