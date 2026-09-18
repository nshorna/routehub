'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Package, MapPin, Zap, Clock, CheckCircle2, AlertCircle, ArrowRight, LogOut, Home } from 'lucide-react'
import { APP_NAME } from '@/lib/constants'
import type { Delivery } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-context'
import { NotificationEnableButton } from '@/components/shared/notification-enable-button'

export default function CustomerHome() {
  const router = useRouter()
  const { user, loading: authLoading, signOut, getIdToken } = useAuth()
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [loading, setLoading] = useState(true)
  const [dbUser, setDbUser] = useState<any>(null)

  useEffect(() => {
    const loadUserData = async () => {
      if (authLoading || !user) {
        // AuthGuard in layout will handle redirect if not authenticated
        setLoading(false)
        return
      }

      try {
        const idToken = await getIdToken()
        if (!idToken) {
          setLoading(false)
          return
        }

        // Get user data from backend
        const response = await fetch('/api/auth/user', {
          headers: {
            'Authorization': `Bearer ${idToken}`,
          },
        })

        if (!response.ok) {
          setLoading(false)
          return
        }

        const data = await response.json()
        setDbUser(data.user)

        // Load deliveries by phone or email
        if (data.user.phone) {
          loadDeliveries(data.user.phone)
        } else if (data.user.email) {
          // Fallback to email if no phone
          // You might want to create a getDeliveriesByEmail function
          setLoading(false)
        } else {
          setLoading(false)
        }
      } catch (error) {
        console.error('Error loading user data:', error)
        setLoading(false)
      }
    }

    loadUserData()
  }, [user, authLoading, getIdToken])

  const loadDeliveries = async (phoneNumber: string) => {
    try {
      setLoading(true)
      const encodedPhone = encodeURIComponent(phoneNumber)
      const response = await fetch(`/api/deliveries/phone/${encodedPhone}`)
      if (!response.ok) {
        console.error('Failed to fetch deliveries')
        return
      }
      const deliveriesData = await response.json()
      setDeliveries(deliveriesData)
    } catch (error) {
      console.error('Error loading deliveries:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const getStatusColor = (status: string) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      "picked-up": "bg-blue-100 text-blue-800 border-blue-200",
      "in-transit": "bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]",
      delivered: "bg-green-100 text-green-800 border-green-200",
      cancelled: "bg-[var(--destructive)]/10 text-[var(--destructive)] border-[var(--destructive)]",
    }
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800 border-gray-200"
  }

  const getStatusIcon = (status: string) => {
    if (status === 'delivered') return <CheckCircle2 className="w-4 h-4" />
    if (status === 'cancelled') return <AlertCircle className="w-4 h-4" />
    return <Clock className="w-4 h-4" />
  }

  const formatStatus = (status: string) => {
    return status
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[var(--primary)] via-[var(--primary)]/80 to-background flex items-center justify-center">
        <div className="text-center text-white">
          <Package className="w-12 h-12 mx-auto mb-4 animate-pulse" />
          <p>Loading your deliveries...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--primary)] via-[var(--primary)]/80 to-background flex flex-col">
      {/* Header */}
      <header className="bg-[var(--primary)] text-white py-6 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">{APP_NAME}</h1>
            <p className="text-green-50 mt-2">Your delivery history</p>
            {dbUser && (
              <div className="text-green-100 text-sm mt-1">
                {dbUser.email && <p>Email: {dbUser.email}</p>}
                {dbUser.phone && <p>Phone: {dbUser.phone}</p>}
              </div>
            )}
          </div>
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="bg-white/10 text-white border-white/20 hover:bg-white/20"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-12">
        {deliveries.length === 0 ? (
          <div className="text-center">
            <Package className="w-16 h-16 text-white/50 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">No Deliveries Found</h2>
            <p className="text-green-50 mb-6">
              We couldn't find any deliveries for this phone number.
            </p>
            <p className="text-green-50 mb-4">
              You don't have any deliveries yet. When you place an order, it will appear here.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Your Deliveries</h2>
              <p className="text-green-50">
                {deliveries.length} {deliveries.length === 1 ? 'delivery' : 'deliveries'} found
              </p>
            </div>

            <div className="space-y-4">
              {deliveries.map((delivery) => (
                <Card
                  key={delivery.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => router.push(`/customer/track/${delivery.orderId}`)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`px-3 py-1 rounded-full border text-xs font-semibold flex items-center gap-1 ${getStatusColor(delivery.status)}`}>
                            {getStatusIcon(delivery.status)}
                            {formatStatus(delivery.status)}
                          </div>
                          <span className="text-sm font-mono text-muted-foreground">
                            {delivery.orderId}
                          </span>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-[var(--primary)] mt-1 flex-shrink-0" />
                            <div>
                              <p className="text-xs text-muted-foreground">Drop-off</p>
                              <p className="text-sm font-medium">{delivery.dropoffAddress}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between pt-2">
                            <div>
                              <p className="text-xs text-muted-foreground">Delivery Fee</p>
                              <p className="text-lg font-bold text-[var(--primary)]">
                                ${delivery.fee.toFixed(2)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Date</p>
                              <p className="text-sm font-medium">
                                {delivery.createdAt.toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <ArrowRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Notifications Section */}
        <div className="bg-card rounded-lg border border-border p-6 mt-8">
          <h2 className="text-xl font-semibold text-foreground mb-2">Push Notifications</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Enable push notifications to receive real-time updates about your delivery status.
          </p>
          <NotificationEnableButton />
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow bg-card"
              onClick={() => router.push('/customer/addresses')}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="bg-[var(--primary)]/10 p-3 rounded-lg">
                    <Home className="w-6 h-6 text-[var(--primary)]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Manage Addresses</h3>
                    <p className="text-sm text-muted-foreground">Add, edit, or delete your delivery addresses</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="bg-card rounded-lg border border-border p-6 text-center">
            <MapPin className="w-10 h-10 text-[var(--primary)] mx-auto mb-4" />
            <h3 className="font-semibold text-foreground mb-2">Live Location</h3>
            <p className="text-sm text-muted-foreground">See your rider's location in real-time</p>
          </div>

          <div className="bg-card rounded-lg border border-border p-6 text-center">
            <Package className="w-10 h-10 text-[var(--primary)] mx-auto mb-4" />
            <h3 className="font-semibold text-foreground mb-2">Status Updates</h3>
            <p className="text-sm text-muted-foreground">Get instant notifications on delivery progress</p>
          </div>

          <div className="bg-card rounded-lg border border-border p-6 text-center">
            <Zap className="w-10 h-10 text-[var(--primary)] mx-auto mb-4" />
            <h3 className="font-semibold text-foreground mb-2">Contact Support</h3>
            <p className="text-sm text-muted-foreground">Reach out to rider or seller instantly</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-background border-t border-border py-6 px-4 text-center text-muted-foreground">
        <p>© 2025 {APP_NAME} Platform.</p>
      </footer>
    </div>
  )
}
