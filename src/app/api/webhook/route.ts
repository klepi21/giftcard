import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { getFirestore } from 'firebase-admin/firestore';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const sig = headers().get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    await handleSuccessfulPayment(session);
  }

  return NextResponse.json({ received: true });
}

async function handleSuccessfulPayment(session: Stripe.Checkout.Session) {
  const db = getFirestore();
  const { giftCardCode, email } = session.metadata!;
  const sessions = parseInt(session.metadata!.sessions || '0', 10);

  // Update gift card code as used
  await db.collection('giftCardCodes').doc(giftCardCode).update({ used: true });

  // Create a new order document
  await db.collection('orders').add({
    email,
    giftCardCode,
    sessions,
    amount: session.amount_total,
    status: 'completed',
    createdAt: new Date()
  });
}
