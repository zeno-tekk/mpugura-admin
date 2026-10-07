import { firebaseAuth } from '@/lib/firebase';

// fetch() that proves to our own API routes who is calling, via the Firebase ID token.
export async function authedFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const current = firebaseAuth.currentUser;
  if (!current) throw new Error('You need to be signed in to do that.');

  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${await current.getIdToken()}`);
  return fetch(input, { ...init, headers });
}
