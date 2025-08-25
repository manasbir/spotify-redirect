'use server';

import { cookies } from 'next/headers';
import { addSpotifyToken, createSession } from './session';
import { redirect } from 'next/navigation';

const redirect_uri =
  process.env.NODE_ENV === 'development'
    ? 'https://upright-dog-lovely.ngrok-free.app/connect/callback'
    : 'http://localhost:3000/connect/callback';

export async function generateAuthUrl(): Promise<string> {
  const response_type = 'code';
  const client_id = process.env.SPOTIFY_CLIENT_ID;
  const state = crypto.randomUUID();
  const scope = 'user-modify-playback-state';

  if (!client_id) {
    throw new Error('SPOTIFY_CLIENT_ID is not set');
  }

  const queryString = new URLSearchParams({
    response_type,
    client_id,
    state,
    scope,
    redirect_uri,
  });

  const sessionId = await createSession(state);

  const cookieStore = await cookies();
  cookieStore.set('sessionId', sessionId, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  redirect(`https://accounts.spotify.com/authorize?` + queryString);
}

export async function getSpotifyToken(code: string): Promise<{
  error: string;
} | null> {
  const client_id = process.env.SPOTIFY_CLIENT_ID;
  const client_secret = process.env.SPOTIFY_CLIENT_SECRET;

  const body = new URLSearchParams({
    code,
    redirect_uri,
    grant_type: 'authorization_code',
  });

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${client_id}:${client_secret}`).toString('base64')}`,
    },
    body,
  });

  const data = (await response.json()) as
    | {
        error: string;
        error_description: string;
      }
    | {
        access_token: string;
        token_type: string;
        // seconds
        expires_in: number;
        refresh_token: string;
      };

  if ('error' in data) {
    throw new Error(data.error_description);
  }

  const sessionId = await addSpotifyToken(
    data.access_token,
    data.refresh_token,
    new Date(Date.now() + data.expires_in * 1000),
  );

  if (!sessionId) {
    throw new Error('Failed to add Spotify token');
  }

  return null;
}
