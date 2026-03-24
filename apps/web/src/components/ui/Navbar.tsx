'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function Navbar() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  function handleLogout() {
    logout();
    router.push('/login');
  }

  return (
    <nav className="bg-[#0a0f1e]/95 backdrop-blur border-b border-blue-900/30 px-6 py-4 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
            </svg>
          </div>
          <span className="text-lg font-black text-white tracking-tight">Bus<span className="text-blue-400">Master</span></span>
        </Link>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-xs text-blue-300/50 hidden sm:block">{user.email}</span>
              <Link href="/my-tickets" className="text-sm text-blue-300 hover:text-white transition font-medium">
                🎟 My Tickets
              </Link>
              <button
                onClick={handleLogout}
                className="text-xs bg-white/5 hover:bg-white/10 border border-blue-900/50 text-blue-300 px-4 py-2 rounded-lg transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-blue-300 hover:text-white transition">
                Login
              </Link>
              <Link href="/register" className="text-sm bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}