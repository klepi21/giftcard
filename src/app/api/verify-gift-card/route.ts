import { NextResponse } from 'next/server';
import { db } from '../../../lib/firebaseAdmin'; // Adjust this import path as needed

export async function POST(request: Request) {
  try {
    console.log('API route started');
    const { giftCardCode, email } = await request.json();
    
    console.log('API received giftCardCode:', giftCardCode);
    console.log('API received email:', email);

    if (!giftCardCode || !email) {
      console.log('Missing giftCardCode or email');
      return NextResponse.json({ error: 'Missing giftCardCode or email' }, { status: 400 });
    }

    console.log('Querying Firestore for gift card code:', giftCardCode);
    
    try {
      const snapshot = await db.collection('giftCardCodes')
        .where('code', '==', giftCardCode)
        .limit(1)
        .get();

      if (snapshot.empty) {
        console.log('Gift card not found in database');
        return NextResponse.json({ error: 'Invalid gift card code' }, { status: 400 });
      }

      const doc = snapshot.docs[0];
      const data = doc.data();
      console.log('Database data:', JSON.stringify(data, null, 2));

      if (!data?.reservedFor) {
        console.log('No reservedFor field in the document');
        return NextResponse.json({ error: 'Gift card not properly configured' }, { status: 400 });
      }

      if (data.reservedFor !== email) {
        console.log('Email mismatch. Expected:', data.reservedFor, 'Received:', email);
        return NextResponse.json({ error: 'Email mismatch' }, { status: 400 });
      }

      console.log('Gift card verified successfully');
      return NextResponse.json({ valid: true });
    } catch (firestoreError: unknown) {
      console.error('Firestore query error:', firestoreError);
      return NextResponse.json({ error: 'Database query error', details: (firestoreError as Error).message }, { status: 500 });
    }
  } catch (error: unknown) {
    console.error('Error in API route:', error);
    return NextResponse.json({ 
      error: 'Server error', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
