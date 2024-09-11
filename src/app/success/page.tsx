'use client';

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import GiftCard from '../../components/GiftCard/page'

interface PurchaseSuccessPageProps {
  sessions: number;
  email: string;
  giftCardCode: string;
  GiftCard: React.ComponentType<{ interactive?: boolean }>;
  handleDownloadPDF: () => void;
}

export default function PurchaseSuccessPage({
  sessions,
  email,
  giftCardCode,
}: Omit<PurchaseSuccessPageProps, 'GiftCard' | 'handleDownloadPDF'>) {
  const searchParams = useSearchParams();
  const [sessionsState, setSessionsState] = useState(0)
  const [emailState, setEmailState] = useState('')
  const [giftCardCodeState, setGiftCardCodeState] = useState('')

  useEffect(() => {
    setSessionsState(Number(searchParams.get('sessions')) || 0)
    setEmailState(searchParams.get('email') || '')
    setGiftCardCodeState(searchParams.get('giftCardCode') || '')
  }, [searchParams])

  const calculatePrice = (sessions: number) => {
    // Implement your price calculation logic here
    return sessions * 50 // Example calculation
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-xl font-bold mb-4">Ευχαριστούμε για την αγορά σας!</h1>
      <p className="mb-4">Η δωροκάρτα σας έχει σταλεί στο: {emailState}</p>
      <div className="max-w-xs mx-auto">
        <GiftCard 
          sessions={sessionsState}
          calculatePrice={calculatePrice}
          giftCardCode={giftCardCodeState}
          email={emailState} // Add this prop
        />
      </div>
    </div>
  )
}
