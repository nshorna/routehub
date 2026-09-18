"use client"

/// <reference types="google.maps" />

import type { Delivery } from "@/lib/types"
import { RiderNav } from "./rider-nav"
import { MapPin, Phone, CheckCircle2, AlertCircle, Navigation } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { NotificationBanner } from "@/components/shared/notification-banner"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { GoogleMap, GoogleMapRef } from "@/components/shared/google-map"
import { Button } from "@/components/ui/button"

interface ActiveDeliveryProps {
  delivery?: Delivery
}

// Map delivery status to step number
function getStepFromStatus(status: Delivery["status"]): number {
  switch (status) {
    case "pending":
      return 1
    case "picked-up":
      return 2
    case "in-transit":
      return 3
    case "delivered":
      return 4
    case "cancelled":
      return 0
    default:
      return 1
  }
}

export function ActiveDelivery({ delivery: initialDelivery }: ActiveDeliveryProps) {
  const [delivery, setDelivery] = useState(initialDelivery)
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [pins, setPins] = useState<{ pickupConfirmationPin: string | null; deliveryConfirmationPin: string | null } | null>(null)
  const [loadingPins, setLoadingPins] = useState(false)
  const [pickupCoordinates, setPickupCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const [dropoffCoordinates, setDropoffCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)
  const mapRef = useRef<GoogleMapRef>(null)
  const watchPositionIdRef = useRef<number | null>(null)
  const { getIdToken } = useAuth()
  const router = useRouter()

  // Update delivery state when prop changes
  useEffect(() => {
    setDelivery(initialDelivery)
  }, [initialDelivery])

  // Load PINs when delivery is available
  useEffect(() => {
    const loadPins = async () => {
      if (!delivery) return

      setLoadingPins(true)
      try {
        const idToken = await getIdToken()
        if (!idToken) return

        const response = await fetch(`/api/rider/deliveries/${delivery.orderId}/pins`, {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setPins({
            pickupConfirmationPin: data.pickupConfirmationPin,
            deliveryConfirmationPin: data.deliveryConfirmationPin,
          })
        }
      } catch (error) {
        console.error("Failed to load PINs:", error)
      } finally {
        setLoadingPins(false)
      }
    }

    loadPins()
  }, [delivery, getIdToken])

  // Get current location
  useEffect(() => {
    if (!delivery) return

    const getCurrentLocation = () => {
      if (!navigator.geolocation) {
        console.warn("Geolocation is not supported")
        return
      }

      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
          setCurrentLocation(coords)
        },
        (error) => {
          console.error("Error getting location:", error)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      )

      watchPositionIdRef.current = watchId
    }

    getCurrentLocation()

    return () => {
      if (watchPositionIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchPositionIdRef.current)
      }
    }
  }, [delivery])

  // Set coordinates directly from delivery object
  useEffect(() => {
    if (!delivery) return

    // Set pickup coordinates
    if (delivery.pickupLatitude && delivery.pickupLongitude) {
      setPickupCoordinates({
        lat: delivery.pickupLatitude,
        lng: delivery.pickupLongitude,
      })
    } else {
      setPickupCoordinates(null)
    }

    // Set dropoff coordinates
    if (delivery.dropoffLatitude && delivery.dropoffLongitude) {
      setDropoffCoordinates({
        lat: delivery.dropoffLatitude,
        lng: delivery.dropoffLongitude,
      })
    } else {
      setDropoffCoordinates(null)
    }
  }, [
    delivery?.pickupLatitude,
    delivery?.pickupLongitude,
    delivery?.dropoffLatitude,
    delivery?.dropoffLongitude,
  ])

  // Handle getting directions (opens external Google Maps)
  const handleGetDirections = () => {
    if (!delivery) return
    const isGoingToPickup = delivery.status === "pending"
    
    // Use coordinates if available, otherwise fallback to address
    if (isGoingToPickup && pickupCoordinates) {
      const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${pickupCoordinates.lat},${pickupCoordinates.lng}`
      window.open(directionsUrl, "_blank")
    } else if (!isGoingToPickup && dropoffCoordinates) {
      const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${dropoffCoordinates.lat},${dropoffCoordinates.lng}`
      window.open(directionsUrl, "_blank")
    } else {
      // Fallback to address if coordinates not available
      const address = isGoingToPickup ? delivery.pickupAddress : delivery.dropoffAddress
      const encodedAddress = encodeURIComponent(address)
      const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`
      window.open(directionsUrl, "_blank")
    }
  }

  const currentStep = delivery ? getStepFromStatus(delivery.status) : 0

  const steps = [
    { number: 1, label: "Go to Pickup", description: "Navigate to the pickup location", status: "pending" as const },
    { number: 2, label: "Picked Up", description: "Confirm you've picked up the package", status: "picked-up" as const },
    { number: 3, label: "Go to Drop-off", description: "Navigate to the drop-off location", status: "in-transit" as const },
    { number: 4, label: "Delivered", description: "Confirm successful delivery", status: "delivered" as const },
  ]

  const handleStatusUpdate = async (newStatus: "IN_TRANSIT") => {
    if (!delivery) return

    setIsProcessing(true)
    try {
      const idToken = await getIdToken()
      if (!idToken) {
        setNotification({
          message: "Authentication required. Please log in again.",
          type: "error",
        })
        return
      }

      const response = await fetch(`/api/deliveries/${delivery.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`,
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update delivery status")
      }

      const updated = await response.json()
      setDelivery(updated)

      const statusMessages: Record<string, string> = {
        IN_TRANSIT: "On the way to drop-off location!",
      }

      setNotification({
        message: statusMessages[newStatus] || "Status updated successfully!",
        type: "success",
      })

      // Refresh the page after a delay to show updated state
      setTimeout(() => {
        router.refresh()
      }, 2000)
    } catch (error) {
      setNotification({
        message: error instanceof Error ? error.message : "Failed to update delivery status",
        type: "error",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  if (!delivery) {
    return (
      <div className="flex flex-col md:flex-row h-screen bg-background">
        <RiderNav />
        <main className="flex-1 flex items-center justify-center p-4 mt-16 md:mt-0">
          <div className="text-center">
            <AlertCircle className="w-10 md:w-12 h-10 md:h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg md:text-xl font-semibold text-foreground mb-2">No Active Delivery</h2>
            <p className="text-sm md:text-base text-muted-foreground">
              Check the requests tab to accept new deliveries.
            </p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-background">
      <RiderNav />

      <main className="flex-1 overflow-auto p-4 md:p-6 mt-16 md:mt-0">
        {notification && (
          <NotificationBanner
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        )}

        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Active Delivery</h1>
          <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-6">{delivery.orderId}</p>

          {/* Map Component */}
          <div className="mb-4 md:mb-6">
            <div className="rounded-lg overflow-hidden border border-border">
              <GoogleMap
                ref={mapRef}
                center={
                  delivery.status === "pending"
                    ? pickupCoordinates || { lat: 5.6037, lng: -0.1870 }
                    : dropoffCoordinates || pickupCoordinates || { lat: 5.6037, lng: -0.1870 }
                }
                zoom={15}
                height="300px"
                pickupLocation={delivery.status === "pending" ? pickupCoordinates : null}
                dropoffLocation={
                  delivery.status === "picked-up" || delivery.status === "in-transit"
                    ? dropoffCoordinates
                    : null
                }
                showRoute={Boolean(
                  (delivery.status === "pending" && pickupCoordinates && currentLocation) ||
                  ((delivery.status === "picked-up" || delivery.status === "in-transit") &&
                    pickupCoordinates &&
                    dropoffCoordinates &&
                    currentLocation)
                )}
                interactive={true}
                showControls={true}
                className="w-full"
              />
            </div>
            {/* Navigation Button */}
            <div className="mt-3">
              <Button
                onClick={handleGetDirections}
                className="w-full text-base py-6"
                size="lg"
              >
                <Navigation className="w-5 h-5" />
                <span>
                  {delivery.status === "pending"
                    ? "Open Google Maps to Pickup"
                    : "Open Google Maps to Delivery"}
                </span>
              </Button>
            </div>
          </div>

          {/* Step Progress */}
          <div className="mb-6 md:mb-8">
            <h2 className="text-base md:text-lg font-semibold text-foreground mb-4">Delivery Progress</h2>
            <div className="space-y-3">
              {steps.map((step) => {
                const stepStatus = getStepFromStatus(delivery.status)
                const isCompleted = stepStatus > step.number
                const isCurrent = stepStatus === step.number

                return (
                  <div key={step.number} className="flex items-start gap-3 md:gap-4">
                    <div
                      className={`flex-shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center font-semibold text-xs md:text-sm ${
                        isCompleted || isCurrent
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5" /> : step.number}
                    </div>
                    <div className="pt-1 flex-1">
                      <p
                        className={`text-sm md:text-base font-semibold ${
                          isCompleted || isCurrent ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {step.label}
                        {isCurrent && (
                          <span className="ml-2 text-xs text-primary font-normal">(Current)</span>
                        )}
                      </p>
                      <p className="text-xs md:text-sm text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Delivery Details */}
          <div className="bg-card rounded-lg border border-border p-4 md:p-6 mb-4 md:mb-6">
            <h3 className="text-base md:text-lg font-semibold text-foreground mb-4">Delivery Details</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground mb-1">From</p>
                <p className="text-sm md:text-base text-foreground font-semibold break-words">
                  {delivery.pickupAddress}
                </p>
              </div>
              <div>
                <p className="text-xs md:text-sm text-muted-foreground mb-1">To</p>
                <p className="text-sm md:text-base text-foreground font-semibold break-words">
                  {delivery.dropoffAddress}
                </p>
              </div>
              <div className="pt-4 border-t border-border">
                <p className="text-xs md:text-sm text-muted-foreground mb-1">Delivery Fee</p>
                <p className="text-xl md:text-2xl font-bold text-primary">${delivery.fee.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Confirmation PINs - for rider to share */}
          {pins && (
            <div className="bg-card rounded-lg border border-border p-4 md:p-6 mb-4 md:mb-6">
              <h3 className="text-base md:text-lg font-semibold text-foreground mb-4">Confirmation PINs</h3>
              <div className="space-y-4">
                {pins.pickupConfirmationPin && delivery.status === "pending" && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-xs md:text-sm text-muted-foreground mb-2">Pickup Confirmation PIN</p>
                    <p className="text-2xl md:text-3xl font-mono font-bold text-blue-700 text-center tracking-widest">
                      {pins.pickupConfirmationPin}
                    </p>
                    <p className="text-xs md:text-sm text-muted-foreground mt-2 text-center">
                      Share this PIN with the seller to confirm pickup
                    </p>
                  </div>
                )}
                {pins.deliveryConfirmationPin && (delivery.status === "picked-up" || delivery.status === "in-transit") && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-xs md:text-sm text-muted-foreground mb-2">Delivery Confirmation PIN</p>
                    <p className="text-2xl md:text-3xl font-mono font-bold text-green-700 text-center tracking-widest">
                      {pins.deliveryConfirmationPin}
                    </p>
                    <p className="text-xs md:text-sm text-muted-foreground mt-2 text-center">
                      Share this PIN with the customer to confirm delivery
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Contact Buttons - full width on mobile */}
          {delivery.customerPhone && (
            <div className="mb-4 md:mb-6">
              <a
                href={`tel:${delivery.customerPhone}`}
                className="block w-full bg-primary text-primary-foreground py-2 md:py-3 rounded-lg font-semibold text-sm md:text-base hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" />
                <span>Call Customer: {delivery.customerPhone}</span>
              </a>
            </div>
          )}

          {/* Action Buttons */}
          {currentStep === 1 && (
            <div className="space-y-3">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs md:text-sm text-yellow-800 text-center">
                  <strong>Note:</strong> Share the pickup PIN with the seller. The seller must confirm pickup using the PIN before you can proceed.
                </p>
              </div>
            </div>
          )}
          {currentStep === 2 && (
            <div className="space-y-3">
              <button
                onClick={() => handleStatusUpdate("IN_TRANSIT")}
                disabled={isProcessing}
                className="w-full bg-primary text-primary-foreground py-2 md:py-3 rounded-lg font-semibold text-sm md:text-base hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? "Processing..." : "Start Delivery (Go to Drop-off)"}
              </button>
            </div>
          )}
          {currentStep === 3 && (
            <div className="space-y-3">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs md:text-sm text-yellow-800 text-center">
                  <strong>Note:</strong> Share the delivery PIN with the customer. The customer must confirm delivery using the PIN.
                </p>
              </div>
            </div>
          )}
          {currentStep === 4 && (
            <div className="bg-primary/10 border border-primary text-primary py-2 md:py-3 px-4 rounded-lg text-center font-semibold text-sm md:text-base">
              Delivery Completed!
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
