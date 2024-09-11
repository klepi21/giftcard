import React from 'react'
import { loadStripe } from '@stripe/stripe-js';
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function PurchasePage({
  sessions,
  setSessions,
  email,
  setEmail,
  calculatePrice,
  GiftCard
}: {
  sessions: number;
  setSessions: (sessions: number) => void;
  email: string;
  setEmail: (email: string) => void;
  calculatePrice: (sessions: number) => number;
  GiftCard: React.ComponentType<{ interactive: boolean }>;
}) {
  const handlePurchase = async () => {
    const stripe = await stripePromise;
    if (!stripe) {
      console.error('Stripe failed to load');
      return;
    }
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessions, email }),
    });
    const session = await response.json();
    const result = await stripe.redirectToCheckout({
      sessionId: session.id,
    });
    if (result.error) {
      console.error(result.error.message);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Δωροκάρτα Βελονισμού</CardTitle>
        <CardDescription>Επιλέξτε τον αριθμό των συνεδριών που θέλετε να δωρίσετε</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Label htmlFor="sessions" className="text-gray-700">Αριθμός Συνεδριών: {sessions}</Label>
          <Slider
            id="sessions"
            min={1}
            max={10}
            step={1}
            value={[sessions]}
            onValueChange={(value) => setSessions(value[0])}
            className="mt-2"
          />
        </div>
        <GiftCard interactive={false} />
        <div className="mt-4">
          <p className="text-lg font-semibold text-gray-800">Τιμή: €{calculatePrice(sessions)}</p>
          {sessions >= 9 && (
            <p className="text-sm text-green-600">Εφαρμόστηκε έκπτωση 20%!</p>
          )}
          {sessions >= 5 && sessions < 9 && (
            <p className="text-sm text-green-600">Εφαρμόστηκε έκπτωση 10%!</p>
          )}
        </div>
        <div className="mt-4">
          <Label htmlFor="email" className="text-gray-700">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="Εισάγετε το email σας"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 bg-white border-gray-300 text-gray-800"
          />
        </div>
      </CardContent>
      <CardFooter className="flex flex-col">
        <Button 
          onClick={handlePurchase} 
          disabled={!email} 
          className="w-full bg-[#8c7a6b] hover:bg-[#7a6a5d] text-white"
        >
          Προχωρήστε στην πληρωμή
        </Button>
        <p className="text-xs text-gray-600 text-center mt-2">
          Θα μεταφερθείτε στη σελίδα πληρωμής του Stripe για να ολοκληρώσετε την αγορά σας.
        </p>
      </CardFooter>
    </Card>
  )
}
