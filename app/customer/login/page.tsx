'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Package, ArrowLeft } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';
import Link from 'next/link';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { OtpInput } from '@/components/customer/otp-input';
import { signInWithPhoneNumber, RecaptchaVerifier, ConfirmationResult } from 'firebase/auth';
import { auth } from '@/lib/firebase.client';
import { useAuth } from '@/lib/auth-context';

const phoneSchema = z.object({
  phone: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Please enter a valid phone number with country code (e.g., +1234567890)'),
});

type PhoneFormData = z.infer<typeof phoneSchema>;

export default function CustomerLoginPage() {
  const router = useRouter();
  const { user, loading, getIdToken } = useAuth();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [otp, setOtp] = useState('');
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const recaptchaInitializedRef = useRef<boolean>(false);

  // Redirect if already logged in and verified as customer
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
          if (data.user?.role === 'CUSTOMER') {
            router.push('/customer');
          }
        }
      } catch (error) {
        // Silently fail - user will stay on login page
        console.error('Error checking user role:', error);
      }
    };

    checkAndRedirect();
  }, [user, loading, router, getIdToken]);

  // Cleanup reCAPTCHA on unmount
  useEffect(() => {
    return () => {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaInitializedRef.current = false;
      }
      // Remove container from DOM
      const container = document.getElementById('recaptcha-invisible-container');
      if (container) {
        container.remove();
      }
    };
  }, []);

  const phoneForm = useForm<PhoneFormData>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      phone: '',
    },
    mode: 'onChange',
  });


  const onPhoneSubmit = async (data: PhoneFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Clean up previous verifier if exists
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaInitializedRef.current = false;
      }

      // Remove existing container if it exists (to avoid "already rendered" error)
      const existingContainer = document.getElementById('recaptcha-invisible-container');
      if (existingContainer) {
        existingContainer.remove();
      }

      // Create a fresh hidden container for invisible reCAPTCHA (required by Firebase)
      const container = document.createElement('div');
      container.id = 'recaptcha-invisible-container';
      container.style.display = 'none';
      document.body.appendChild(container);

      // Initialize invisible reCAPTCHA (no visible widget shown to user)
      recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-invisible-container', {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA verified automatically - no user interaction needed
        },
        'expired-callback': () => {
          recaptchaInitializedRef.current = false;
          setError('Verification expired. Please try again.');
        },
      });

      // Render invisible reCAPTCHA (happens automatically in background)
      await recaptchaVerifierRef.current.render();
      recaptchaInitializedRef.current = true;

      const confirmation = await signInWithPhoneNumber(
        auth,
        data.phone,
        recaptchaVerifierRef.current
      );

      setConfirmationResult(confirmation);
      setStep('otp');
    } catch (err: any) {
      console.error('Phone auth error:', err);
      setError(err.message || 'Failed to send verification code');
      
      // Reset reCAPTCHA on error
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaInitializedRef.current = false;
      }
      // Remove container on error
      const container = document.getElementById('recaptcha-invisible-container');
      if (container) {
        container.remove();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const onOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      setError('OTP must be 6 digits');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (!confirmationResult) {
        throw new Error('No confirmation result found');
      }

      // Verify OTP code
      const userCredential = await confirmationResult.confirm(otp);
      
      // Get ID token
      const idToken = await userCredential.user.getIdToken();

      // Verify token with backend and sync user to database
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to verify authentication');
      }

      const result = await response.json();
      const dbUser = result.user;

      // Check if user is a customer
      if (dbUser.role !== 'CUSTOMER') {
        throw new Error('This account is not registered as a customer');
      }

      // Customers are auto-approved, so redirect to dashboard
      router.push('/customer');
    } catch (err: any) {
      console.error('OTP verification error:', err);
      setError(err.message || 'Invalid verification code');
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    const phoneValue = phoneForm.getValues('phone');
    if (!phoneValue) {
      setError('Please enter your phone number first');
      return;
    }

    await onPhoneSubmit({ phone: phoneValue });
  };

  const handleBackToPhone = () => {
    setStep('phone');
    setError(null);
    setOtp('');
    if (recaptchaVerifierRef.current) {
      recaptchaVerifierRef.current.clear();
      recaptchaInitializedRef.current = false;
    }
    // Remove container when going back
    const container = document.getElementById('recaptcha-invisible-container');
    if (container) {
      container.remove();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <Link href="/" className="rounded-full bg-primary/10 p-3 hover:bg-primary/20 transition-colors">
                <Package className="w-8 h-8 text-primary" />
              </Link>
            </div>
            <CardTitle className="text-2xl font-bold">Customer Login</CardTitle>
            <CardDescription>
              {step === 'phone'
                ? `Sign in with your phone number to track your deliveries on ${APP_NAME}`
                : 'Enter the verification code sent to your phone'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 'phone' ? (
              <Form {...phoneForm}>
                <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <FormField
                    control={phoneForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input
                            type="tel"
                            placeholder="+1234567890"
                            {...field}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                        <p className="text-xs text-muted-foreground mt-1">
                          Include country code (e.g., +1 for US)
                        </p>
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Sending code...' : 'Send Verification Code'}
                  </Button>
                </form>
              </Form>
            ) : (
              <form onSubmit={onOtpSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <label htmlFor="otp" className="text-sm font-medium">
                    Verification Code
                  </label>
                  <OtpInput
                    value={otp}
                    onChange={setOtp}
                    disabled={isSubmitting}
                    placeholder="Enter 6-digit code"
                  />
                  {otp.length > 0 && otp.length < 6 && (
                    <p className="text-xs text-muted-foreground">Enter 6 digits</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={handleBackToPhone}
                    disabled={isSubmitting}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={isSubmitting || otp.length !== 6}
                  >
                    {isSubmitting ? 'Verifying...' : 'Verify Code'}
                  </Button>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={handleResendCode}
                  disabled={isSubmitting}
                >
                  Resend Code
                </Button>
              </form>
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
  );
}
