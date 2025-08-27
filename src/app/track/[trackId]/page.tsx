'use client';

import {
  addToQueue,
  generateSpotifyAuthUrl,
  refreshSpotifyToken,
  BEST_SONG_EVER_TRACK_ID,
  getTrack,
  Track,
} from '@/app/spotify';
import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function TrackPage({
  params,
}: {
  params: Promise<{ trackId: string | undefined }>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [track, setTrack] = useState<Track | null>(null);

  const { trackId } = use(params);

  const router = useRouter();

  useEffect(() => {
    getTrack(trackId ?? BEST_SONG_EVER_TRACK_ID).then((track) => {
      setTrack(track);
      setIsLoading(false);
    });

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
    <div>
      {error && <div>Error: {error}</div>}
      {isLoading && <div>Loading...</div>}
      {!error && !isLoading && <div>Success</div>}
      {track && (
        <div>
          {track.album.images.map((image, index) => (
            <Image
              key={index}
              src={image.url}
              alt={track.name}
              width={image.width}
              height={image.height}
            />
          ))}
        </div>
      )}
    </div>
  );
}
