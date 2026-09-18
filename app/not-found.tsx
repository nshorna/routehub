'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home } from 'lucide-react'
import { APP_NAME } from '@/lib/constants'

export default function NotFound() {
  const router = useRouter()
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    if (countdown === 0) {
      router.push('/')
      return
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [countdown, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md w-full">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-primary mb-4">404</h1>
          <h2 className="text-3xl font-semibold text-foreground mb-4">Page Not Found</h2>
          <p className="text-muted-foreground text-lg">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="mb-8">
          <p className="text-sm text-muted-foreground mb-2">
            Redirecting to home page in
          </p>
          <div className="text-4xl font-bold text-primary mb-4">
            {countdown}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" asChild>
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              Go Home Now
            </Link>
          </Button>
          <Button size="lg" variant="outline" onClick={() => router.back()}>
            Go Back
          </Button>
        </div>

        <div className="mt-8 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
