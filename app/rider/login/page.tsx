'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Bike, ArrowLeft } from 'lucide-react'
import { APP_NAME } from '@/lib/constants'
import Link from 'next/link'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/lib/auth-context'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase.client'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function RiderLoginPage() {
  const router = useRouter()
  const { user, loading, getIdToken } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Redirect if already logged in and verified as rider
  useEffect(() => {
    const checkAndRedirect = async () => {
      if (loading || !user) return;

      try {
        const idToken = await getIdToken();
        if (!idToken) return;

        const response = await fetch('/api/auth/user', {
          headers: {
            'Authorization': `Bearer ${idToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.user?.role === 'RIDER') {
            // Redirect all riders to dashboard regardless of status
            router.push('/rider/dashboard');
          }
        }
      } catch (error) {
        // Silently fail - user will stay on login page
        console.error('Error checking user role:', error);
      }
    };

    checkAndRedirect();
  }, [user, loading, router, getIdToken])

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onChange',
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password)
      
      // Get ID token
      const idToken = await userCredential.user.getIdToken()

      // Verify token with backend and sync user to database
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to verify authentication')
      }

      const result = await response.json()
      const dbUser = result.user

      // Check if user is a rider/courier
      if (dbUser.role !== 'RIDER') {
        throw new Error('This account is not registered as a courier')
      }

      if (dbUser.status === 'REJECTED') {
        throw new Error('Your courier account has been rejected. Please contact support.')
      }

      // Redirect all riders to dashboard regardless of status
      router.push('/rider/dashboard')
    } catch (err: any) {
      console.error('Auth error:', err)
      setError(err.message || 'An error occurred during login')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <Link href="/" className="rounded-full bg-primary/10 p-3 hover:bg-primary/20 transition-colors">
                <Bike className="w-8 h-8 text-primary" />
              </Link>
            </div>
            <CardTitle className="text-2xl font-bold">Rider Login</CardTitle>
            <CardDescription>
              Sign in to access your {APP_NAME} rider dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="your.email@example.com"
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Enter your password"
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center justify-between text-sm">
                  <Link
                    href="/rider/register"
                    className="text-primary hover:underline"
                  >
                    Don't have an account? Register
                  </Link>
                  <Link
                    href="#"
                    className="text-muted-foreground hover:text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to home
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
