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
  const [needsAuth, setNeedsAuth] = useState(false);

  useEffect(() => {
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
    } else {
      setNeedsAuth(true);
    }
  }, [trackId, router]);

  async function handleAddToQueue() {
    const accessToken = localStorage.getItem('spotify_access_token');

    if (!accessToken) {
      setNeedsAuth(true);
      return;
    }
    addToQueue(accessToken, trackId ?? BEST_SONG_EVER_TRACK_ID)
      .then(() => {
        setIsLoading(false);
      })
      .catch((error) => {
        setError(error.message);
      });
  }

  async function startAuth() {
    const { authUrl, state } = await generateSpotifyAuthUrl(trackId);
    localStorage.setItem('spotify_state', state);
    router.push(authUrl);
  }

  if (needsAuth) {
    return (
      <div
        role='alert'
        className='alert alert-vertical sm:alert-horizontal absolute top-4 left-1/2 -translate-x-1/2'
      >
        <svg
          xmlns='http://www.w3.org/2000/svg'
          fill='none'
          viewBox='0 0 24 24'
          className='stroke-info h-6 w-6 shrink-0'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth='2'
            d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
          ></path>
        </svg>
        <span>Looks like your spotify isn&apos;t connected.</span>
        <div>
          <button className='btn btn-sm btn-accent' onClick={startAuth}>
            Connect Now
          </button>
        </div>
      </div>
    );
  } else {
    return (
      <div className='flex items-center gap-2'>
        {isLoading ? (
          <span className='loading loading-spinner loading-xl mr-2' />
        ) : (
          <button
            className='btn bg-white btn-xl btn-circle text-4xl text-neutral'
            onClick={handleAddToQueue}
          >
            +
          </button>
        )}

        {error && (
          <div className='alert alert-error alert-vertical sm:alert-horizontal'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='stroke-current shrink-0 h-6 w-6'
              fill='none'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'
              />
            </svg>
            <div>
              <h3 className='font-bold'>Error adding to queue</h3>
              <div className='text-xs'>{error}</div>
            </div>
          </div>
        )}
      </div>
    );
  }
}
