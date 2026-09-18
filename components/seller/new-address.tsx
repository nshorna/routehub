'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Navigation } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { SellerNav } from './seller-nav'
import { GoogleMap, GoogleMapRef } from '@/components/shared/google-map'

export function NewSellerAddress() {
  const router = useRouter()
  const { user, loading: authLoading, getIdToken, signOut } = useAuth()
  const { toast } = useToast()
  const [newAddressName, setNewAddressName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedCoordinates, setSelectedCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [isMapReady, setIsMapReady] = useState(false)
  
  const mapRef = useRef<GoogleMapRef>(null)

  // Get current location and pan map
  const handleGetCurrentLocation = async () => {
    if (!mapRef.current) {
      toast({
        title: 'Error',
        description: 'Map is not ready yet',
        variant: 'destructive',
      })
      return
    }

    setIsGettingLocation(true)
    try {
      const coords = await mapRef.current.getCurrentLocation()
      mapRef.current.panTo(coords)
      mapRef.current.setZoom(15)
      mapRef.current.setMarkerPosition(coords)
      setSelectedCoordinates(coords)
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to get your location',
        variant: 'destructive',
      })
    } finally {
      setIsGettingLocation(false)
    }
  }

  const handleCreateAddress = async () => {
    if (!newAddressName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an address name',
        variant: 'destructive',
      })
      return
    }

    if (!selectedCoordinates) {
      toast({
        title: 'Error',
        description: 'Please select a location on the map',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsCreating(true)
      const idToken = await getIdToken()
      if (!idToken) {
        throw new Error('Not authenticated')
      }

      const response = await fetch('/api/seller/addresses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newAddressName.trim(),
          description: description.trim() || null,
          latitude: selectedCoordinates.lat,
          longitude: selectedCoordinates.lng,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create address')
      }

      toast({
        title: 'Success',
        description: 'Pickup address added successfully',
      })

      // Navigate back to addresses list
      router.push('/seller/addresses')
    } catch (error) {
      console.error('Error creating address:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create address',
        variant: 'destructive',
      })
    } finally {
      setIsCreating(false)
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

  if (authLoading) {
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
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Add New Pickup Address</h1>
          <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-6">
            Select a location for your pickup address
          </p>

          <Card className="bg-card">
            <CardHeader>
              <CardTitle>Address Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Select Location on Map</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Click on the map to place a pin on your pickup location. You can drag the pin to adjust.
                </p>
                <div className="w-full h-[400px] rounded-lg overflow-hidden border">
                  <GoogleMap
                    ref={mapRef}
                    height="400px"
                    allowClickToSelect={true}
                    draggableMarker={true}
                    showControls={true}
                    onCoordinatesSelect={(coords) => setSelectedCoordinates(coords)}
                    onMapReady={() => setIsMapReady(true)}
                    className="rounded-lg"
                  />
                </div>
                {isMapReady && (
                  <Button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    disabled={isGettingLocation}
                    className="mt-3 w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg px-4 py-2 h-auto font-semibold"
                    title="Move map to your current location"
                  >
                    <Navigation className={`w-4 h-4 mr-2 ${isGettingLocation ? 'animate-spin' : ''}`} />
                    {isGettingLocation ? 'Finding Location...' : 'Use My Location'}
                  </Button>
                )}
                {selectedCoordinates && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Selected: {selectedCoordinates.lat.toFixed(6)}, {selectedCoordinates.lng.toFixed(6)}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="address-name">Address Name</Label>
                <Input
                  id="address-name"
                  placeholder="e.g., Main Store, Warehouse, Branch 1"
                  value={newAddressName}
                  onChange={(e) => setNewAddressName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="address-description">Description (Optional)</Label>
                <Textarea
                  id="address-description"
                  placeholder="e.g., 3rd floor, near the blue gate, behind the supermarket..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Add landmarks, floor number, directions, or any helpful details for pickup
                </p>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => router.push('/seller/addresses')}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateAddress}
                  disabled={isCreating || !newAddressName.trim() || !selectedCoordinates}
                >
                  {isCreating ? 'Creating...' : 'Add Address'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
