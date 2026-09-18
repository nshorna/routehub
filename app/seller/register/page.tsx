'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { ArrowRight, ArrowLeft, CheckCircle2, Store, Mail, Lock, User as UserIcon } from 'lucide-react'
import { APP_NAME } from '@/lib/constants'
import { auth } from '@/lib/firebase.client'
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, updateProfile } from 'firebase/auth'
import { Alert, AlertDescription } from '@/components/ui/alert'

const formSchema = z.object({
  // Step 2: Business Information
  businessName: z.string().min(1, 'Business name is required'),
  contactName: z.string().min(1, 'Contact name is required'),
  pickupAddress: z.string().min(1, 'Pickup address is required'),
  
  // Step 3: Contact Details
  phone: z.string().regex(/^(\+233|0)[0-9]{9}$/, 'Please enter a valid Ghana phone number'),
  email: z.string().email('Please enter a valid email address'),
})

type FormData = z.infer<typeof formSchema>

const TOTAL_STEPS = 3

export default function SellerRegistrationPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [idToken, setIdToken] = useState<string | null>(null)
  const [accountEmail, setAccountEmail] = useState('')
  const [authError, setAuthError] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(false)
  const [accountName, setAccountName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      businessName: '',
      contactName: '',
      pickupAddress: '',
      phone: '',
      email: '',
    },
    mode: 'onChange',
  })

  const progress = (currentStep / TOTAL_STEPS) * 100

  const handleEmailAccountCreate = async () => {
    setAuthError(null)

    if (!accountName.trim()) {
      setAuthError('Please enter your full name')
      return
    }
    if (!accountEmail.trim()) {
      setAuthError('Please enter your email address')
      return
    }
    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters')
      return
    }
    if (password !== confirmPassword) {
      setAuthError('Passwords do not match')
      return
    }

    try {
      setAuthLoading(true)
      // Check if this email is already registered as a seller
      const checkResponse = await fetch('/api/seller/check-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: accountEmail }),
      })

      if (checkResponse.ok) {
        const data = await checkResponse.json()
        if (data.exists) {
          setAuthError('This email is already registered as a seller. Please log in instead.')
          setAuthLoading(false)
          return
        }
      }

      const credential = await createUserWithEmailAndPassword(auth, accountEmail, password)

      // Set display name
      await updateProfile(credential.user, {
        displayName: accountName,
      })

      const token = await credential.user.getIdToken()
      setIdToken(token)
      // Pre-fill email/contact name in seller form
      form.setValue('email', accountEmail)
      form.setValue('contactName', accountName)

      setCurrentStep(2)
    } catch (error: any) {
      console.error('Error creating account:', error)
      setAuthError(error.message || 'Failed to create account')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleGoogleAccountCreate = async () => {
    setAuthError(null)

    try {
      setAuthLoading(true)
      const provider = new GoogleAuthProvider()
      const credential = await signInWithPopup(auth, provider)

      const token = await credential.user.getIdToken()
      setIdToken(token)

      const email = credential.user.email || ''
      const name = credential.user.displayName || email.split('@')[0] || ''

      if (!email) {
        setAuthError('Your Google account does not have an email address associated.')
        setAuthLoading(false)
        return
      }

      // Check if this email is already registered as a seller
      const checkResponse = await fetch('/api/seller/check-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      if (checkResponse.ok) {
        const data = await checkResponse.json()
        if (data.exists) {
          setAuthError('This email is already registered as a seller. Please log in instead.')
          setAuthLoading(false)
          return
        }
      }

      setAccountEmail(email)
      setAccountName(name)

      form.setValue('email', email)
      form.setValue('contactName', name)

      setCurrentStep(2)
    } catch (error: any) {
      console.error('Error with Google sign-in:', error)
      setAuthError(error.message || 'Failed to sign in with Google')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleNext = async () => {
    // Step 1: ensure account created
    if (currentStep === 1) {
      if (!idToken) {
        setAuthError('Please create an account before continuing')
        return
      }
      setCurrentStep(2)
      return
    }

    let isValid = false

    if (currentStep === 2) {
      isValid = await form.trigger(['businessName', 'contactName', 'pickupAddress'])
    } else if (currentStep === 3) {
      isValid = await form.trigger(['phone', 'email'])
    }

    if (isValid && currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1)
    } else if (isValid && currentStep === TOTAL_STEPS) {
      await handleSubmit()
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    if (!idToken) {
      setAuthError('Missing authentication token. Please create your account again.')
      setCurrentStep(1)
      return
    }

    setIsSubmitting(true)
    const formData = form.getValues()

    try {
      const response = await fetch('/api/auth/register/seller', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken,
          name: formData.contactName,
          phone: formData.phone,
          email: formData.email, // Business email
          businessName: formData.businessName,
          contactName: formData.contactName,
          pickupAddress: formData.pickupAddress,
        }),
      })

      const data = await response.json().catch(() => ({}))

      // If user already exists (409 Conflict), redirect to login
      if (response.status === 409 && data.redirectToLogin) {
        setAuthError('This account already exists. Redirecting to login...')
        setTimeout(() => {
          router.push('/seller/login')
        }, 2000)
        return
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit registration')
      }

      setIsComplete(true)
      // Redirect to pending page after a short delay
      setTimeout(() => {
        router.push('/seller/pending')
      }, 2000)
    } catch (error: any) {
      console.error('Seller registration error:', error)
      setAuthError(error.message || 'An error occurred while submitting your registration')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Registration Submitted!</CardTitle>
            <CardDescription className="mt-2">
              Thank you for registering as a seller on {APP_NAME}. Your application is now pending approval.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm text-muted-foreground">
              <p><strong>What's next?</strong></p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Our team will review your application shortly</li>
                <li>Once approved, you will be able to access the seller dashboard</li>
                <li>You can track your status from the seller login area</li>
              </ol>
            </div>
            <div className="pt-4">
              <p className="text-sm text-muted-foreground mb-2">Redirecting to pending status page...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              Step {currentStep} of {TOTAL_STEPS}
            </span>
            <span className="text-sm font-medium text-muted-foreground">
              {Math.round(progress)}%
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Form Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <Store className="w-6 h-6 text-primary" />
              <CardTitle className="text-2xl">
                {currentStep === 1 && 'Create Your Seller Account'}
                {currentStep === 2 && 'Business Information'}
                {currentStep === 3 && 'Contact Details'}
              </CardTitle>
            </div>
            <CardDescription>
              {currentStep === 1 && 'First, create your login using email/password or Google.'}
              {currentStep === 2 && 'Tell us about your business.'}
              {currentStep === 3 && 'How can we reach you?'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {authError && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{authError}</AlertDescription>
              </Alert>
            )}

            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="grid gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                        <UserIcon className="w-4 h-4 text-muted-foreground" />
                        Full Name
                      </label>
                      <Input
                        placeholder="Your full name"
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        disabled={authLoading}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        Email Address
                      </label>
                      <Input
                        type="email"
                        placeholder="your.email@example.com"
                        value={accountEmail}
                        onChange={(e) => setAccountEmail(e.target.value)}
                        disabled={authLoading}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                          <Lock className="w-4 h-4 text-muted-foreground" />
                          Password
                        </label>
                        <Input
                          type="password"
                          placeholder="Create a password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          disabled={authLoading}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Confirm Password
                        </label>
                        <Input
                          type="password"
                          placeholder="Confirm password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          disabled={authLoading}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    type="button"
                    className="w-full"
                    onClick={handleEmailAccountCreate}
                    disabled={authLoading}
                  >
                    {authLoading ? 'Creating account...' : 'Create account with Email'}
                  </Button>
                  <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-xs text-muted-foreground uppercase">or</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleGoogleAccountCreate}
                    disabled={authLoading}
                  >
                    Continue with Google
                  </Button>
                </div>
              </div>
            )}

            {currentStep > 1 && (
              <Form {...form}>
                <form className="space-y-6">
                  {/* Step 2: Business Information */}
                  {currentStep === 2 && (
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="businessName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Business Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your business name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="contactName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Your full name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="pickupAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pickup Address</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your business pickup address" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {/* Step 3: Contact Details */}
                  {currentStep === 3 && (
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input placeholder="+233 XX XXX XXXX or 0XX XXX XXXX" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="your.email@example.com" {...field} disabled />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex justify-between pt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBack}
                      disabled={currentStep === 1}
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      type="button"
                      onClick={handleNext}
                      disabled={isSubmitting}
                    >
                      {currentStep === TOTAL_STEPS ? 'Submit Registration' : 'Next'}
                      {currentStep < TOTAL_STEPS && <ArrowRight className="w-4 h-4 ml-2" />}
                    </Button>
                  </div>
                </form>
              </Form>
            )}

            {currentStep === 1 && (
              <div className="flex justify-between pt-6">
                <div />
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={!idToken || authLoading}
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
