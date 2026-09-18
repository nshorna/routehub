'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Plus, Trash2, Home, Star } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { SellerNav } from './seller-nav'
import { GoogleMap } from '@/components/shared/google-map'

interface Address {
  id: string
  name: string
  description: string | null
  latitude: number
  longitude: number
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export function SellerAddressesList() {
  const router = useRouter()
  const { user, loading: authLoading, getIdToken, signOut } = useAuth()
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

      const response = await fetch('/api/seller/addresses', {
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

  const handleSetDefault = async (addressId: string) => {
    try {
      const idToken = await getIdToken()
      if (!idToken) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(`/api/seller/addresses/${addressId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to set default address')
      }

      toast({
        title: 'Success',
        description: 'Default address updated successfully',
      })

      // Reload addresses
      await loadAddresses()
    } catch (error) {
      console.error('Error setting default address:', error)
      toast({
        title: 'Error',
        description: 'Failed to set default address',
        variant: 'destructive',
      })
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

      const response = await fetch(`/api/seller/addresses/${addressId}`, {
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

  const handleLogout = async () => {
    try {
      localStorage.removeItem('selectedSellerAccountId')
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Failed to log out:', error)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex flex-col md:flex-row h-screen bg-background">
        <SellerNav onLogout={handleLogout} />
        <main className="flex-1 overflow-auto p-4 md:p-6 mt-16 md:mt-0 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="w-12 h-12 mx-auto mb-4 animate-pulse text-muted-foreground" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-background">
      <SellerNav onLogout={handleLogout} />
      <main className="flex-1 overflow-auto p-4 md:p-6 mt-16 md:mt-0">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Pickup Addresses</h1>
              <p className="text-sm md:text-base text-muted-foreground">
                Manage your pickup locations
              </p>
            </div>
            <Button 
              onClick={() => router.push('/seller/addresses/new')}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Add Address</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>

          {addresses.length === 0 ? (
            <Card className="bg-card">
              <CardContent className="p-12 text-center">
                <Home className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">No Addresses Yet</h2>
                <p className="text-muted-foreground mb-6">
                  Add your first pickup address to get started
                </p>
                <Button onClick={() => router.push('/seller/addresses/new')}>
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
                        <MapPin className="w-5 h-5 text-primary" />
                        {address.name}
                        {address.isDefault && (
                          <span className="flex items-center gap-1 text-xs font-normal text-primary bg-primary/10 px-2 py-1 rounded-full">
                            <Star className="w-3 h-3 fill-primary" />
                            Default
                          </span>
                        )}
                      </CardTitle>
                      <div className="flex items-center gap-1">
                        {!address.isDefault && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSetDefault(address.id)}
                            className="text-primary hover:text-primary"
                            title="Set as default"
                          >
                            <Star className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAddress(address.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
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
        </div>
      </main>
    </div>
  )
}
