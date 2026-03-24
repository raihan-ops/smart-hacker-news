'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { routes } from '@/lib/routes';

function cn(...parts: Array<string | false>) {
  return parts.filter(Boolean).join(' ');
}

export default function MainNavbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-800/40 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 text-white shadow-md backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href={routes.home()} className="group inline-flex items-center gap-2.5 text-white">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[var(--brand)] shadow-[0_0_0_4px_rgba(255,102,0,0.22)] transition-transform duration-200 group-hover:scale-110" />
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-[0.02em] sm:text-base">Smart HN Reader</span>
            <span className="text-[11px] font-medium text-slate-300">Read fast. Think deeper.</span>
          </span>
        </Link>

        <div className="flex items-center gap-1 rounded-full border border-slate-600/70 bg-white/10 p-1 shadow-sm backdrop-blur-sm">
          <Link
            href={routes.home()}
            className={cn(
              'rounded-full px-3 py-1.5 text-sm font-semibold transition-all',
              pathname === routes.home()
                ? 'bg-white text-slate-900 shadow-[inset_0_-1px_0_rgba(15,23,42,0.08)]'
                : 'text-slate-200 hover:bg-white/20 hover:text-white',
            )}
          >
            Stories
          </Link>
          <Link
            href={routes.bookmarks.index()}
            className={cn(
              'rounded-full px-3 py-1.5 text-sm font-semibold transition-all',
              pathname === routes.bookmarks.index()
                ? 'bg-white text-slate-900 shadow-[inset_0_-1px_0_rgba(15,23,42,0.08)]'
                : 'text-slate-200 hover:bg-white/20 hover:text-white',
            )}
          >
            Bookmarks
          </Link>
        </div>
      </div>
    </nav>
  );
}
