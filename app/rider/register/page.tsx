'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { ArrowRight, ArrowLeft, CheckCircle2, Bike, Mail, Lock, User as UserIcon } from 'lucide-react'
import { APP_NAME } from '@/lib/constants'
import { auth } from '@/lib/firebase.client'
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/lib/auth-context'

const formSchema = z.object({
  // Step 2: Personal Details
  fullName: z.string().min(1, 'Full name is required'),
  phoneNumber: z.string().regex(/^(\+233|0)[0-9]{9}$/, 'Please enter a valid Ghana phone number'),
  email: z.string().email('Please enter a valid email address'),
  
  // Step 3: Ghana Card Details
  cardName: z.string().min(1, 'Name on card is required'),
  cardNumber: z.string().min(1, 'Ghana Card number is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  
  // Step 4: Motorcycle License
  licenseNumber: z.string().min(1, 'License number is required'),
  licenseExpiration: z.string().min(1, 'Expiration date is required'),
  licenseImage: z.any().refine((file) => file !== null && file !== undefined, 'License image is required'),
  
  // Step 5: Device Verification
  hasSmartphone: z.boolean().refine((val) => val === true, 'You must have a smartphone'),
  hasGhanaNumber: z.boolean().refine((val) => val === true, 'You must have a Ghana phone number'),
  
  // Step 6: Profile Photo
  profilePhoto: z.any().refine((file) => file !== null && file !== undefined, 'Profile photo is required'),
})

type FormData = z.infer<typeof formSchema>

const TOTAL_STEPS = 6

export default function RiderRegistrationPage() {
  const router = useRouter()
  const { user, loading, getIdToken } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [licenseImagePreview, setLicenseImagePreview] = useState<string | null>(null)
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null)
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
      fullName: '',
      phoneNumber: '',
      email: '',
      cardName: '',
      cardNumber: '',
      dateOfBirth: '',
      licenseNumber: '',
      licenseExpiration: '',
      licenseImage: null,
      hasSmartphone: false,
      hasGhanaNumber: false,
      profilePhoto: null,
    },
    mode: 'onChange',
  })

  // Redirect if already logged in and verified as rider
  useEffect(() => {
    const checkAndRedirect = async () => {
      if (loading || !user) return

      try {
        const token = await getIdToken()
        if (!token) return

        const response = await fetch('/api/auth/user', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          if (data.user?.role === 'RIDER') {
            // User is already a rider, redirect to dashboard
            router.push('/rider/dashboard')
            return
          }
        }
      } catch (error) {
        // Silently fail - user will stay on registration page
        console.error('Error checking user role:', error)
      }
    }

    checkAndRedirect()
  }, [user, loading, router, getIdToken])

  const progress = (currentStep / TOTAL_STEPS) * 100

  const handleLicenseImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      form.setValue('licenseImage', file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLicenseImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      form.setValue('profilePhoto', file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfilePhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

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
      // Check if this email is already registered as a rider
      const checkResponse = await fetch('/api/courier/check-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: accountEmail }),
      })

      if (checkResponse.ok) {
        const data = await checkResponse.json()
        if (data.exists || data.hasAccount) {
          setAuthError('This email already has a courier account. Please log in instead.')
          setAuthLoading(false)
          setTimeout(() => {
            router.push('/rider/login')
          }, 2000)
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
      // Pre-fill email/name in form
      form.setValue('email', accountEmail)
      form.setValue('fullName', accountName)

      setCurrentStep(2)
    } catch (error: any) {
      console.error('Error creating account:', error)
      // Handle Firebase auth errors
      if (error.code === 'auth/email-already-in-use') {
        // Email already exists in Firebase - check if they have a rider account
        const checkResponse = await fetch('/api/courier/check-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: accountEmail }),
        })
        
        if (checkResponse.ok) {
          const data = await checkResponse.json()
          if (data.exists || data.hasAccount) {
            setAuthError('This email already has a courier account. Please log in instead.')
            setTimeout(() => {
              router.push('/rider/login')
            }, 2000)
            return
          } else {
            // Email exists in Firebase but no rider account - try to sign them in and continue registration
            try {
              const signInCredential = await signInWithEmailAndPassword(auth, accountEmail, password)
              
              // Update display name if needed
              if (signInCredential.user.displayName !== accountName) {
                await updateProfile(signInCredential.user, {
                  displayName: accountName,
                })
              }

              const token = await signInCredential.user.getIdToken()
              setIdToken(token)
              // Pre-fill email/name in form
              form.setValue('email', accountEmail)
              form.setValue('fullName', accountName)

              setCurrentStep(2)
              setAuthLoading(false)
              return
            } catch (signInError: any) {
              // Sign in failed - wrong password or other error
              if (signInError.code === 'auth/wrong-password' || signInError.code === 'auth/invalid-credential') {
                setAuthError('Incorrect password. Please use the correct password for this email or reset it.')
              } else {
                setAuthError('Unable to sign in. Please try logging in from the login page.')
              }
              setAuthLoading(false)
              return
            }
          }
        }
      }
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

      // Check if this email is already registered as a rider
      const checkResponse = await fetch('/api/courier/check-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      if (checkResponse.ok) {
        const data = await checkResponse.json()
        if (data.exists || data.hasAccount) {
          setAuthError('This email already has a courier account. Please log in instead.')
          setAuthLoading(false)
          setTimeout(() => {
            router.push('/rider/login')
          }, 2000)
          return
        }
      }

      setAccountEmail(email)
      setAccountName(name)

      form.setValue('email', email)
      form.setValue('fullName', name)

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
      isValid = await form.trigger(['fullName', 'phoneNumber', 'email'])
    } else if (currentStep === 3) {
      isValid = await form.trigger(['cardName', 'cardNumber', 'dateOfBirth'])
    } else if (currentStep === 4) {
      isValid = await form.trigger(['licenseNumber', 'licenseExpiration', 'licenseImage'])
    } else if (currentStep === 5) {
      isValid = await form.trigger(['hasSmartphone', 'hasGhanaNumber'])
      if (!isValid) {
        // Show validation errors
        const errors = form.formState.errors
        if (!form.getValues('hasSmartphone')) {
          form.setError('hasSmartphone', { message: 'You must have a smartphone' })
        }
        if (!form.getValues('hasGhanaNumber')) {
          form.setError('hasGhanaNumber', { message: 'You must have a Ghana phone number' })
        }
      }
    } else if (currentStep === 6) {
      isValid = await form.trigger(['profilePhoto'])
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
      // Upload files first
      let licenseImageFileId: string | undefined
      let profilePhotoFileId: string | undefined

      // Upload license image
      if (formData.licenseImage) {
        const licenseFormData = new FormData()
        licenseFormData.append('file', formData.licenseImage)
        
        const licenseUploadResponse = await fetch('/api/files/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${idToken}`,
          },
          body: licenseFormData,
        })

        if (!licenseUploadResponse.ok) {
          throw new Error('Failed to upload license image')
        }

        const licenseUploadData = await licenseUploadResponse.json()
        // Use UUID (or id) from the upload response
        licenseImageFileId = licenseUploadData.file?.uuid || licenseUploadData.file?.id
      }

      // Upload profile photo
      if (formData.profilePhoto) {
        const profileFormData = new FormData()
        profileFormData.append('file', formData.profilePhoto)
        
        const profileUploadResponse = await fetch('/api/files/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${idToken}`,
          },
          body: profileFormData,
        })

        if (!profileUploadResponse.ok) {
          throw new Error('Failed to upload profile photo')
        }

        const profileUploadData = await profileUploadResponse.json()
        // Use UUID (or id) from the upload response
        profilePhotoFileId = profileUploadData.file?.uuid || profileUploadData.file?.id
      }

      // Register rider with all data including file IDs
      const response = await fetch('/api/auth/register/rider', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken,
          name: formData.fullName,
          phone: formData.phoneNumber,
          email: formData.email,
          // Ghana Card Information
          ghanaCardName: formData.cardName,
          ghanaCardNumber: formData.cardNumber,
          dateOfBirth: formData.dateOfBirth,
          // Motorcycle License Information
          licenseNumber: formData.licenseNumber,
          licenseExpiration: formData.licenseExpiration,
          // Device Verification
          hasSmartphone: formData.hasSmartphone,
          hasGhanaNumber: formData.hasGhanaNumber,
          // File IDs
          licenseImageFileId,
          profilePhotoFileId,
        }),
      })

      const data = await response.json().catch(() => ({}))

      // If user already exists (409 Conflict), redirect to login
      if (response.status === 409 && data.redirectToLogin) {
        setAuthError('This email already has a courier account. Redirecting to login...')
        setTimeout(() => {
          router.push('/rider/login')
        }, 2000)
        return
      }

      if (!response.ok) {
        const errorMessage = data.error || 'Failed to submit registration'
        // Check if error is about existing account
        if (errorMessage.includes('already has a courier account') || errorMessage.includes('already exists')) {
          setAuthError('This email already has a courier account. Redirecting to login...')
          setTimeout(() => {
            router.push('/rider/login')
          }, 2000)
          return
        }
        throw new Error(errorMessage)
      }

      setIsComplete(true)
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/rider/dashboard')
      }, 2000)
    } catch (error: any) {
      console.error('Rider registration error:', error)
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
            <CardTitle className="text-2xl">Application Submitted!</CardTitle>
            <CardDescription className="mt-2">
              Thank you for your interest in becoming a courier with {APP_NAME}. Your application is now pending approval.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm text-muted-foreground">
              <p><strong>What happens next?</strong></p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Our team will review your application within 2-3 business days</li>
                <li>We'll verify your Ghana Card and motorcycle license</li>
                <li>You'll receive an email with next steps and onboarding details</li>
                <li>Once approved, you'll be invited to attend a brief onboarding session</li>
              </ol>
            </div>
            <div className="pt-4">
              <p className="text-sm text-muted-foreground mb-2">Redirecting to dashboard...</p>
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
              <Bike className="w-6 h-6 text-primary" />
              <CardTitle className="text-2xl">
                {currentStep === 1 && 'Create Your Courier Account'}
                {currentStep === 2 && 'Personal Details'}
                {currentStep === 3 && 'Ghana Card Information'}
                {currentStep === 4 && 'Motorcycle License'}
                {currentStep === 5 && 'Device Verification'}
                {currentStep === 6 && 'Profile Photo'}
              </CardTitle>
            </div>
            <CardDescription>
              {currentStep === 1 && 'First, create your login using email/password or Google.'}
              {currentStep === 2 && 'Please provide your basic personal information'}
              {currentStep === 3 && 'Enter your Ghana Card details for verification'}
              {currentStep === 4 && 'Upload your motorcycle license information'}
              {currentStep === 5 && 'Confirm your device and phone number'}
              {currentStep === 6 && 'Upload a clear profile photo'}
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
                  {/* Step 2: Personal Details */}
                  {currentStep === 2 && (
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your full name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phoneNumber"
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

                  {/* Step 3: Ghana Card Details */}
                  {currentStep === 3 && (
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="cardName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name on Ghana Card</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter name as it appears on your Ghana Card" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="cardNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ghana Card Number</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your Ghana Card number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="dateOfBirth"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date of Birth</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {/* Step 4: Motorcycle License */}
                  {currentStep === 4 && (
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="licenseNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Motorcycle License Number</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your motorcycle license number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="licenseExpiration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>License Expiration Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="licenseImage"
                        render={() => (
                          <FormItem>
                            <FormLabel>Upload License Image</FormLabel>
                            <FormControl>
                              <div className="space-y-2">
                                <Input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleLicenseImageChange}
                                  className="cursor-pointer"
                                />
                                {licenseImagePreview && (
                                  <div className="mt-2">
                                    <img
                                      src={licenseImagePreview}
                                      alt="License preview"
                                      className="max-w-full h-48 object-contain border rounded-md"
                                    />
                                  </div>
                                )}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {/* Step 5: Device Verification */}
                  {currentStep === 5 && (
                    <div className="space-y-4">
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="hasSmartphone"
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex items-center space-x-2">
                                <FormControl>
                                  <input
                                    type="checkbox"
                                    checked={field.value}
                                    onChange={(e) => field.onChange(e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-300"
                                  />
                                </FormControl>
                                <FormLabel className="!mt-0 cursor-pointer">
                                  I have a smartphone that I can use for deliveries
                                </FormLabel>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="hasGhanaNumber"
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex items-center space-x-2">
                                <FormControl>
                                  <input
                                    type="checkbox"
                                    checked={field.value}
                                    onChange={(e) => field.onChange(e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-300"
                                  />
                                </FormControl>
                                <FormLabel className="!mt-0 cursor-pointer">
                                  I have an active Ghana phone number
                                </FormLabel>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}

                  {/* Step 6: Profile Photo */}
                  {currentStep === 6 && (
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="profilePhoto"
                        render={() => (
                          <FormItem>
                            <FormLabel>Upload Profile Photo</FormLabel>
                            <FormControl>
                              <div className="space-y-2">
                                <Input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleProfilePhotoChange}
                                  className="cursor-pointer"
                                />
                                {profilePhotoPreview && (
                                  <div className="mt-2">
                                    <img
                                      src={profilePhotoPreview}
                                      alt="Profile preview"
                                      className="w-32 h-32 object-cover border rounded-full"
                                    />
                                  </div>
                                )}
                              </div>
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
                      {currentStep === TOTAL_STEPS ? 'Submit Application' : 'Next'}
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
