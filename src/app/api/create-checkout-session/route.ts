import { NextResponse } from 'next/server'
import Stripe from 'stripe';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { App } from 'firebase-admin/app';

// Replace the Firebase initialization code with this:
if (!getApps().length) {
  try {
    if (!process.env.FIREBASE_ADMIN_KEY) {
      throw new Error('FIREBASE_ADMIN_KEY is not set');
    }
    
    console.log('Raw FIREBASE_ADMIN_KEY:', process.env.FIREBASE_ADMIN_KEY);
    
    // Remove surrounding single quotes and unescape the JSON string
    const cleanedKey = process.env.FIREBASE_ADMIN_KEY.replace(/^'|'$/g, '').replace(/\\"/g, '"');
    
    console.log('Cleaned FIREBASE_ADMIN_KEY:', cleanedKey);
    
    let adminKey;
    try {
      adminKey = JSON.parse(cleanedKey);
    } catch (parseError) {
      console.error('Parse error:', parseError);
      throw new Error(`Failed to parse FIREBASE_ADMIN_KEY: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
    }

    if (!adminKey.project_id || !adminKey.private_key) {
      throw new Error('Admin key is missing required fields');
    }

    // Ensure private_key is properly formatted
    adminKey.private_key = adminKey.private_key.replace(/\\n/g, '\n');

    initializeApp({
      credential: cert(adminKey as any)
    });
  } catch (error: unknown) {
    console.error('Failed to initialize Firebase Admin:', error);
    if (error instanceof Error) {
      throw new Error(`Firebase Admin initialization failed: ${error.message}`);
    } else {
      throw new Error('Firebase Admin initialization failed: Unknown error');
    }
  }
}

const adminDb = getFirestore();

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
    const giftCardCode = await generateGiftCardCode();

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

async function generateGiftCardCode() {
  const codesRef = adminDb.collection('giftCardCodes');
  const q = codesRef.where('used', '==', false);
  const querySnapshot = await q.get();

  if (querySnapshot.empty) {
    throw new Error('No available gift card codes');
  }

  const availableCodes = querySnapshot.docs;
  const randomIndex = Math.floor(Math.random() * availableCodes.length);
  const randomDoc = availableCodes[randomIndex];

  return randomDoc.data().code;
}