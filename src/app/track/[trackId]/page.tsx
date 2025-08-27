'use client';
import { addToQueue, generateSpotifyAuthUrl } from '@/app/utils/spotify';
import { use, useEffect, useState } from 'react';
import { redirect } from 'next/navigation';
import { BEST_SONG_EVER_TRACK_ID } from '@/app/constants';

export default function TrackPage({
  params,
}: {
  params: Promise<{ trackId: string | undefined }>;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { trackId } = use(params);

  useEffect(() => {
    async function startAuth() {
      const { authUrl, state } = await generateSpotifyAuthUrl(trackId);
      localStorage.setItem('spotify_state', state);

      redirect(authUrl);
    }

    const accessToken = localStorage.getItem('spotify_access_token');

    if (accessToken) {
      addToQueue(accessToken, trackId ?? BEST_SONG_EVER_TRACK_ID)
        .then(() => {
          setIsLoading(false);
        })
        .catch((error) => {
          setError(error.message);
        });
    } else {
      startAuth().then(() => {
        setIsLoading(false);
      });
    }
  }, [trackId]);

  return (
    <div>
      {isLoading && <div>Loading...</div>}
      {error && <div>Error: {error}</div>}
      {!isLoading && !error && <div>Success</div>}
    </div>
  );
}
