'use client';

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import GiftCard from '../../components/GiftCard/page'

export default function SuccessPage() {
  const [sessions, setSessions] = useState(0)
  const [email, setEmail] = useState('')
  const [giftCardCode, setGiftCardCode] = useState('')
  const searchParams = useSearchParams()

  useEffect(() => {
    setSessions(Number(searchParams.get('sessions')) || 0)
    setEmail(searchParams.get('email') || '')
    setGiftCardCode(searchParams.get('giftCardCode') || '')

    console.log('Payment successful', { 
      email: searchParams.get('email'), 
      sessions: searchParams.get('sessions'), 
      giftCardCode: searchParams.get('giftCardCode') 
    })
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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-xl font-bold mb-4">Ευχαριστούμε για την αγορά σας!</h1>
      <p className="mb-4">Η δωροκάρτα σας έχει σταλεί στο: {email}</p>
      <div className="max-w-xs mx-auto">
        <GiftCard 
          sessions={sessions}
          calculatePrice={calculatePrice}
          giftCardCode={giftCardCode}
          email={email} // Add this prop
        />
      </div>
    </div>
  )
}