'use client'

import { ThirdwebProvider } from 'thirdweb/react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/toaster'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThirdwebProvider>
      <TooltipProvider>
        <Toaster />
        {children}
      </TooltipProvider>
    </ThirdwebProvider>
  )
}