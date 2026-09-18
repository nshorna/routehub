'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, ArrowLeft, Navigation } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { GoogleMap, GoogleMapRef } from '@/components/shared/google-map'

export default function NewAddressPage() {
  const router = useRouter()
  const { user, loading: authLoading, getIdToken } = useAuth()
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

      const response = await fetch('/api/customer/addresses', {
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
        description: 'Address added successfully',
      })

      // Navigate back to addresses list
      router.push('/customer/addresses')
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

  if (authLoading) {
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
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <Button
            onClick={() => router.push('/customer/addresses')}
            variant="ghost"
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Add New Address</h1>
            <p className="text-green-50 mt-1">Select a location for your delivery address</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-1 py-8">
        <Card className="bg-card">
          <CardHeader>
            <CardTitle>Address Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Select Location on Map</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Click on the map to place a pin on your roof location. You can drag the pin to adjust.
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
                  className="mt-3 w-full bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white shadow-lg px-4 py-2 h-auto font-semibold"
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
                placeholder="e.g., Home, Work, Mom's House"
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
                Add landmarks, floor number, directions, or any helpful details for delivery
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => router.push('/customer/addresses')}
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
      </main>
    </div>
  )
}
