'use client'

import { useEffect, useState } from 'react'
import AcupunctureGiftCard from '@/components/AcupunctureGiftCard/AcupunctureGiftCard'

export default function Home() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="max-w-4xl mx-auto">
      <AcupunctureGiftCard />
    </div>
  )
}
