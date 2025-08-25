'use server';

import { getCloudflareContext } from '@opennextjs/cloudflare';
import { drizzle } from 'drizzle-orm/d1';
import { connections } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import { Connection } from '@/drizzle/client';
import { cookies } from 'next/headers';

const db = drizzle(getCloudflareContext().env.DB);

export async function getConnection(sessionId: string): Promise<Connection | undefined> {
  const result = await db.select().from(connections).where(eq(connections.sessionId, sessionId));
  return result[0];
}

export async function validateState(state: string): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('sessionId')?.value;
  if (!sessionId) {
    return false;
  }
  const connection = await getConnection(sessionId);
  return JSON.parse(connection?.metadata ?? '{}').state === state;
}

export async function createSession(state: string): Promise<string> {
  const sessionId = crypto.randomUUID();
  await db.insert(connections).values({
    id: crypto.randomUUID(),
    sessionId,
    metadata: JSON.stringify({ state }),
  });

  return sessionId;
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('sessionId')?.value;
  if (!sessionId) {
    return;
  }
  await db.delete(connections).where(eq(connections.sessionId, sessionId));
  cookieStore.delete('sessionId');
}

export async function addSpotifyToken(
  token: string,
  refreshToken: string,
  expiresAt: Date,
): Promise<string | undefined> {
  // rotate the session (https://owasp.org/www-community/attacks/Session_fixation)
  // doesn't really apply to us, but i learned it, so i'm doing it
  await deleteSession();
  const newSessionId = crypto.randomUUID();
  await db.insert(connections).values({
    id: crypto.randomUUID(),
    sessionId: newSessionId,
    spotifyRefreshToken: refreshToken,
    spotifyAccessToken: token,
    spotifyExpiresAt: expiresAt,
  });

  const cookieStore = await cookies();
  cookieStore.set('sessionId', newSessionId, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return newSessionId;
}
