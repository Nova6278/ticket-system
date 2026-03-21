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

  function formatPrice(cents: number) {
    return `₹${(cents / 100).toFixed(0)}`;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading routes...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Available Bus Routes
        </h1>
        <p className="text-gray-500 mb-8">
          Select a route to view seats and book your ticket
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {events.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            No routes available at the moment
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div
                key={event.id}
                onClick={() => router.push(`/events/${event.id}`)}
                className="bg-white border border-gray-200 rounded-xl p-6 cursor-pointer hover:shadow-md hover:border-blue-300 transition"
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-1">
                  {event.title}
                </h2>
                <p className="text-sm text-gray-500 mb-4">{event.venue}</p>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Departure</span>
                    <span className="font-medium">
                      {formatDate(event.event_date)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Available seats</span>
                    <span
                      className={`font-medium ${
                        event.available_seats < 5
                          ? 'text-red-600'
                          : 'text-green-600'
                      }`}
                    >
                      {event.available_seats} / {event.total_seats}
                    </span>
                  </div>
                </div>

                <button className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
                  View Seats
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}