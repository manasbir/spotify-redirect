'use server';

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

export async function generateSpotifyAuthUrl(trackId?: string): Promise<{
  authUrl: string;
  state: string;
}> {
  const response_type = 'code';
  const state = crypto.randomUUID() + '--' + trackId;
  const scope = 'user-modify-playback-state';

  const queryString = new URLSearchParams({
    response_type,
    client_id,
    state,
    scope,
    redirect_uri,
  });

  return {
    authUrl: `https://accounts.spotify.com/authorize?` + queryString,
    state,
  };
}

export async function getSpotifyToken(
  code: string,
): Promise<{ accessToken: string; refreshToken: string; expiresAt: Date }> {
  const body = new URLSearchParams({
    code,
    redirect_uri,
    grant_type: 'authorization_code',
  });

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(
        `${client_id}:${client_secret}`,
      ).toString('base64')}`,
    },
    body,
  });

  const data = (await response.json()) as SpotifyTokenResponse | SpotifyError;

  if ('error' in data) {
    throw new Error(data.error_description);
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  };
}

export async function refreshSpotifyToken(
  refreshToken: string,
): Promise<{ accessToken: string; refreshToken: string; expiresAt: Date }> {
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
      Authorization: `Basic ${Buffer.from(
        `${client_id}:${client_secret}`,
      ).toString('base64')}`,
    },
    body,
  });

  const data = (await response.json()) as SpotifyTokenResponse | SpotifyError;

  if ('error' in data) {
    throw new Error(data.error_description);
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  };
}

/**
 * Add a track to the queue
 * @param accessToken - The access token for the user, assumed to be valid and not expired
 * @param trackId - The ID of the track to add to the queue
 */
export async function addToQueue(
  accessToken: string,
  trackId: string,
): Promise<void> {
  const response = await fetch(
    `https://api.spotify.com/v1/me/player/queue?uri=spotify:track:${trackId}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to add to queue: ${
        response.statusText
      }. Response: ${await response.text()}`,
    );
  }
}
