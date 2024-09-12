import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  try {
    const serviceAccount = process.env.FIREBASE_ADMIN_KEY 
      ? JSON.parse(process.env.FIREBASE_ADMIN_KEY)
      : {};

    if (!serviceAccount.project_id) {
      throw new Error('FIREBASE_ADMIN_KEY is not properly formatted');
    }

    initializeApp({
      credential: cert(serviceAccount as any),
    });

    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
    throw error;
  }
}

const db = getFirestore();

export { db };
