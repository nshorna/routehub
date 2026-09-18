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
import { Store, ArrowLeft, Check } from 'lucide-react'
import { APP_NAME } from '@/lib/constants'
import Link from 'next/link'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase.client'
import { useAuth } from '@/lib/auth-context'
import { Badge } from '@/components/ui/badge'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

interface SellerAccount {
  id: string;
  role: string;
  seller: {
    id: string;
    businessName: string;
    contactName: string;
    status: string;
  };
}

export default function SellerLoginPage() {
  const router = useRouter()
  const { user, loading, getIdToken } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sellerAccounts, setSellerAccounts] = useState<SellerAccount[]>([])
  const [showAccountSelection, setShowAccountSelection] = useState(false)
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)

  // Redirect if already logged in and verified as seller
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
          const accounts = data.user?.sellerAccounts || [];
          
          if (accounts.length > 0) {
            // Check if user has a selected account in localStorage
            const savedAccountId = localStorage.getItem('selectedSellerAccountId');
            const accountToUse = savedAccountId 
              ? accounts.find((acc: SellerAccount) => acc.seller.id === savedAccountId)
              : accounts[0];

            if (accountToUse) {
              const status = accountToUse.seller.status;
              if (status === 'PENDING_VERIFICATION' || status === 'PENDING_INFORMATION_UPDATE') {
                router.push('/seller/pending');
              } else if (status === 'VERIFIED' || status === 'ACTIVE') {
                router.push('/seller/orders');
              }
              // If status is REJECTED, SUSPENDED, or INACTIVE, stay on login page
            }
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
      const accounts: SellerAccount[] = dbUser.sellerAccounts || []

      // Check if user has any seller accounts
      if (!accounts || accounts.length === 0) {
        throw new Error('This account is not registered as a seller')
      }

      // If user has multiple accounts, show selection
      if (accounts.length > 1) {
        setSellerAccounts(accounts)
        setShowAccountSelection(true)
        setIsSubmitting(false)
        return
      }

      // Single account - proceed directly
      const account = accounts[0]
      localStorage.setItem('selectedSellerAccountId', account.seller.id)
      handleAccountSelection(account)
    } catch (err: any) {
      console.error('Auth error:', err)
      setError(err.message || 'An error occurred during login')
      setIsSubmitting(false)
    }
  }

  const handleAccountSelection = (account: SellerAccount) => {
    localStorage.setItem('selectedSellerAccountId', account.seller.id)
    const status = account.seller.status

    if (status === 'PENDING_VERIFICATION' || status === 'PENDING_INFORMATION_UPDATE') {
      router.push('/seller/pending')
    } else if (status === 'REJECTED' || status === 'SUSPENDED') {
      setError(`Your seller account "${account.seller.businessName}" has been ${status.toLowerCase()}. Please contact support.`)
      setShowAccountSelection(false)
    } else if (status === 'VERIFIED' || status === 'ACTIVE') {
      router.push('/seller/orders')
    } else {
      setError('Your seller account is pending approval')
      setShowAccountSelection(false)
    }
  }

  const handleAccountSelect = (account: SellerAccount) => {
    setSelectedAccountId(account.seller.id)
  }

  const handleConfirmSelection = () => {
    const selectedAccount = sellerAccounts.find(acc => acc.seller.id === selectedAccountId)
    if (selectedAccount) {
      handleAccountSelection(selectedAccount)
    } else {
      setError('Please select a seller account')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-12">

      
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <Link href="/" className="rounded-full bg-primary/10 p-3 hover:bg-primary/20 transition-colors">
                <Store className="w-8 h-8 text-primary" />
              </Link>
            </div>
            <CardTitle className="text-2xl font-bold">Seller Login</CardTitle>
            <CardDescription>
              Sign in to access your {APP_NAME} seller dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            {showAccountSelection ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Select Seller Account</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    You have multiple seller accounts. Please select the one you want to use.
                  </p>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  {sellerAccounts.map((account) => {
                    const isSelected = selectedAccountId === account.seller.id
                    const status = account.seller.status
                    const isActive = status === 'VERIFIED' || status === 'ACTIVE'
                    const isPending = status === 'PENDING_VERIFICATION' || status === 'PENDING_INFORMATION_UPDATE'
                    const isDisabled = status === 'REJECTED' || status === 'SUSPENDED' || status === 'INACTIVE'

                    return (
                      <button
                        key={account.seller.id}
                        type="button"
                        onClick={() => !isDisabled && handleAccountSelect(account)}
                        disabled={isDisabled}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : isDisabled
                            ? 'border-muted bg-muted/30 opacity-50 cursor-not-allowed'
                            : 'border-border hover:border-primary/50 hover:bg-muted/50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold">{account.seller.businessName}</h4>
                              {isSelected && <Check className="w-4 h-4 text-primary" />}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {account.seller.contactName}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge
                                variant={
                                  isActive
                                    ? 'default'
                                    : isPending
                                    ? 'secondary'
                                    : 'destructive'
                                }
                                className="text-xs"
                              >
                                {status.replace(/_/g, ' ')}
                              </Badge>
                              {account.role === 'OWNER' && (
                                <Badge variant="outline" className="text-xs">
                                  Owner
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowAccountSelection(false)
                      setSellerAccounts([])
                      setSelectedAccountId(null)
                      setError(null)
                    }}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    className="flex-1"
                    onClick={handleConfirmSelection}
                    disabled={!selectedAccountId}
                  >
                    Continue
                  </Button>
                </div>
              </div>
            ) : (
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
                      href="/seller/register"
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
            )}

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
