# Mpugura Admin

Simple Next.js admin panel for managing the Mpugura mobile app with Firebase only.

## What It Covers

- Admin login with Firebase Auth
- Dashboard metrics for content, students, and payments
- Category and lesson management in Firestore
- Student management with premium toggling
- Manual payment recording
- Seed action for importing the current mobile app catalog into Firestore

## Run It

```bash
npm install
npm run dev
```

## Firebase Collections Used

- `categories`
- `lessons`
- `examQuestions`
- `users`
- `payments`

## Important Note

This MVP is client-only. For production security, lock down Firestore rules so only your admin account can write to these collections.

