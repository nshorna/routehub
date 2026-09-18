"use client"

import type React from "react"
import type { Seller } from "@/lib/types"
import { SellerNav } from "./seller-nav"
import { useState, useEffect, useRef } from "react"
import { NotificationBanner } from "@/components/shared/notification-banner"
import { MapPin, Package, Navigation, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { normalizePhoneTo233 } from "@/lib/utils"
import { GoogleMap, GoogleMapRef } from "@/components/shared/google-map"
import { Button } from "@/components/ui/button"

interface CustomerAddress {
  id: string
  name: string
  description: string | null
  latitude: number
  longitude: number
}

interface SellerAddress {
  id: string
  name: string
  description: string | null
  latitude: number
  longitude: number
  isDefault: boolean
}

interface NewBookingProps {
  seller: Seller
}

export function NewBooking({ seller }: NewBookingProps) {
  const router = useRouter()
  const { signOut, getIdToken } = useAuth()
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    pickupAddressId: "",
    dropoffAddress: "",
    selectedAddressId: "",
    dropoffLatitude: null as number | null,
    dropoffLongitude: null as number | null,
    parcelSize: "small",
    parcelWeight: "",
    instructions: "",
  })

  const [availableAddresses, setAvailableAddresses] = useState<CustomerAddress[]>([])
  const [sellerAddresses, setSellerAddresses] = useState<SellerAddress[]>([])
  const [estimatedFare, setEstimatedFare] = useState(0)
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Map state
  const [isMapReady, setIsMapReady] = useState(false)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [selectedCoordinates, setSelectedCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const mapRef = useRef<GoogleMapRef>(null)

  // Load seller addresses on mount
  useEffect(() => {
    const loadSellerAddresses = async () => {
      try {
        const idToken = await getIdToken()
        if (!idToken) return

        const response = await fetch('/api/seller/addresses', {
          headers: {
            'Authorization': `Bearer ${idToken}`,
          },
        })
        
        if (response.ok) {
          const data = await response.json()
          setSellerAddresses(data.addresses || [])
          // Set default address if available
          const defaultAddress = data.addresses?.find((addr: SellerAddress) => addr.isDefault)
          if (defaultAddress) {
            setFormData((prev) => ({
              ...prev,
              pickupAddressId: defaultAddress.id,
            }))
          } else if (data.addresses?.length > 0) {
            // If no default, use first address
            setFormData((prev) => ({
              ...prev,
              pickupAddressId: data.addresses[0].id,
            }))
          }
        }
      } catch (error) {
        console.error('Failed to load seller addresses', error)
      }
    }

    loadSellerAddresses()
  }, [getIdToken])

  // Handle coordinates selection
  const handleCoordinatesSelect = (coords: { lat: number; lng: number }) => {
    setSelectedCoordinates(coords)
    setFormData((prev) => ({
      ...prev,
      dropoffLatitude: coords.lat,
      dropoffLongitude: coords.lng,
    }))
  }


  // Get current location and pan map
  const handleGetCurrentLocation = async () => {
    if (!mapRef.current) {
      setNotification({
        message: "Map is not ready yet",
        type: "error",
      })
      return
    }

    setIsGettingLocation(true)
    try {
      const coords = await mapRef.current.getCurrentLocation()
      mapRef.current.panTo(coords)
      mapRef.current.setZoom(15)
      mapRef.current.setMarkerPosition(coords)
      // Clear selected address when using current location
      if (formData.selectedAddressId) {
        setFormData((prev) => ({
          ...prev,
          selectedAddressId: "",
        }))
      }
      handleCoordinatesSelect(coords)
    } catch (error) {
      setNotification({
        message: error instanceof Error ? error.message : "Failed to get your location",
        type: "error",
      })
    } finally {
      setIsGettingLocation(false)
    }
  }

  // Load addresses when phone number changes
  useEffect(() => {
    const loadAddresses = async () => {
      if (!formData.customerPhone) {
        setAvailableAddresses([])
        return
      }

      try {
        const normalizedPhone = normalizePhoneTo233(formData.customerPhone)
        const res = await fetch("/api/customers/addresses", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ phone: normalizedPhone }),
        })

        if (res.ok) {
          const data = await res.json()
          setAvailableAddresses(data.addresses || [])
        }
      } catch (error) {
        console.error("Failed to load addresses", error)
      }
    }

    const debounceTimer = setTimeout(loadAddresses, 500)
    return () => clearTimeout(debounceTimer)
  }, [formData.customerPhone])

  // Lookup customer when phone number is blurred
  const handlePhoneBlur = async () => {
    if (!formData.customerPhone) return
    try {
      const normalizedPhone = normalizePhoneTo233(formData.customerPhone)
      const res = await fetch("/api/customers/lookup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone: normalizedPhone }),
      })
      if (!res.ok) return
      const data = await res.json()
      if (data.customer) {
        setFormData((prev) => ({
          ...prev,
          customerName: prev.customerName || data.customer.name || "",
          customerPhone: normalizePhoneTo233(data.customer.phone || prev.customerPhone),
        }))
      }
    } catch (error) {
      console.error("Failed to lookup customer", error)
    }
  }

  const clearSelectedAddress = () => {
    setFormData((prev) => ({
      ...prev,
      selectedAddressId: "",
      dropoffLatitude: null,
      dropoffLongitude: null,
      dropoffAddress: "",
    }))
    setSelectedCoordinates(null)
    // Reset map ready state so interactive map can initialize
    setIsMapReady(false)
  }


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleAddressSelect = (addressId: string) => {
    if (!addressId || addressId === "") {
      clearSelectedAddress()
      return
    }
    
    const address = availableAddresses.find((addr) => addr.id === addressId)
    if (!address) return
    
    setFormData((prev) => ({
      ...prev,
      selectedAddressId: address.id,
      dropoffAddress: `${address.name}${address.description ? ` - ${address.description}` : ""}`,
      dropoffLatitude: address.latitude,
      dropoffLongitude: address.longitude,
    }))
  }
  

  const calculateFare = () => {
    const baseFare = 3.5
    const sizeMultiplier = { small: 1, medium: 1.3, large: 1.6 }[formData.parcelSize] || 1
    const weight = Number.parseFloat(formData.parcelWeight) || 1
    const weightMultiplier = weight > 5 ? 1.2 : 1
    const fare = baseFare * sizeMultiplier * weightMultiplier
    setEstimatedFare(fare)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.customerName || !formData.customerPhone) {
      setNotification({
        message: "Please fill in all required fields",
        type: "error",
      })
      return
    }

    if (!formData.pickupAddressId) {
      setNotification({
        message: "Please select a pickup address",
        type: "error",
      })
      return
    }

    if (!formData.dropoffLatitude || !formData.dropoffLongitude) {
      setNotification({
        message: "Please select a location on the map",
        type: "error",
      })
      return
    }

    // If dropoffAddress is not set but coordinates are, use a default address
    const finalDropoffAddress = formData.dropoffAddress || `Selected location (${formData.dropoffLatitude.toFixed(6)}, ${formData.dropoffLongitude.toFixed(6)})`

    // Ensure fare is up-to-date before submitting
    calculateFare()

    setIsSubmitting(true)
    setNotification(null)

    try {
      // Normalize phone number to +233 format before submitting
      const normalizedPhone = normalizePhoneTo233(formData.customerPhone)
      
      // Get the selected pickup address
      const selectedPickupAddress = sellerAddresses.find(addr => addr.id === formData.pickupAddressId)
      const pickupAddressText = selectedPickupAddress 
        ? `${selectedPickupAddress.name}${selectedPickupAddress.description ? ` - ${selectedPickupAddress.description}` : ""}`
        : seller.pickupAddress
      
      const response = await fetch("/api/seller/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sellerId: seller.id,
          pickupAddress: pickupAddressText,
          pickupLatitude: selectedPickupAddress?.latitude,
          pickupLongitude: selectedPickupAddress?.longitude,
          dropoffAddress: finalDropoffAddress,
          dropoffLatitude: formData.dropoffLatitude,
          dropoffLongitude: formData.dropoffLongitude,
          customerName: formData.customerName,
          customerPhone: normalizedPhone,
          notes: formData.instructions,
          fee: estimatedFare,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || "Failed to create order")
      }

      const { delivery } = await response.json()

      setNotification({
        message: `Booking confirmed! Order ${delivery.orderId} total: $${delivery.fee.toFixed(2)}`,
        type: "success",
      })

      // Optionally navigate to tracking page for this order
      router.push(`/seller/orders/${delivery.orderId}`)

      // Reset form but keep pickup address
      const defaultPickupAddress = sellerAddresses.find((addr: SellerAddress) => addr.isDefault) || sellerAddresses[0]
      setFormData({
        customerName: "",
        customerPhone: "",
        pickupAddressId: defaultPickupAddress?.id || "",
        dropoffAddress: "",
        selectedAddressId: "",
        dropoffLatitude: null,
        dropoffLongitude: null,
        parcelSize: "small",
        parcelWeight: "",
        instructions: "",
      })
      setEstimatedFare(0)
      setSelectedCoordinates(null)
    } catch (error) {
      console.error("Failed to create order", error)
      setNotification({
        message: "Failed to create order. Please try again.",
        type: "error",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogout = async () => {
    try {
      localStorage.removeItem('selectedSellerAccountId')
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Failed to log out:', error)
      setNotification({
        message: "Failed to log out",
        type: "error",
      })
    }
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-background">
      <SellerNav onLogout={handleLogout} />

      <main className="flex-1 overflow-auto p-4 md:p-6 mt-16 md:mt-0">
        {notification && (
          <NotificationBanner
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        )}

        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Book a Delivery</h1>

          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            {/* Pickup Address */}
            <div className="bg-card rounded-lg border border-border p-4 md:p-6">
              <h2 className="text-base md:text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4 md:w-5 md:h-5" />
                Pickup Address
              </h2>
              <div className="space-y-3 md:space-y-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-foreground mb-2">
                    Select Pickup Location <span className="text-destructive">*</span>
                  </label>
                  {sellerAddresses.length > 0 ? (
                    <select
                      name="pickupAddressId"
                      value={formData.pickupAddressId}
                      onChange={handleChange}
                      className="w-full border border-border rounded-lg px-3 md:px-4 py-2 text-sm md:text-base text-foreground bg-background focus:ring-2 focus:ring-primary outline-none"
                    >
                      {sellerAddresses.map((address) => (
                        <option key={address.id} value={address.id}>
                          {address.name}{address.isDefault ? " (Default)" : ""}{address.description ? ` - ${address.description}` : ""}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="space-y-3">
                      <div className="text-sm text-muted-foreground">
                        No addresses found. Please add a pickup address first.
                      </div>
                      <Button
                        type="button"
                        onClick={() => router.push('/seller/addresses/new')}
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Pickup Address
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div className="bg-card rounded-lg border border-border p-4 md:p-6">
              <h2 className="text-base md:text-lg font-semibold text-foreground mb-4">Customer Information</h2>
              <div className="space-y-3 md:space-y-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-foreground mb-2">
                    Customer Phone <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="tel"
                    name="customerPhone"
                    value={formData.customerPhone}
                    onChange={handleChange}
                    onBlur={handlePhoneBlur}
                    placeholder="e.g., +233 24 123 4567"
                    className="w-full border border-border rounded-lg px-3 md:px-4 py-2 text-sm md:text-base text-foreground bg-background focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-medium text-foreground mb-2">
                    Customer Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleChange}
                    placeholder="Enter customer name"
                    className="w-full border border-border rounded-lg px-3 md:px-4 py-2 text-sm md:text-base text-foreground bg-background focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Delivery Details */}
            <div className="bg-card rounded-lg border border-border p-4 md:p-6">
              <h2 className="text-base md:text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4 md:w-5 md:h-5" />
                Delivery Location
              </h2>
              
              {formData.customerPhone && availableAddresses.length > 0 && (
                <div className="mb-4">
                  <label className="block text-xs md:text-sm font-medium text-foreground mb-2">
                    Select Saved Address <span className="text-destructive">*</span>
                  </label>
                  <select
                    name="selectedAddressId"
                    value={formData.selectedAddressId}
                    onChange={(e) => handleAddressSelect(e.target.value)}
                    className="w-full border border-border rounded-lg px-3 md:px-4 py-2 text-sm md:text-base text-foreground bg-background focus:ring-2 focus:ring-primary outline-none"
                  >
                    <option value="">-- Select an address or use map below --</option>
                    {availableAddresses.map((address) => (
                      <option key={address.id} value={address.id}>
                        {address.name}{address.description ? ` - ${address.description}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs md:text-sm font-medium text-foreground">
                    Select Location on Map <span className="text-destructive">*</span>
                  </label>
                  {formData.selectedAddressId && (
                    <button
                      type="button"
                      onClick={clearSelectedAddress}
                      className="text-xs font-medium text-primary hover:text-primary/80 underline"
                    >
                      Use Different Address
                    </button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  {formData.selectedAddressId
                    ? "Selected address is shown on the map. Click 'Use Different Address' above to change the location."
                    : formData.customerPhone && availableAddresses.length > 0
                    ? "Select a saved address above or click on the map to place a pin. You can drag the pin to adjust."
                    : "Click on the map to place a pin on the delivery location. You can drag the pin to adjust."}
                </p>
                <div className="w-full h-[400px] rounded-lg overflow-hidden border">
                  {formData.selectedAddressId && formData.dropoffLatitude && formData.dropoffLongitude ? (
                    // Read-only map for saved address - purely declarative
                    <GoogleMap
                      key="read-only-map"
                      center={{ lat: formData.dropoffLatitude, lng: formData.dropoffLongitude }}
                      zoom={15}
                      height="400px"
                      interactive={false}
                      showControls={false}
                      markerPosition={{ lat: formData.dropoffLatitude, lng: formData.dropoffLongitude }}
                      markerTitle="Delivery location"
                      className="rounded-lg"
                    />
                  ) : (
                    // Interactive map for selecting address
                    <GoogleMap
                      key="interactive-map"
                      ref={mapRef}
                      height="400px"
                      allowClickToSelect={true}
                      draggableMarker={true}
                      showControls={true}
                      enableGeocoding={false}
                      onCoordinatesSelect={(coords) => {
                        handleCoordinatesSelect(coords)
                      }}
                      onMapReady={() => setIsMapReady(true)}
                      markerPosition={selectedCoordinates}
                      className="rounded-lg"
                    />
                  )}
                </div>
                {isMapReady && !formData.selectedAddressId && (
                  <button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    disabled={isGettingLocation}
                    className="mt-3 w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg px-4 py-2 h-auto font-semibold rounded-lg transition-colors disabled:opacity-60"
                  >
                    <Navigation className={`w-4 h-4 mr-2 inline ${isGettingLocation ? 'animate-spin' : ''}`} />
                    {isGettingLocation ? 'Finding Location...' : 'Use My Location'}
                  </button>
                )}
                {selectedCoordinates && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Selected: {selectedCoordinates.lat.toFixed(6)}, {selectedCoordinates.lng.toFixed(6)}
                  </p>
                )}
              </div>
            </div>

            {/* Parcel Information */}
            <div className="bg-card rounded-lg border border-border p-4 md:p-6">
              <h2 className="text-base md:text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Package className="w-4 h-4 md:w-5 md:h-5" />
                Parcel Details
              </h2>
              <div className="space-y-3 md:space-y-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-foreground mb-2">Parcel Size</label>
                  <select
                    name="parcelSize"
                    value={formData.parcelSize}
                    onChange={handleChange}
                    className="w-full border border-border rounded-lg px-3 md:px-4 py-2 text-sm md:text-base text-foreground bg-background focus:ring-2 focus:ring-primary outline-none"
                  >
                    <option value="small">Small (Documents, Small Items)</option>
                    <option value="medium">Medium (Packages, Books)</option>
                    <option value="large">Large (Boxes, Electronics)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-medium text-foreground mb-2">
                    Estimated Weight (kg)
                  </label>
                  <input
                    type="number"
                    name="parcelWeight"
                    value={formData.parcelWeight}
                    onChange={(e) => {
                      handleChange(e)
                      calculateFare()
                    }}
                    placeholder="e.g., 2.5"
                    step="0.1"
                    className="w-full border border-border rounded-lg px-3 md:px-4 py-2 text-sm md:text-base text-foreground bg-background focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-medium text-foreground mb-2">
                    Special Instructions
                  </label>
                  <textarea
                    name="instructions"
                    value={formData.instructions}
                    onChange={handleChange}
                    placeholder="e.g., Handle with care, Fragile items..."
                    rows={3}
                    className="w-full border border-border rounded-lg px-3 md:px-4 py-2 text-sm md:text-base text-foreground bg-background focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Estimated Fare */}
            <div className="bg-primary/10 border border-primary rounded-lg p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground mb-1">Estimated Delivery Fare</p>
                  <p className="text-2xl md:text-3xl font-bold text-primary">
                    ${estimatedFare.toFixed(2)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={calculateFare}
                  className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-semibold text-sm md:text-base hover:bg-primary/90 transition-colors whitespace-nowrap"
                >
                  Calculate Fare
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-primary-foreground py-2 md:py-3 rounded-lg font-semibold text-sm md:text-base hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Booking..." : "Book Delivery"}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
