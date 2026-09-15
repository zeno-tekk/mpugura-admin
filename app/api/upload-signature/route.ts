import { createHash } from 'crypto';
import { NextResponse } from 'next/server';

// Returns a signed Cloudinary upload payload without touching the file itself.
// Video files can exceed the serverless request-body limit if proxied through this
// server (the way /api/upload does for question images), so the admin video form
// uses this signature to upload the file directly from the browser to Cloudinary.
export async function POST() {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloud || !apiKey || !apiSecret) {
    return NextResponse.json({ error: 'Cloudinary not configured' }, { status: 500 });
  }

  const timestamp = Math.round(Date.now() / 1000);
  const folder = 'mpugura/videos';

  const paramStr = `folder=${folder}&timestamp=${timestamp}`;
  const signature = createHash('sha1').update(paramStr + apiSecret).digest('hex');

  return NextResponse.json({ cloud, apiKey, timestamp, signature, folder });
}
