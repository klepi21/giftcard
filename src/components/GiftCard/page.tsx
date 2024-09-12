import React, { useState, useEffect, useRef } from 'react'
import { Leaf, Download, ChevronLeft, ChevronRight } from 'lucide-react'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import axios from 'axios'; // Add this import

interface GiftCardProps {
  sessions: number;
  calculatePrice: (sessions: number) => number;
  giftCardCode: string;
  email: string; // Add this prop
}

const GiftCard: React.FC<GiftCardProps> = ({ sessions, calculatePrice, giftCardCode, email }) => {
  const [currentSide, setCurrentSide] = useState(0) // 0 for front, 1 for back
  const [isEmailSent, setIsEmailSent] = useState(false)
  const frontRef = useRef<HTMLDivElement>(null)
  const backRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sendEmail = async () => {
      if (!email || !giftCardCode || !sessions) {
        console.log('Waiting for all data to be available...');
        return;
      }

      if (isEmailSent) {
        console.log('Email already sent');
        return;
      }

      try {
        // Generate front and back images
        const frontImage = await generateImage(frontRef.current)
        const backImage = await generateImage(backRef.current)

        const response = await axios.post('/api/send-gift-card-email', {
          email,
          giftCardCode,
          sessions,
          frontImage,
          backImage
        });
        console.log('Email sent successfully:', response.data);
        setIsEmailSent(true);
      } catch (error) {
        console.error('Error sending email:', error);
        if (axios.isAxiosError(error)) {
          console.error('Error details:', error.response?.data);
        }
      }
    };

    sendEmail();
  }, [email, giftCardCode, sessions, isEmailSent]);

  const generateImage = async (element: HTMLElement | null) => {
    if (!element) return null
    
    // If it's the back side
    if (element.classList.contains('gift-card-back')) {
      const parentElement = element.parentElement

      if (parentElement) {
        // Temporarily remove the flip transformation
        const originalTransform = parentElement.style.transform
        parentElement.style.transform = 'none'
        element.style.transform = 'none'

        // Capture the image
        const canvas = await html2canvas(element)
        const imageData = canvas.toDataURL('image/png')

        // Restore the original transformation
        parentElement.style.transform = originalTransform
        element.style.transform = ''

        return imageData
      }
    }

    // For front side or if back side capture fails
    const canvas = await html2canvas(element)
    return canvas.toDataURL('image/png')
  }

  const handleSlide = (direction: 'next' | 'prev') => {
    setCurrentSide(direction === 'next' ? 1 : 0)
  }

  const handleDownload = async () => {
    const pdf = new jsPDF('l', 'mm', [85.6, 53.98]) // Standard credit card size

    // Capture front side
    const frontElement = document.querySelector('.gift-card-front') as HTMLElement
    const frontCanvas = await html2canvas(frontElement)
    const frontImgData = frontCanvas.toDataURL('image/png')
    pdf.addImage(frontImgData, 'PNG', 0, 0, 85.6, 53.98)

    // Add new page for back side
    pdf.addPage()

    // Capture back side
    const backElement = document.querySelector('.gift-card-back') as HTMLElement
    const parentElement = backElement.parentElement

    // Temporarily remove the flip transformation
    if (parentElement) {
      const originalTransform = parentElement.style.transform
      parentElement.style.transform = 'none'
      backElement.style.transform = 'none'

      const backCanvas = await html2canvas(backElement)
      const backImgData = backCanvas.toDataURL('image/png')
      pdf.addImage(backImgData, 'PNG', 0, 0, 85.6, 53.98)

      // Restore the original transformation
      parentElement.style.transform = originalTransform
      backElement.style.transform = ''
    }

    // Download PDF
    pdf.save('Avgouste_GiftCard.pdf');
  }

  return (
    <>
      <div className="w-full max-w-sm mx-auto relative flex items-center">
        <button 
          className="absolute left-[-40px] bg-white/50 rounded-full p-2 shadow-md"
          onClick={() => handleSlide('prev')}
          disabled={currentSide === 0}
        >
          <ChevronLeft className="w-6 h-6 text-[#5d4c40]" />
        </button>
        
        <div className="w-full overflow-hidden rounded-xl shadow-xl">
          <div 
            className="flex transition-transform duration-300 ease-in-out"
            style={{ transform: `translateX(-${currentSide * 100}%)` }}
          >
            <div ref={frontRef} className="gift-card-front w-full flex-shrink-0 bg-gradient-to-br from-[#e6d7c3] to-[#d4c3b3] p-4 sm:p-6 flex flex-col">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <div className="flex items-center">
                    <Leaf className="w-6 h-6 sm:w-8 sm:h-8 text-[#8c7a6b]" />
                    <span className="ml-2 text-xl sm:text-2xl font-semibold text-[#5d4c40]">Avgouste</span>
                  </div>
                  <span className="ml-8 sm:ml-10 text-xs sm:text-sm text-[#5d4c40]">Ιατρείο Βελονισμού</span>
                </div>
                <div className="text-right">
                  <p className="text-xs sm:text-xl font-medium text-[#5d4c40]">
                    {sessions} {sessions === 1 ? 'Συνεδρία' : 'Συνεδρίες'}
                  </p>
                </div>
              </div>
              <div className="text-center flex-grow flex items-center justify-center">
                <p className="text-4xl sm:text-4xl font-bold text-[#8c7a6b] opacity-20">ΔΩΡΟΚΑΡΤΑ</p>
              </div>
              <div className="flex justify-between items-end mt-auto">
                <p className="text-xs sm:text-sm text-[#5d4c40]">Ισχύει για ένα έτος</p>
              </div>
            </div>
            <div ref={backRef} className="gift-card-back w-full flex-shrink-0 bg-[#f0e6d9] p-4">
              <p className="text-[#5d4c40] text-xs">
                Αυτή η δωροκάρτα δίνει στον κάτοχο {sessions} {sessions > 1 ? 'συνεδρίες' : 'συνεδρία'} βελονισμού.
                Παρακαλώ παρουσιάστε αυτή την κάρτα ή τον κωδικό παρακάτω κατά την ώρα του ραντεβού σας.
              </p>
              <div className="text-center">
                <p className="text-sm font-semibold text-[#8c7a6b]">Κωδικός Δωροκάρτας</p>
                <p className="text-lg font-bold text-[#5d4c40]">{giftCardCode}</p>
              </div>
              <p className="text-[#5d4c40] text-xs text-center">
                Ισχύουν όροι και προϋποθέσεις. Δεν συνδυάζεται με άλλες προσφορές.
              </p>
            </div>
          </div>
        </div>
        
        <button 
          className="absolute right-[-40px] bg-white/50 rounded-full p-2 shadow-md"
          onClick={() => handleSlide('next')}
          disabled={currentSide === 1}
        >
          <ChevronRight className="w-6 h-6 text-[#5d4c40]" />
        </button>
      </div>
      
      <div className="mt-4 text-xs text-[#5d4c40]">
        <p>* Χρησιμοποιήστε τα βέλη για να δείτε και τις δύο πλευρές της κάρτας δώρου</p>
        <p>** Για να ισχύει η κάρτα δώρου, πρέπει να κλείσετε ραντεβού με τον γιατρό είτε μέσω doctoranytime είτε μέσω τηλεφώνου</p>
      </div>
      
      <div className="mt-6 text-center">
        <button
          onClick={handleDownload}
          className="px-4 py-2 bg-gradient-to-br from-[#e6d7c3] to-[#d4c3b3] text-[#5d4c40] rounded-md shadow-md hover:shadow-lg transition-shadow duration-300 flex items-center justify-center mx-auto"
        >
          <Download className="w-5 h-5 mr-2" />
          Λήψη Δωροκάρτας
        </button>
      </div>
    </>
  )
}

export default GiftCard

