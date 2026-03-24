'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { bookingsAPI, paymentsAPI } from '@/lib/api';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

interface Booking {
  id: string;
  total_cents: number;
  status: string;
  title: string;
  venue: string;
  event_date: string;
}

function CheckoutForm({ bookingId }: { bookingId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError('');

    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/my-tickets`,
      },
      redirect: 'if_required',
    });

    if (stripeError) {
      setError(stripeError.message || 'Payment failed');
      setProcessing(false);
      return;
    }

    if (paymentIntent && paymentIntent.status === 'succeeded') {
      await paymentsAPI.confirm(bookingId);
      router.push('/my-tickets');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
      >
        {processing ? 'Processing payment...' : 'Pay now'}
      </button>
    </form>
  );
}

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.bookingId as string;
  const [booking, setBooking] = useState<Booking | null>(null);
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function init() {
      try {
        const bookingRes = await bookingsAPI.getById(bookingId);
        setBooking(bookingRes.data.booking);

        const paymentRes = await paymentsAPI.createIntent(bookingId);
        setClientSecret(paymentRes.data.clientSecret);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load checkout');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [bookingId]);

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString('en-IN', {
      dateStyle: 'long',
      timeStyle: 'short',
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading checkout...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="text-blue-600 hover:underline text-sm"
          >
            Back to routes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">
          Complete your booking
        </h1>

        {booking && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <h2 className="font-semibold text-gray-900 mb-4">Booking summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Route</span>
                <span className="font-medium">{booking.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Departure</span>
                <span className="font-medium">{formatDate(booking.event_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Venue</span>
                <span className="font-medium">{booking.venue}</span>
              </div>
              <div className="border-t border-gray-100 pt-2 mt-2 flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-blue-600 text-base">
                  ₹{(booking.total_cents / 100).toFixed(0)}
                </span>
              </div>
            </div>
          </div>
        )}

        {clientSecret && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="font-semibold text-gray-900 mb-6">Payment details</h2>
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm bookingId={bookingId} />
            </Elements>
          </div>
        )}
      </div>
    </div>
  );
}