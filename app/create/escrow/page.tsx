'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CreateEscrowPayment() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to escrow type selector
    router.push('/create/escrow/select')
  }, [router])
  
  return null
}

