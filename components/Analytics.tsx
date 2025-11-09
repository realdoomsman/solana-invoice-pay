'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export function Analytics() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Track page views
      const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')
      
      // You can integrate with Google Analytics, Plausible, or other analytics here
      // Example: gtag('config', 'GA_MEASUREMENT_ID', { page_path: url })
      
      console.log('Page view:', url)
    }
  }, [pathname, searchParams])

  return null
}
