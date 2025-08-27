'use client';

import { redirect, useSearchParams } from 'next/navigation';
import { getSpotifyToken } from '../../utils/spotify';
import { useEffect, useState } from 'react';
import { BEST_SONG_EVER_TRACK_ID } from '@/app/constants';

export default function Callback() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const errorParam = searchParams.get('error');

  useEffect(() => {
    async function getToken() {
      if (errorParam) {
        setError(errorParam);
        setIsLoading(false);
        return;
      }

      if (!code || !state) {
        setError('Invalid request');
        setIsLoading(false);
        return;
      }

      if (state !== localStorage.getItem('spotify_state')) {
        setError('Invalid state');
        setIsLoading(false);
        return;
      }

      localStorage.removeItem('spotify_state');
      const trackId = state.split('--')[1] ?? BEST_SONG_EVER_TRACK_ID;

      const token = await getSpotifyToken(code);

      localStorage.setItem('spotify_access_token', token.accessToken);
      localStorage.setItem('spotify_refresh_token', token.refreshToken);
      localStorage.setItem('spotify_expires_at', token.expiresAt.toISOString());

      redirect(`/track/${trackId}`);
    }

    getToken();
  }, [code, state, errorParam]);

  return (
    <>
      {isLoading && <div>Loading...</div>}
      {error && <div>Error: {error}, send manas a manas</div>}
      {!isLoading && !error && <div>Success</div>}
    </>
  );
}
