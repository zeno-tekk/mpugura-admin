import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloud || !apiKey || !apiSecret) {
    return NextResponse.json({ error: 'Cloudinary not configured' }, { status: 500 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  const timestamp = Math.round(Date.now() / 1000);
  const folder = 'mpugura/questions';

  // Cloudinary signature: SHA1 of sorted params + api_secret
  const paramStr = `folder=${folder}&timestamp=${timestamp}`;
  const signature = createHash('sha1').update(paramStr + apiSecret).digest('hex');

  const upload = new FormData();
  upload.append('file', file);
  upload.append('api_key', apiKey);
  upload.append('timestamp', timestamp.toString());
  upload.append('signature', signature);
  upload.append('folder', folder);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, {
    method: 'POST',
    body: upload,
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: err }, { status: 500 });
  }

  const data = (await res.json()) as { secure_url: string };
  return NextResponse.json({ url: data.secure_url });
}
