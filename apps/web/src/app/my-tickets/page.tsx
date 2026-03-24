'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ticketsAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

interface Ticket {
  id: string;
  booking_id: string;
  seat_number: string;
  section: string;
  price_cents: number;
  qr_code: string;
  is_used: boolean;
  title: string;
  venue: string;
  event_date: string;
  created_at: string;
}

interface BookingGroup {
  booking_id: string;
  title: string;
  venue: string;
  event_date: string;
  created_at: string;
  is_used: boolean;
  tickets: Ticket[];
  total_cents: number;
}

export default function MyTicketsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [bookingGroups, setBookingGroups] = useState<BookingGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { setAuthChecked(true); }, [user]);

  useEffect(() => {
    if (!authChecked) return;
    if (!user) { router.push('/login'); return; }

    ticketsAPI.getAll().then((res) => {
      const tickets: Ticket[] = res.data.tickets;

      // Group by booking_id
      const groups: Record<string, BookingGroup> = {};
      tickets.forEach((t) => {
        if (!groups[t.booking_id]) {
          groups[t.booking_id] = {
            booking_id: t.booking_id,
            title: t.title,
            venue: t.venue,
            event_date: t.event_date,
            created_at: t.created_at,
            is_used: t.is_used,
            tickets: [],
            total_cents: 0,
          };
        }
        groups[t.booking_id].tickets.push(t);
        groups[t.booking_id].total_cents += t.price_cents;
        if (!t.is_used) groups[t.booking_id].is_used = false;
      });

      setBookingGroups(Object.values(groups).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));
    })
    .catch(() => setError('Failed to load tickets'))
    .finally(() => setLoading(false));
  }, [authChecked, user]);

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' });
  }

  if (!authChecked || loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-blue-300 text-sm tracking-widest uppercase">Loading Tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      <div className="relative bg-gradient-to-br from-[#0a0f1e] via-[#0d1635] to-[#0a1628] py-12 px-6 border-b border-blue-900/30">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 rounded-full px-4 py-1.5 mb-4">
            <span className="text-blue-300 text-xs font-semibold tracking-widest uppercase">🎟 Your Journey</span>
          </div>
          <h1 className="text-4xl font-black text-white mb-1">My Tickets</h1>
          <p className="text-blue-300/50">All your intercity bus bookings</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm">{error}</div>
        )}

        {bookingGroups.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🎟</span>
            </div>
            <p className="text-blue-300/40 mb-6 text-lg">No tickets booked yet</p>
            <button onClick={() => router.push('/')} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl text-sm font-bold uppercase tracking-wide transition">
              Browse Routes
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {bookingGroups.map((group) => (
              <div key={group.booking_id} className="bg-gradient-to-br from-white/5 to-white/2 border border-blue-900/40 rounded-2xl p-6 hover:border-blue-500/30 transition">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-lg font-bold text-white">{group.title}</h2>
                      <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wide ${group.is_used ? 'bg-blue-900/40 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>
                        {group.is_used ? 'Used' : '✓ Valid'}
                      </span>
                    </div>
                    <p className="text-blue-300/50 text-sm">📍 {group.venue}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-blue-400/60 uppercase tracking-wide">Total Paid</p>
                    <p className="text-xl font-black text-green-400">₹{(group.total_cents / 100).toFixed(0)}</p>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                  <div>
                    <span className="text-blue-400/60 text-xs uppercase tracking-wide">Departure</span>
                    <p className="font-semibold text-blue-100 mt-0.5">{formatDate(group.event_date)}</p>
                  </div>
                  <div>
                    <span className="text-blue-400/60 text-xs uppercase tracking-wide">Seats Booked</span>
                    <p className="font-bold text-blue-300 mt-0.5 text-lg">{group.tickets.length}</p>
                  </div>
                  <div>
                    <span className="text-blue-400/60 text-xs uppercase tracking-wide">Booked On</span>
                    <p className="font-semibold text-blue-100 mt-0.5">{new Date(group.created_at).toLocaleDateString('en-IN')}</p>
                  </div>
                </div>

                {/* Individual Seats */}
                <div className="border-t border-blue-900/30 pt-4">
                  <p className="text-xs text-blue-400/60 uppercase tracking-wide mb-3">Seat Details</p>
                  <div className="flex flex-wrap gap-2">
                    {group.tickets.map((t) => (
                      <div key={t.id} className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2 text-xs">
                        <span className="text-blue-300 font-bold">{t.seat_number}</span>
                        <span className="text-blue-400/50 ml-1">· {t.section}</span>
                        <span className="text-green-400 ml-1">· ₹{(t.price_cents / 100).toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}