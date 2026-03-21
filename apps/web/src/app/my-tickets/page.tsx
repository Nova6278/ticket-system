'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ticketsAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

interface Ticket {
  id: string;
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

export default function MyTicketsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    ticketsAPI
      .getAll()
      .then((res) => setTickets(res.data.tickets))
      .catch(() => setError('Failed to load tickets'))
      .finally(() => setLoading(false));
  }, [user]);

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString('en-IN', {
      dateStyle: 'long',
      timeStyle: 'short',
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading your tickets...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">My Tickets</h1>
        <p className="text-gray-500 mb-8">Your booked bus tickets</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        {tickets.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 mb-4">You have no tickets yet</p>
            <button
              onClick={() => router.push('/')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-700 transition"
            >
              Browse routes
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="bg-white border border-gray-200 rounded-xl p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-lg font-semibold text-gray-900">
                        {ticket.title}
                      </h2>
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          ticket.is_used
                            ? 'bg-gray-100 text-gray-500'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {ticket.is_used ? 'Used' : 'Valid'}
                      </span>
                    </div>
                    <p className="text-gray-500 text-sm mb-4">{ticket.venue}</p>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Departure</span>
                        <p className="font-medium">
                          {formatDate(ticket.event_date)}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Seat</span>
                        <p className="font-medium">{ticket.seat_number}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Price</span>
                        <p className="font-medium">
                          ₹{(ticket.price_cents / 100).toFixed(0)}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Booked on</span>
                        <p className="font-medium">
                          {new Date(ticket.created_at).toLocaleDateString(
                            'en-IN'
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="ml-6 text-center">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-2">Ticket ID</p>
                      <p className="text-xs font-mono text-gray-700 break-all max-w-32">
                        {ticket.id.slice(0, 8)}...
                      </p>
                    </div>
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