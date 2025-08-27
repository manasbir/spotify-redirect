import { BEST_SONG_EVER_TRACK_ID, getTrack } from '@/app/spotify';
import Head from 'next/head';
import Image from 'next/image';
import AddToQueue from './addToQueue';

import { Metadata } from 'next';

type Props = {
  params: Promise<{ trackId: string | undefined }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { trackId } = await params;
  const track = await getTrack(trackId ?? BEST_SONG_EVER_TRACK_ID);
  const title = `Add ${track?.name} to your queue`;
  const description = `${track?.artists
    .map((artist) => artist.name)
    .join(', ')} - ${track?.name}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: track?.album?.images[0]?.url }],
      type: 'music.song',
      url: `/track/${trackId}`,
    },
  };
}

// page is primarily used for rendering
export default async function TrackPage({ params }: Props) {
  const { trackId } = await params;

  const track = await getTrack(trackId ?? BEST_SONG_EVER_TRACK_ID);

  return (
    <div
      data-theme='dark'
      className='flex flex-col items-center justify-center h-screen'
    >
      <Head>
        <title>
          {track?.artists.map((artist) => artist.name).join(', ')} -{' '}
          {track?.name}
        </title>
      </Head>
      <main>
        <div className='card-xl bg-neutral shadow-sm'>
          <figure className='p-4 pb-0'>
            <Image
              src={track.album.images[0].url}
              alt={track.name}
              width={500}
              height={500}
            />
          </figure>
          <div className='card-body'>
            <div className='card-title'>{track.name}</div>
            <div>{track.artists.map((artist) => artist.name).join(', ')}</div>
          </div>
        </div>
        {/* <AddToQueue trackId={trackId ?? BEST_SONG_EVER_TRACK_ID} /> */}
      </main>
    </div>
  );
}
