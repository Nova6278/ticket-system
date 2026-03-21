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
      .catch(() => setError('Failed to load event'))
      .finally(() => setLoading(false));
  }, [params.id]);

  function toggleSeat(seatId: string, status: string) {
    if (status !== 'available') return;
    setSelectedSeats((prev) =>
      prev.includes(seatId)
        ? prev.filter((id) => id !== seatId)
        : [...prev, seatId]
    );
  }

  function getSeatColor(seat: Seat) {
    if (seat.status === 'booked') return 'bg-gray-300 text-gray-500 cursor-not-allowed';
    if (seat.status === 'held') return 'bg-yellow-200 text-yellow-700 cursor-not-allowed';
    if (selectedSeats.includes(seat.id)) return 'bg-blue-600 text-white cursor-pointer';
    return 'bg-green-100 text-green-700 cursor-pointer hover:bg-green-200';
  }

  async function handleBooking() {
    if (!user) {
      router.push('/login');
      return;
    }
    if (selectedSeats.length === 0) {
      setError('Please select at least one seat');
      return;
    }
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
    return new Date(dateStr).toLocaleString('en-IN', {
      dateStyle: 'long',
      timeStyle: 'short',
    });
  }

  function totalPrice() {
    return seats
      .filter((s) => selectedSeats.includes(s.id))
      .reduce((sum, s) => sum + s.price_cents, 0);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading seats...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-500">Route not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <button
          onClick={() => router.push('/')}
          className="text-sm text-blue-600 hover:underline mb-6 block"
        >
          Back to routes
        </button>

        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{event.title}</h1>
          <p className="text-gray-500 text-sm mb-4">{event.venue}</p>
          <div className="flex gap-6 text-sm">
            <div>
              <span className="text-gray-500">Departure: </span>
              <span className="font-medium">{formatDate(event.event_date)}</span>
            </div>
            <div>
              <span className="text-gray-500">Available: </span>
              <span className="font-medium text-green-600">
                {event.available_seats} / {event.total_seats} seats
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-4 text-xs mb-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-100"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-600"></div>
            <span>Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-200"></div>
            <span>Held</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-300"></div>
            <span>Booked</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <div className="text-center mb-6">
            <div className="inline-block bg-gray-800 text-white text-xs px-8 py-2 rounded-lg">
              DRIVER
            </div>
          </div>
          <div className="grid grid-cols-8 gap-2">
            {seats.map((seat) => (
              <button
                key={seat.id}
                onClick={() => toggleSeat(seat.id, seat.status)}
                className={`w-12 h-12 rounded-lg text-xs font-medium border transition flex items-center justify-center ${getSeatColor(seat)}`}
              >
                {seat.seat_number}
              </button>
            ))}
          </div>
        </div>

        {selectedSeats.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                {selectedSeats.length} seat(s) selected
              </p>
              <p className="text-xl font-bold text-gray-900">
                ₹{(totalPrice() / 100).toFixed(0)} total
              </p>
            </div>
            <button
              onClick={handleBooking}
              disabled={booking}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
            >
              {booking ? 'Booking...' : 'Proceed to Payment'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}