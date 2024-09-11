'use client';

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import GiftCard from '../../components/GiftCard/page'

export default function SuccessPage() {
  const [sessions, setSessions] = useState(0)
  const [email, setEmail] = useState('')
  const [giftCardCode, setGiftCardCode] = useState('')
  const [isValid, setIsValid] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const sessionsParam = Number(searchParams.get('sessions')) || 0
    const emailParam = searchParams.get('email') || ''
    const giftCardCodeParam = searchParams.get('giftCardCode') || ''

    // Validate the purchase
    fetch('/api/validate-purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessions: sessionsParam, email: emailParam, giftCardCode: giftCardCodeParam })
    })
    .then(response => response.json())
    .then(data => {
      if (data.valid) {
        setSessions(sessionsParam)
        setEmail(emailParam)
        setGiftCardCode(giftCardCodeParam)
        setIsValid(true)
      }
      setIsLoading(false)
    })
    .catch(error => {
      console.error('Validation error:', error)
      setIsLoading(false)
    })
  }, [])

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

  if (!isValid) {
    return <div>Invalid purchase. Please contact support.</div>
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
