import { NextResponse } from 'next/server';

// Server-side admin check for API routes. There is no Firebase Admin SDK here, so this
// uses Google's REST APIs instead: accounts:lookup validates the ID token, and reading
// users/{uid} through the Firestore REST API with that same token runs the security
// rules as the caller, so the role can't be spoofed.

interface FirestoreUserDoc {
  fields?: { role?: { stringValue?: string } };
}

// Returns an error response when the caller is not a signed-in admin, or null when allowed.
export async function requireAdmin(req: Request): Promise<NextResponse | null> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!apiKey || !projectId) {
    return NextResponse.json({ error: 'Firebase not configured' }, { status: 500 });
  }

  const token = req.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  }

  const lookup = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: token }),
    }
  );
  if (!lookup.ok) {
    return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
  }
  const uid = ((await lookup.json()) as { users?: Array<{ localId: string }> }).users?.[0]?.localId;
  if (!uid) {
    return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
  }

  const profile = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!profile.ok) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }
  const doc = (await profile.json()) as FirestoreUserDoc;
  if (doc.fields?.role?.stringValue !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  return null;
}
