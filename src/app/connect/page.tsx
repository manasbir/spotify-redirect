'use client';

import { useRouter } from 'next/navigation';
import { generateAuthUrl } from '../utils/spotify';

export default function Connect() {
  // first check if there is a session id in the url
  // if not, generate a new one and start the auth flow
  // if there is, check if the session id has a connection
  // if not, start the auth flow
  const router = useRouter();

  const handleConnect = async () => {
    const url = await generateAuthUrl();
    router.replace(url);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <button onClick={handleConnect} className="bg-blue-500 text-white p-2 rounded-md">
        Connect
      </button>
    </div>
  );
}
