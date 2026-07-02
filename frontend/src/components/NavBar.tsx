'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search } from 'lucide-react';

const links = [
  { href: '/', label: 'Home' },
  { href: '/tv', label: 'TV Shows' },
  { href: '/movies', label: 'Movies' },
  { href: '/upcoming', label: 'Upcoming' },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 md:px-10 bg-black/70 backdrop-blur-xl border-b border-white/5">
      <Link href="/" className="text-lg font-black tracking-widest text-accent">
        WATCH PARTY
      </Link>

      <nav className="hidden md:flex items-center gap-8">
        {links.map(link => {
          const active = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-semibold tracking-wide transition-colors ${
                active ? 'text-accent' : 'text-neutral-300 hover:text-white'
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <button className="flex items-center justify-center w-9 h-9 rounded-full border border-white/10 text-neutral-300 hover:text-white hover:border-white/20 transition-colors">
        <Search size={16} />
      </button>
    </header>
  );
}
