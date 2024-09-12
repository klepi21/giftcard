import { NextResponse } from 'next/server'
import Stripe from 'stripe';
import { db } from '../../../lib/firebaseAdmin'; // Adjust the path as needed
// Remove this line:
// import { db } from '../../../lib/firebase';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { App } from 'firebase-admin/app';

// Replace the Firebase initialization code with this:
let adminDb: FirebaseFirestore.Firestore;

if (!getApps().length) {
  try {
    console.log('Initializing Firebase Admin...');
    const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_KEY || '{}');
    
    console.log('Project ID:', serviceAccount.project_id);
    console.log('Client Email:', serviceAccount.client_email);
    console.log('Private Key length:', serviceAccount.private_key?.length);

    const app = initializeApp({
      credential: cert({
        projectId: serviceAccount.project_id,
        clientEmail: serviceAccount.client_email,
        privateKey: serviceAccount.private_key?.replace(/\\n/g, '\n'),
      }),
    });

    adminDb = getFirestore(app);
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
    throw error;
  }
} else {
  adminDb = getFirestore();
}

// Log to verify Firestore instance
console.log('Firestore instance:', adminDb ? 'Created' : 'Failed to create');

declare global {
  var firebaseAdmin: App | undefined;
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

// Initialize Firebase Admin
if (!global.firebaseAdmin) {
  try {
    if (!process.env.FIREBASE_ADMIN_KEY) {
      throw new Error('FIREBASE_ADMIN_KEY is not set');
    }
    
    let adminKey;
    try {
      // First, try parsing it directly
      adminKey = JSON.parse(process.env.FIREBASE_ADMIN_KEY);
    } catch (parseError) {
      console.error('Failed to parse FIREBASE_ADMIN_KEY directly:', parseError);
      try {
        // If direct parsing fails, try removing escaped quotes and then parse
        const unescapedKey = process.env.FIREBASE_ADMIN_KEY.replace(/\\"/g, '"');
        adminKey = JSON.parse(unescapedKey);
      } catch (secondParseError) {
        console.error('Failed to parse FIREBASE_ADMIN_KEY after unescaping:', secondParseError);
        const errorMessage = secondParseError instanceof Error ? secondParseError.message : 'Unknown error';
        throw new Error(`Failed to parse FIREBASE_ADMIN_KEY: ${errorMessage}`);
      }
    }

    if (!getApps().length) {
      initializeApp({
        credential: cert(adminKey)
      });
    }
    global.firebaseAdmin = getApps()[0];
  } catch (error: unknown) {
    console.error('Failed to initialize Firebase Admin:', error);
    if (error instanceof Error) {
      throw new Error(`Firebase Admin initialization failed: ${error.message}`);
    } else {
      throw new Error('Firebase Admin initialization failed: Unknown error');
    }
  }
}

export async function POST(request: Request) {
  try {
    console.log('Starting POST request');
    
    const { sessions, email } = await request.json();
    console.log('Received data:', { sessions, email });

    // Calculate price based on sessions
    const calculatePrice = (sessions: number) => {
      const basePrice = sessions * 50;
      if (sessions >= 9) {
        return Math.round(basePrice * 0.8);
      } else if (sessions >= 5) {
        return Math.round(basePrice * 0.9);
      }
      return basePrice;
    };

    const price = calculatePrice(sessions);
    let giftCardCode;
    try {
      giftCardCode = await generateAndReserveGiftCardCode(email);
    } catch (giftCardError) {
      console.error('Gift card generation error:', giftCardError);
      throw giftCardError; // Re-throw the error with the detailed message
    }

    console.log('Creating Stripe checkout session');
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Acupuncture Gift Card',
              description: `${sessions} session${sessions > 1 ? 's' : ''}`,
            },
            unit_amount: price * 100, // Stripe uses cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${request.headers.get('origin')}/success?sessions=${sessions}&email=${encodeURIComponent(email)}&giftCardCode=${giftCardCode}`,
      cancel_url: `${request.headers.get('origin')}/cancel`,
      customer_email: email,
      metadata: {
        giftCardCode: giftCardCode,
        email: email,
        sessions: sessions.toString() // Add this line
      }
    });

    console.log('Stripe session created successfully');
    return NextResponse.json({ id: session.id });
  } catch (err: any) {
    console.error('Error in POST request:', err);
    return NextResponse.json(
      { 
        statusCode: 500, 
        message: err.message,
        stack: err.stack,
        name: err.name
      }, 
      { status: 500 }
    );
  }
}

async function generateAndReserveGiftCardCode(email: string) {
  try {
    console.log('Attempting to generate and reserve gift card code...');
    
    const codesRef = db.collection('giftCardCodes');
    const q = codesRef.where('used', '==', false).limit(1);
    
    console.log('Executing Firestore query...');
    const querySnapshot = await q.get();
    
    console.log('Query executed. Empty?', querySnapshot.empty);

    if (querySnapshot.empty) {
      throw new Error('No available gift card codes');
    }

    const doc = querySnapshot.docs[0];
    const giftCardCode = doc.data().code;

    // Update the document to reserve it and mark it as used
    await doc.ref.update({
      reservedFor: email,
      reservedAt: new Date(),
      used: true,
      usedBy: email,
      usedAt: new Date()
    });

    console.log('Reserved and marked as used gift card code:', giftCardCode);
    return giftCardCode;
  } catch (error) {
    console.error('Error in generateAndReserveGiftCardCode:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to generate and reserve gift card code: ${error.message}`);
    } else {
      throw new Error('Failed to generate and reserve gift card code: Unknown error');
    }
  }
}
