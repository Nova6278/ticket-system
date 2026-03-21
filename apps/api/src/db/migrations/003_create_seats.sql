CREATE TABLE IF NOT EXISTS seats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  seat_number TEXT NOT NULL,
  section TEXT,
  price_cents INTEGER NOT NULL,
  status TEXT DEFAULT 'available'
);