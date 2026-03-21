'use client';

import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/ui/Navbar';
import { useAuthStore } from '@/store/authStore';
import { useEffect } from 'react';

const geist = Geist({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { initAuth } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, []);

  return (
    <html lang="en">
      <body className={geist.className}>
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}