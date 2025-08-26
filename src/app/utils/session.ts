'use server';

import { getCloudflareContext } from '@opennextjs/cloudflare';
import { drizzle } from 'drizzle-orm/d1';
import { connections } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import { Connection } from '@/drizzle/client';
import { cookies } from 'next/headers';

const db = drizzle(getCloudflareContext().env.DB);

export async function getSession(): Promise<Connection | undefined> {
  const sessionId = await getSessionId();
  if (!sessionId) {
    return undefined;
  }
  return await getConnection(sessionId);
}

export async function getSessionId(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get('sessionId')?.value;
}

export async function getExpiresAt(): Promise<number | undefined> {
  const cookieStore = await cookies();
  const expiresAt = cookieStore.get('expiresAt')?.value;
  if (!expiresAt) {
    return undefined;
  }
  return parseInt(expiresAt);
}

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
  return (connection ?? undefined)?.metadata?.state === state;
}

export async function createSession(state: string): Promise<string> {
  const sessionId = crypto.randomUUID();
  await db.insert(connections).values({
    sessionId,
    metadata: { state },
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
  accessToken: string,
  refreshToken: string,
  expiresAt: Date,
): Promise<string | undefined> {
  // rotate the session (https://owasp.org/www-community/attacks/Session_fixation)
  // doesn't really apply to us, but i learned it, so i'm doing it
  await deleteSession();
  return await setSpotifyToken(accessToken, refreshToken, expiresAt);
}

/**
 * @param token - the access token
 * @param refreshToken - the refresh token
 * @param expiresAt - the expiration date of the access token
 * @param sessionId - the session id to use, if not provided, a new session will be created for rotation
 * @returns the session id
 */
export async function setSpotifyToken(
  token: string,
  refreshToken: string,
  expiresAt: Date,
  sessionId?: string,
): Promise<string | undefined> {
  const newSessionId = sessionId ?? crypto.randomUUID();
  await db.insert(connections).values({
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

  cookieStore.set('expiresAt', expiresAt.getTime().toString(), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return newSessionId;
}
