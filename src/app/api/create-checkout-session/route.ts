import { NextResponse } from 'next/server'
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export async function POST(request: Request) {
  try {
    console.log('Stripe Secret Key:', process.env.STRIPE_SECRET_KEY ? 'Set' : 'Not set');
    
    const { sessions, email } = await request.json();
    
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
    const giftCardCode = generateGiftCardCode(); // Implement this function

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
    });

    return NextResponse.json({ id: session.id });
  } catch (err: any) {
    console.error('Stripe checkout error:', err);
    return NextResponse.json({ statusCode: 500, message: err.message }, { status: 500 });
  }
}

function generateGiftCardCode() {
  // Implement your gift card code generation logic here
  return 'GC' + Math.random().toString(36).substring(2, 10).toUpperCase();
}
