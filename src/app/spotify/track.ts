import { getServerAuthToken } from './auth';

export type Track = {
  album: {
    images: {
      url: string;
      height: number;
      width: number;
    }[];
  };
  artists: {
    name: string;
  }[];
  name: string;
};

export async function getTrack(trackId: string): Promise<Track> {
  const accessToken = await getServerAuthToken();

  const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch track' + (await response.text()));
  }

  return response.json() as Promise<Track>;
}
