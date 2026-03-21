import { db } from "../../config/database";

export async function getAllEvents() {
  const result = await db.query("SELECT * FROM events ORDER BY event_date ASC");
  return result.rows;
}

export async function getEventById(id: string) {
  const eventResult = await db.query("SELECT * FROM events WHERE id = $1", [
    id,
  ]);
  if (eventResult.rows.length === 0) {
    throw new Error("Event not found");
  }

  const seatsResult = await db.query(
    "SELECT * FROM seats WHERE event_id = $1 ORDER BY CAST(SUBSTRING(seat_number FROM 2) AS INTEGER) ASC",
    [id],
  );

  return {
    event: eventResult.rows[0],
    seats: seatsResult.rows,
  };
}

export async function createEvent(
  title: string,
  venue: string,
  event_date: string,
  total_seats: number,
  price_cents: number,
) {
  const result = await db.query(
    `INSERT INTO events (title, venue, event_date, total_seats, available_seats)
     VALUES ($1, $2, $3, $4, $4) RETURNING *`,
    [title, venue, event_date, total_seats],
  );

  const event = result.rows[0];

  const seatInserts = [];
  for (let i = 1; i <= total_seats; i++) {
    seatInserts.push(
      db.query(
        `INSERT INTO seats (event_id, seat_number, price_cents, status)
         VALUES ($1, $2, $3, 'available')`,
        [event.id, `S${i}`, price_cents],
      ),
    );
  }
  await Promise.all(seatInserts);

  return event;
}
