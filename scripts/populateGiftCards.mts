#!/usr/bin/env node

import { initializeApp, cert,getApps} from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_ADMIN_KEY as string))
  });
}

// Now you can use Firebase services
const db = getFirestore();
const giftCardCodesRef = db.collection('giftCardCodes');

console.log('Script started');

const generateCode = () => {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
};

const populateGiftCards = async (count: number) => {
  console.log('Starting to add gift card codes...');

  for (let i = 0; i < count; i++) {
    const code = generateCode();
    try {
      const docRef = giftCardCodesRef.doc();
      await docRef.set({
        code: code,
        used: false
      });
      console.log(`Added gift card code: ${code} with ID: ${docRef.id}`);
    } catch (error) {
      console.error(`Error adding gift card code: ${code}`, error);
    }
  }

  console.log(`Finished adding ${count} gift card codes.`);
};

console.log('About to run populateGiftCards');

// Run the population script
populateGiftCards(100)
  .then(() => console.log('Script completed successfully'))
  .catch((error) => console.error('Script failed:', error));

console.log('Script execution initiated');
