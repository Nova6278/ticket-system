import { redis } from '../../config/redis';

const HOLD_TTL_SECONDS = 600;

export async function holdSeat(seatId: string, userId: string): Promise<boolean> {
  const key = `seat:hold:${seatId}`;
  const result = await redis.set(key, userId, 'EX', HOLD_TTL_SECONDS, 'NX');
  return result === 'OK';
}

export async function releaseSeat(seatId: string): Promise<void> {
  await redis.del(`seat:hold:${seatId}`);
}

export async function getSeatHolder(seatId: string): Promise<string | null> {
  return await redis.get(`seat:hold:${seatId}`);
}

export async function holdMultipleSeats(
  seatIds: string[],
  userId: string
): Promise<boolean> {
  const results = await Promise.all(
    seatIds.map((seatId) => holdSeat(seatId, userId))
  );

  if (results.some((r) => r === false)) {
    await Promise.all(seatIds.map((seatId) => releaseSeat(seatId)));
    return false;
  }

  return true;
}