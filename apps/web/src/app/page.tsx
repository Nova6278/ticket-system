'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { eventsAPI } from '@/lib/api';

interface Event {
  id: string;
  title: string;
  venue: string;
  event_date: string;
  total_seats: number;
  available_seats: number;
}

export default function HomePage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    eventsAPI
      .getAll()
      .then((res) => setEvents(res.data.events))
      .catch(() => setError('Failed to load routes'))
      .finally(() => setLoading(false));
  }, []);

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }

  const filtered = events.filter(
    (e) =>
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.venue.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-blue-300 font-medium tracking-widest text-sm uppercase">Loading Routes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0a0f1e] via-[#0d1635] to-[#0a1628] py-16 px-6 border-b border-blue-900/30">
        <div className="absolute inset-0 opacity-10"
          style={{backgroundImage: 'radial-gradient(circle at 20% 50%, #3b82f6 0%, transparent 50%), radial-gradient(circle at 80% 20%, #1d4ed8 0%, transparent 40%)'}}
        />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span className="text-blue-300 text-xs font-semibold tracking-widest uppercase">Intercity Bus Booking</span>
          </div>
          <h1 className="text-5xl font-black mb-3 leading-tight">
            Travel Across<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Odisha & Beyond</span>
          </h1>
          <p className="text-blue-200/60 text-lg mb-8 max-w-xl">Book intercity bus seats instantly. Real-time availability across all major routes from Bhubaneswar.</p>

          <div className="relative max-w-md">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search routes or destinations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-blue-500/30 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-blue-300/40 focus:outline-none focus:border-blue-400 focus:bg-white/8 transition"
            />
          </div>
        </div>
      </div>

      {/* Routes */}
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-blue-100 tracking-wide">
            {filtered.length} Routes Available
          </h2>
          <span className="text-xs text-blue-400/60 uppercase tracking-widest">From Bhubaneswar</span>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="text-center py-20 text-blue-400/40">No routes found</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((event) => {
              const pct = (event.available_seats / event.total_seats) * 100;
              const isLow = event.available_seats < 5;
              return (
                <div
                  key={event.id}
                  onClick={() => router.push(`/events/${event.id}`)}
                  className="group bg-gradient-to-br from-white/5 to-white/2 border border-blue-900/40 rounded-2xl p-5 cursor-pointer hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-blue-500/15 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${isLow ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                      {isLow ? 'Filling Fast' : 'Available'}
                    </span>
                  </div>

                  <h2 className="text-base font-bold text-white mb-1 group-hover:text-blue-300 transition">{event.title}</h2>
                  <p className="text-xs text-blue-300/50 mb-4">📍 {event.venue}</p>

                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between text-blue-200/60">
                      <span>🕐 Departure</span>
                      <span className="text-blue-200 font-medium">{formatDate(event.event_date)}</span>
                    </div>
                    <div>
                      <div className="flex justify-between text-blue-200/60 mb-1.5">
                        <span>Seats</span>
                        <span className={isLow ? 'text-red-400 font-bold' : 'text-green-400 font-bold'}>
                          {event.available_seats}/{event.total_seats}
                        </span>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all ${isLow ? 'bg-red-500' : 'bg-green-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <button className="mt-4 w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl text-xs font-bold tracking-wide uppercase transition">
                    Book Seat →
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}