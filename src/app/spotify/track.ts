import { spotifyClientId, spotifyClientSecret } from './constants';

export async function getTrack(trackId: string) {
  const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
    headers: {
      Authorization: `Basic ${Buffer.from(
        `${spotifyClientId}:${spotifyClientSecret}`,
      ).toString('base64')}`,
    },
  });
}
