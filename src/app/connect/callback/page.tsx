'use client';

import { redirect, useSearchParams } from 'next/navigation';
import { validateState } from '../../utils/session';
import { useEffect, useState } from 'react';
import { getSpotifyToken } from '@/app/utils/spotify';

export default function Callback() {
  const [isValid, setIsValid] = useState(false);
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  useEffect(() => {
    if (searchParams.get('error')) {
      setIsValid(false);
      return;
    }

    if (!state) {
      setIsValid(false);
      return;
    }

    validateState(state).then((isValid) => {
      setIsValid(isValid);
    });

    if (isValid) {
      console.log('valid');
      getSpotifyToken(code!)
        .catch((error) => {
          console.error(error);
        })
        .then(() => {
          console.log('ok');
        });
    }
  }, [searchParams, state, isValid, code]);

  return (
    <div>
      <h1>Callback</h1>
      <p>{code}</p>
      <p>{state}</p>
    </div>
  );
}
