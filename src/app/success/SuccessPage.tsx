'use client';

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

import GiftCard from '../../components/GiftCard/page'
import Benefits from '../acupuncture-benefits/page'

function SuccessContent() {
  const [sessions, setSessions] = useState(0)
  const [email, setEmail] = useState('')
  const [giftCardCode, setGiftCardCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const searchParams = useSearchParams()

  useEffect(() => {
    const fetchData = async () => {
      const sessionsParam = searchParams.get('sessions')
      const emailParam = searchParams.get('email')
      const giftCardCodeParam = searchParams.get('giftCardCode')

      // Add these console logs
      console.log('Client-side email:', emailParam);
      console.log('Client-side giftCardCode:', giftCardCodeParam);

      if (!sessionsParam || !emailParam || !giftCardCodeParam) {
        setError('Invalid request parameters')
        setIsLoading(false)
        return
      }

      setSessions(Number(sessionsParam))
      setEmail(emailParam)
      setGiftCardCode(giftCardCodeParam)

      try {
        console.log('Sending verification request to API');
        const response = await fetch('/api/verify-gift-card', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ giftCardCode: giftCardCodeParam, email: emailParam }),
        });

        console.log('Received response from API');
        const data = await response.json();
        console.log('API response:', data);
        
        if (!response.ok) {
          console.log('API error:', data.error);
          setError(data.error === 'Invalid gift card code' ? "You tried to steal, not fair!" : data.error);
        } else {
          console.log('Gift card verified successfully');
        }
      } catch (error) {
        console.error('Error during API call:', error);
        setError('An error occurred while verifying the gift card');
      }

      setIsLoading(false)
    }

    fetchData()
  }, [searchParams])

  const calculatePrice = (sessions: number) => {
    if (sessions === 1) {
      return 50;
    } else if (sessions >= 2 && sessions <= 4) {
      return sessions * 40;
    } else if (sessions >= 5 && sessions <= 7) {
      return Math.round(sessions * 40 * 0.9); // 10% discount
    } else if (sessions >= 8 && sessions <= 10) {
      return Math.round(sessions * 40 * 0.8); // 20% discount
    }
    return Math.round(sessions * 40 * 0.8);
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-xl font-bold mb-4">Error</h1>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-xl font-bold mb-4">Ευχαριστούμε για την αγορά σας!</h1>
      <p className="mb-4">Η δωροκάρτα σας έχει σταλεί στο: {email}</p>
      <div className="max-w-xs mx-auto">
        <GiftCard 
          sessions={sessions}
          calculatePrice={calculatePrice}
          giftCardCode={giftCardCode}
          email={email}
        />
        <Benefits />
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div>Φόρτωση...</div>}>
      <SuccessContent />
    </Suspense>
  )
}