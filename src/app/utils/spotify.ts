'use server';

import { cookies } from 'next/headers';
import { addSpotifyToken, createSession, getExpiresAt, getSession, setSpotifyToken } from './session';
import { redirect } from 'next/navigation';

type SpotifyTokenResponse = {
  access_token: string;
  token_type: string;
  // seconds
  expires_in: number;
  refresh_token: string;
};

type SpotifyError = {
  error: string;
  error_description: string;
};

const redirect_uri =
  process.env.NODE_ENV === 'development'
    ? 'https://upright-dog-lovely.ngrok-free.app/connect/callback'
    : 'http://localhost:3000/connect/callback';

const client_id = process.env.SPOTIFY_CLIENT_ID!;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET!;

export async function generateAuthUrl(): Promise<string> {
  const response_type = 'code';
  const state = crypto.randomUUID();
  const scope = 'user-modify-playback-state';

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

  const data = (await response.json()) as SpotifyTokenResponse | SpotifyError;

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

export async function refreshSpotifyToken(): Promise<{
  error: string;
} | null> {
  const session = await getSession();

  if (!session) {
    throw new Error('No session found');
  }

  const refreshToken = session.spotifyRefreshToken;

  if (!refreshToken) {
    throw new Error('No refresh token found');
  }

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id,
  });

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${client_id}:${client_secret}`).toString('base64')}`,
    },
    body,
  });

  const data = (await response.json()) as SpotifyTokenResponse | SpotifyError;

  if ('error' in data) {
    throw new Error(data.error_description);
  }

  const sessionId = await setSpotifyToken(
    data.access_token,
    data.refresh_token,
    new Date(Date.now() + data.expires_in * 1000),
    session.sessionId ?? undefined,
  );

  if (!sessionId) {
    throw new Error('Failed to add Spotify token');
  }

  return null;
}

export async function addToQueue(trackId: string): Promise<void> {
  const expiresAt = await getExpiresAt();
  if (!expiresAt) {
    throw new Error('No session found');
  }

  if (expiresAt < Date.now()) {
    await refreshSpotifyToken();
  }

  const session = await getSession();

  const accessToken = session?.spotifyAccessToken;

  if (!accessToken) {
    throw new Error('No access token found');
  }

  const response = await fetch(`https://api.spotify.com/v1/me/player/queue?uri=spotify:track:${trackId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to add to queue');
  }
}
