'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { eventsAPI, bookingsAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

interface Seat {
  id: string;
  seat_number: string;
  section: string;
  price_cents: number;
  status: string;
}

interface Event {
  id: string;
  title: string;
  venue: string;
  event_date: string;
  available_seats: number;
  total_seats: number;
}

export default function EventPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuthStore();
  const [event, setEvent] = useState<Event | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const id = params.id as string;
    eventsAPI
      .getById(id)
      .then((res) => {
        setEvent(res.data.event);
        setSeats(res.data.seats || []);
      })
      .catch(() => setError('Failed to load route'))
      .finally(() => setLoading(false));
  }, [params.id]);

  function toggleSeat(seatId: string, status: string) {
    if (status !== 'available') return;
    setSelectedSeats((prev) =>
      prev.includes(seatId) ? prev.filter((id) => id !== seatId) : [...prev, seatId]
    );
  }

  function getSeatColor(seat: Seat) {
    if (seat.status === 'booked') return 'bg-white/5 text-blue-900/40 cursor-not-allowed border-blue-900/20';
    if (seat.status === 'held') return 'bg-yellow-500/20 text-yellow-400 cursor-not-allowed border-yellow-500/30';
    if (selectedSeats.includes(seat.id)) return 'bg-blue-600 text-white cursor-pointer border-blue-400 shadow-lg shadow-blue-500/30';
    return 'bg-green-500/15 text-green-400 cursor-pointer hover:bg-green-500/25 border-green-500/30';
  }

  async function handleBooking() {
    if (!user) { router.push('/login'); return; }
    if (selectedSeats.length === 0) { setError('Please select at least one seat'); return; }
    setBooking(true);
    setError('');
    try {
      const res = await bookingsAPI.create(event!.id, selectedSeats);
      router.push(`/checkout/${res.data.booking.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Booking failed');
    } finally {
      setBooking(false);
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' });
  }

  function totalPrice() {
    return seats.filter((s) => selectedSeats.includes(s.id)).reduce((sum, s) => sum + s.price_cents, 0);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-blue-300 text-sm tracking-widest uppercase">Loading Seats...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
        <p className="text-red-400">Route not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      <div className="bg-gradient-to-br from-[#0a0f1e] via-[#0d1635] to-[#0a1628] py-10 px-6 border-b border-blue-900/30">
        <div className="max-w-5xl mx-auto">
          <button onClick={() => router.push('/')} className="text-xs text-blue-400 hover:text-blue-300 transition mb-6 flex items-center gap-1 uppercase tracking-widest">
            ← Back to Routes
          </button>
          <h1 className="text-3xl font-black text-white mb-1">{event.title}</h1>
          <p className="text-blue-300/50 text-sm mb-4">📍 {event.venue}</p>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="bg-white/5 border border-blue-900/40 rounded-lg px-4 py-2">
              <span className="text-blue-400/60 text-xs">Departure</span>
              <p className="font-semibold text-blue-100">{formatDate(event.event_date)}</p>
            </div>
            <div className="bg-white/5 border border-blue-900/40 rounded-lg px-4 py-2">
              <span className="text-blue-400/60 text-xs">Available Seats</span>
              <p className="font-bold text-green-400">{event.available_seats} / {event.total_seats}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-xs mb-6">
          {[
            { color: 'bg-green-500/15 border border-green-500/30', label: 'Available' },
            { color: 'bg-blue-600 border border-blue-400', label: 'Selected' },
            { color: 'bg-yellow-500/20 border border-yellow-500/30', label: 'Held' },
            { color: 'bg-white/5 border border-blue-900/20', label: 'Booked' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div className={`w-5 h-5 rounded ${item.color}`}></div>
              <span className="text-blue-300/60">{item.label}</span>
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        {/* Seat Map */}
        <div className="bg-gradient-to-br from-white/5 to-white/2 border border-blue-900/40 rounded-2xl p-6 mb-6">
          <div className="text-center mb-6">
            <div className="inline-block bg-blue-600/30 border border-blue-500/40 text-blue-300 text-xs px-10 py-2 rounded-lg font-bold tracking-widest uppercase">
              🚌 Driver
            </div>
          </div>
          <div className="grid grid-cols-8 gap-2">
            {seats.map((seat) => (
              <button
                key={seat.id}
                onClick={() => toggleSeat(seat.id, seat.status)}
                className={`w-12 h-12 rounded-lg text-xs font-bold border transition-all flex items-center justify-center ${getSeatColor(seat)}`}
              >
                {seat.seat_number}
              </button>
            ))}
          </div>
        </div>

        {/* Booking Bar */}
        {selectedSeats.length > 0 && (
          <div className="bg-gradient-to-r from-blue-600/20 to-blue-500/10 border border-blue-500/40 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-blue-300/70 text-sm">{selectedSeats.length} seat(s) selected</p>
              <p className="text-2xl font-black text-white">₹{(totalPrice() / 100).toFixed(0)} <span className="text-sm font-normal text-blue-300/50">total</span></p>
            </div>
            <button
              onClick={handleBooking}
              disabled={booking}
              className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold text-sm uppercase tracking-wide transition disabled:opacity-50"
            >
              {booking ? 'Booking...' : 'Proceed to Payment →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}