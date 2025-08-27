'use client';

import { useEffect, useState } from 'react';
import {
  generateSpotifyAuthUrl,
  refreshSpotifyToken,
} from '@/app/spotify/auth';
import { useRouter } from 'next/navigation';
import { BEST_SONG_EVER_TRACK_ID, addToQueue } from '@/app/spotify';

export default function AddToQueue({ trackId }: { trackId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    async function startAuth() {
      const { authUrl, state } = await generateSpotifyAuthUrl(trackId);
      localStorage.setItem('spotify_state', state);

      router.push(authUrl);
    }

    let accessToken = localStorage.getItem('spotify_access_token');

    if (accessToken) {
      const expiresAt = localStorage.getItem('spotify_expires_at');

      if (expiresAt && new Date(expiresAt) < new Date()) {
        refreshSpotifyToken(
          localStorage.getItem('spotify_refresh_token')!,
        ).then(({ accessToken: newAccessToken, refreshToken, expiresAt }) => {
          console.log('new access token', newAccessToken);
          accessToken = newAccessToken;
          localStorage.setItem('spotify_access_token', newAccessToken);
          localStorage.setItem('spotify_refresh_token', refreshToken);
          localStorage.setItem('spotify_expires_at', expiresAt.toISOString());
        });
      }

      addToQueue(accessToken, trackId ?? BEST_SONG_EVER_TRACK_ID)
        .then(() => {
          setIsLoading(false);
        })
        .catch((error) => {
          setError(error.message);
        });
    } else {
      startAuth();
    }
  }, [trackId, router]);

  return (
    <>
      {isLoading && <div>Adding to queue...</div>}
      {error && <div>{error}</div>}
      {!isLoading && !error && <div>Successfully added to queue</div>}
    </>
  );
}
