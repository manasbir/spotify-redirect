// app/track/[trackId]/opengraph-image.tsx
import { ImageResponse } from 'next/og';
import { getTrack, BEST_SONG_EVER_TRACK_ID } from '@/app/spotify';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OG({
  params,
}: {
  params: Promise<{ trackId?: string }>;
}) {
  const { trackId } = await params;
  const id = trackId ?? BEST_SONG_EVER_TRACK_ID;
  const track = await getTrack(id);
  const artists = track?.artists?.map((a) => a.name).join(', ') ?? '';
  const title = track?.name ?? '';
  const albumCover = track?.album?.images[0]?.url ?? '';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#0B0B0C',
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          padding: 72,
        }}
      >
        <div style={{ fontSize: 52, opacity: 0.9 }}>{title}</div>
        <div style={{ fontSize: 32, opacity: 0.7, marginTop: 8 }}>
          {artists}
        </div>
        <img src={albumCover} alt={title} />
      </div>
    ),
    size,
  );
}
