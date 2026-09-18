'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Plus, Trash2, ArrowLeft, Home } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { GoogleMap } from '@/components/shared/google-map'

interface Address {
  id: string
  name: string
  description: string | null
  latitude: number
  longitude: number
  createdAt: string
  updatedAt: string
}


export default function AddressesPage() {
  const router = useRouter()
  const { user, loading: authLoading, getIdToken } = useAuth()
  const { toast } = useToast()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && user) {
      loadAddresses()
    }
  }, [user, authLoading])

  const loadAddresses = async () => {
    try {
      setLoading(true)
      const idToken = await getIdToken()
      if (!idToken) {
        setLoading(false)
        return
      }

      const response = await fetch('/api/customer/addresses', {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to load addresses')
      }

      const data = await response.json()
      setAddresses(data.addresses || [])
    } catch (error) {
      console.error('Error loading addresses:', error)
      toast({
        title: 'Error',
        description: 'Failed to load addresses',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm('Are you sure you want to delete this address?')) {
      return
    }

    try {
      const idToken = await getIdToken()
      if (!idToken) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(`/api/customer/addresses/${addressId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to delete address')
      }

      toast({
        title: 'Success',
        description: 'Address deleted successfully',
      })

      // Reload addresses
      await loadAddresses()
    } catch (error) {
      console.error('Error deleting address:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete address',
        variant: 'destructive',
      })
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[var(--primary)] via-[var(--primary)]/80 to-background flex items-center justify-center">
        <div className="text-center text-white">
          <MapPin className="w-12 h-12 mx-auto mb-4 animate-pulse" />
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--primary)] via-[var(--primary)]/80 to-background">
      {/* Header */}
      <header className="bg-[var(--primary)] text-white py-6 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.push('/customer')}
              variant="ghost"
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">My Addresses</h1>
              <p className="text-green-50 mt-1">Manage your delivery addresses</p>
            </div>
          </div>
          <Button 
            onClick={() => router.push('/customer/addresses/new')}
            className="bg-white text-[var(--primary)] hover:bg-green-50"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Address
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {addresses.length === 0 ? (
          <Card className="bg-card">
            <CardContent className="p-12 text-center">
              <Home className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">No Addresses Yet</h2>
              <p className="text-muted-foreground mb-6">
                Add your first address to get started with deliveries
              </p>
              <Button onClick={() => router.push('/customer/addresses/new')}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Address
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {addresses.map((address) => (
              <Card key={address.id} className="bg-card">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-[var(--primary)]" />
                      {address.name}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteAddress(address.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Map Preview */}
                    <div className="w-full h-32 rounded-lg overflow-hidden border">
                      <GoogleMap
                        key={`map-${address.id}`}
                        center={{ lat: address.latitude, lng: address.longitude }}
                        zoom={15}
                        height="128px"
                        interactive={false}
                        showControls={false}
                        markerPosition={{ lat: address.latitude, lng: address.longitude }}
                        markerTitle="Address location"
                        className="rounded-lg"
                      />
                    </div>
                    {address.description && (
                      <div className="pt-2 border-t">
                        <p className="text-sm text-foreground whitespace-pre-wrap">
                          {address.description}
                        </p>
                      </div>
                    )}
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Coordinates:</span>
                        <p className="font-mono text-xs">
                          {address.latitude.toFixed(6)}, {address.longitude.toFixed(6)}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Added:</span>
                        <p>{new Date(address.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
