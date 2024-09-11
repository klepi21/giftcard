'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { jsPDF } from 'jspdf'
import { Leaf } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import PurchasePage from './PurchasePage'
import SuccessPage from '../../app/success/SuccessPage'
import { loadStripe } from '@stripe/stripe-js';

// Move this outside of your component
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function AcupunctureGiftCard() {
  const [sessions, setSessions] = useState(1)
  const [email, setEmail] = useState('')
  const [isPurchased, setIsPurchased] = useState(false)
  const [giftCardCode, setGiftCardCode] = useState('')
  const [isFlipped, setIsFlipped] = useState(false)
  const [paymentSuccessful, setPaymentSuccessful] = useState(false)
  const searchParams = useSearchParams()
  const success = searchParams.get('success')
  const session_id = searchParams.get('session_id')

  useEffect(() => {
    if (success === 'true' && session_id) {
      // Generate a random 7-character code
      const code = Math.random().toString(36).substring(2, 9).toUpperCase();
      setGiftCardCode(code);
      setIsPurchased(true);
      setPaymentSuccessful(true);
    }
  }, [success, session_id]);

  const calculatePrice = useCallback((sessions: number) => {
    if (sessions === 1) {
      return 50;
    } else if (sessions >= 2 && sessions <= 4) {
      return sessions * 40;
    } else if (sessions >= 5 && sessions <= 7) {
      return Math.round(sessions * 40 * 0.9); // 10% discount
    } else if (sessions >= 8 && sessions <= 10) {
      return Math.round(sessions * 40 * 0.8); // 20% discount
    }
    // For any other case (e.g., more than 10 sessions), use the 10+ session pricing
    return Math.round(sessions * 40 * 0.8);
  }, [])

  const handlePurchase = useCallback(async () => {
    const stripe = await stripePromise;
    if (!stripe) {
      console.error('Stripe failed to load');
      return;
    }

    // ... handle Stripe payment

    if (paymentSuccessful) {
      const code = Math.random().toString(36).substring(2, 9).toUpperCase()
      const successUrl = `/success?sessions=${sessions}&email=${encodeURIComponent(email)}&giftCardCode=${code}`
      window.location.href = successUrl
    }
  }, [sessions, email, paymentSuccessful])

  const handleDownloadPDF = useCallback(() => {
    console.log("handleDownloadPDF called");
    const doc = new jsPDF()
    const canvas = document.getElementById('gift-card-canvas') as HTMLCanvasElement
    if (canvas) {
      const imgData = canvas.toDataURL('image/png')
      doc.addImage(imgData, 'PNG', 10, 10, 190, 100)
      doc.save('acupuncture-gift-card.pdf')
    }
  }, [])

  const GiftCard = ({ interactive = false }) => {
    console.log("GiftCard rendering with interactive:", interactive);
    return (
      <div 
        className="w-full max-w-sm mx-auto [perspective:1000px]" 
        onClick={() => interactive && setIsFlipped(!isFlipped)}
      >
        <div className={`relative w-full aspect-[1.78/1] transition-transform duration-700 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
          {/* Front of the card */}
          <div className="absolute w-full h-full bg-gradient-to-br from-[#e6d7c3] to-[#d4c3b3] rounded-xl shadow-xl [backface-visibility:hidden]">
            <div className="p-4 sm:p-6 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <div className="flex items-center">
                    <Leaf className="w-6 h-6 sm:w-8 sm:h-8 text-[#8c7a6b]" />
                    <span className="ml-2 text-xl sm:text-2xl font-semibold text-[#5d4c40]">Avgouste</span>
                  </div>
                  <span className="ml-8 sm:ml-10 text-xs sm:text-sm text-[#5d4c40]">Ιατρείο Βελονισμού</span>
                </div>
                <div className="text-right">
                  <p className="text-xs sm:text-sm font-medium text-[#5d4c40]">
                    {sessions} {sessions === 1 ? 'Συνεδρία' : 'Συνεδρίες'}
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-[#8c7a6b]">€{calculatePrice(sessions)}</p>
                </div>
              </div>
              <div className="text-center">
                <p className="text-4xl sm:text-5xl font-bold text-[#8c7a6b] opacity-20">ΔΩΡΟΚΑΡΤΑ</p>
              </div>
              <div className="flex justify-between items-end">
                <p className="text-xs sm:text-sm text-[#5d4c40]">Ισχύει για ένα έτος</p>
              </div>
            </div>
          </div>
          {/* Back of the card */}
          <div className="absolute w-full h-full bg-[#f0e6d9] rounded-xl shadow-xl [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <div className="p-4 sm:p-6 flex flex-col justify-between h-full">
              <p className="text-xs text-[#5d4c40]">
                Αυτή η δωροκάρτα παρέχει στον κάτοχο {sessions} συνεδρία{sessions > 1 ? 'Συνεδρίες' : ''} βελονισμού στο Avgouste.
                Παρακαλώ παρουσιάστε την κάρτα ή τον κωδικό κατά την ώα του ραντεβο σας.
              </p>
              <div className="text-center">
                <p className="text-sm font-semibold text-[#8c7a6b]">Κωδικός Δωροκάρτας</p>
                <p className="text-lg font-bold text-[#5d4c40]">{giftCardCode}</p>
              </div>
              <p className="text-xs text-[#5d4c40] text-center">
                Δεν συνδυάζεται με άλλες προσφορές.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  console.log("AcupunctureGiftCard rendering. State:", {
    isPurchased,
    sessions,
    email,
    giftCardCode
  });

  if (isPurchased) {
    console.log("Attempting to render PurchaseSuccessPage with props:", {
      sessions,
      email,
      giftCardCode,
      GiftCard: typeof GiftCard === 'function' ? "GiftCard component defined" : "GiftCard component undefined",
      handleDownloadPDF: typeof handleDownloadPDF === 'function' ? "handleDownloadPDF defined" : "handleDownloadPDF undefined"
    });
  }

  return isPurchased ? (
    <SuccessPage />
  ) : (
    <PurchasePage 
      sessions={sessions} 
      setSessions={setSessions} 
      email={email} 
      setEmail={setEmail} 
      calculatePrice={calculatePrice} 
      GiftCard={GiftCard}
    />
  );
}

interface PurchaseSuccessPageProps {
  sessions: number;
  email: string;
  giftCardCode: string;
  GiftCard: ({ interactive }: { interactive?: boolean }) => JSX.Element;
  handleDownloadPDF: () => void;
}
