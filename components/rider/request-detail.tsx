"use client"

import type { Delivery } from "@/lib/types"
import { RiderNav } from "./rider-nav"
import { MapPin, DollarSign, ArrowLeft, Phone, FileText } from "lucide-react"
import { useEffect, useState } from "react"
import { NotificationBanner } from "@/components/shared/notification-banner"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { GoogleMap } from "@/components/shared/google-map"

interface RequestDetailProps {
  delivery: Delivery
}

export function RequestDetail({ delivery }: RequestDetailProps) {
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [routeDistance, setRouteDistance] = useState<number | null>(null) // in meters
  const [routeDuration, setRouteDuration] = useState<number | null>(null) // in seconds
  const { getIdToken } = useAuth()
  const router = useRouter()

  // If the rider already has an active delivery, redirect them to complete it
  // before they can view/accept another request.
  useEffect(() => {
    let isMounted = true

    const checkActiveDelivery = async () => {
      try {
        const idToken = await getIdToken()
        if (!idToken) return

        const response = await fetch("/api/rider/active-delivery", {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        })

        if (!response.ok) return

        const data = await response.json()

        if (isMounted && data?.hasActiveDelivery) {
          setNotification({
            message:
              "You already have an active delivery. Please complete it before accepting a new one. Redirecting you now...",
            type: "error",
          })

          setTimeout(() => {
            router.push("/rider/active")
          }, 1500)
        }
      } catch (error) {
        // Silently ignore check failures; user can still try actions which will fail if invalid
        console.error("Failed to check active delivery status", error)
      }
    }

    checkActiveDelivery()

    return () => {
      isMounted = false
    }
  }, [getIdToken, router])

  const handleAccept = async () => {
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

      // Re-check for an existing active delivery before accepting a new one
      try {
        const response = await fetch("/api/rider/active-delivery", {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        })

        if (response.ok) {
          const data = await response.json()

          if (data?.hasActiveDelivery) {
            setNotification({
              message:
                "You already have an active delivery. Please complete it before accepting a new one.",
              type: "error",
            })

            setTimeout(() => {
              router.push("/rider/active")
            }, 1500)

            return
          }
        }
      } catch (error) {
        console.error("Failed to verify active delivery before accepting", error)
      }

      const response = await fetch(`/api/rider/deliveries/${delivery.id}/accept`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${idToken}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to accept delivery")
      }
      setNotification({
        message: "Delivery accepted! Redirecting to active deliveries...",
        type: "success",
      })
      
      // Redirect to active deliveries after a short delay
      setTimeout(() => {
        router.push("/rider/active")
      }, 1500)
    } catch (error) {
      setNotification({
        message: error instanceof Error ? error.message : "Failed to accept delivery",
        type: "error",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async () => {
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

      const response = await fetch(`/api/rider/deliveries/${delivery.id}/reject`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${idToken}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to reject delivery")
      }
      setNotification({
        message: "Delivery rejected. Returning to requests...",
        type: "error",
      })
      
      // Redirect back to requests list after a short delay
      setTimeout(() => {
        router.push("/rider/requests")
      }, 1500)
    } catch (error) {
      setNotification({
        message: error instanceof Error ? error.message : "Failed to reject delivery",
        type: "error",
      })
    } finally {
      setIsProcessing(false)
    }
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
          {/* Back Button */}
          <Link
            href="/rider/requests"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm md:text-base">Back to Requests</span>
          </Link>

          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Delivery Request Details</h1>
          <p className="text-sm md:text-base text-muted-foreground mb-6">Order ID: {delivery.orderId}</p>

          {/* Map View */}
          <div className="rounded-lg w-full h-64 md:h-80 mb-4 md:mb-6 overflow-hidden border border-border">
            <GoogleMap
              key={`delivery-${delivery.id}`}
              center={
                delivery.pickupLatitude && delivery.pickupLongitude
                  ? { lat: delivery.pickupLatitude, lng: delivery.pickupLongitude }
                  : delivery.dropoffLatitude && delivery.dropoffLongitude
                  ? { lat: delivery.dropoffLatitude, lng: delivery.dropoffLongitude }
                  : { lat: 5.6037, lng: -0.1870 }
              }
              zoom={13}
              height="100%"
              width="100%"
              interactive={true}
              showControls={true}
              pickupLocation={
                delivery.pickupLatitude && delivery.pickupLongitude
                  ? { lat: delivery.pickupLatitude, lng: delivery.pickupLongitude }
                  : null
              }
              dropoffLocation={
                delivery.dropoffLatitude && delivery.dropoffLongitude
                  ? { lat: delivery.dropoffLatitude, lng: delivery.dropoffLongitude }
                  : null
              }
              showRoute={
                !!(delivery.pickupLatitude && delivery.pickupLongitude && delivery.dropoffLatitude && delivery.dropoffLongitude)
              }
              onRouteCalculated={(distance, duration) => {
                setRouteDistance(distance)
                setRouteDuration(duration)
              }}
              className="rounded-lg"
            />
          </div>

          {/* Delivery Details Card */}
          <div className="bg-card rounded-lg border border-border p-4 md:p-6 mb-4 md:mb-6">
            <h2 className="text-lg md:text-xl font-semibold text-foreground mb-4 md:mb-6">Delivery Information</h2>
            
            <div className="space-y-4 md:space-y-6">
              {/* Pickup Location */}
              <div>
                <div className="flex items-start gap-3 mb-2">
                  <div className="bg-primary rounded-full p-2 flex-shrink-0">
                    <MapPin className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs md:text-sm font-medium text-muted-foreground mb-1">Pickup Location</p>
                    <p className="text-sm md:text-base text-foreground font-semibold break-words">
                      {delivery.pickupAddress}
                    </p>
                  </div>
                </div>
              </div>

              {/* Dropoff Location */}
              <div>
                <div className="flex items-start gap-3 mb-2">
                  <div className="bg-destructive rounded-full p-2 flex-shrink-0">
                    <MapPin className="w-4 h-4 text-destructive-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs md:text-sm font-medium text-muted-foreground mb-1">Dropoff Location</p>
                    <p className="text-sm md:text-base text-foreground font-semibold break-words">
                      {delivery.dropoffAddress}
                    </p>
                  </div>
                </div>
              </div>

              {/* Route Information */}
              {(routeDistance !== null || routeDuration !== null) && (
                <div className="pt-4 border-t border-border">
                  <div className="grid grid-cols-2 gap-4">
                    {routeDistance !== null && (
                      <div>
                        <p className="text-xs md:text-sm text-muted-foreground mb-1">Distance</p>
                        <p className="text-base md:text-lg font-semibold text-foreground">
                          {routeDistance < 1000
                            ? `${routeDistance.toFixed(0)} m`
                            : `${(routeDistance / 1000).toFixed(2)} km`}
                        </p>
                      </div>
                    )}
                    {routeDuration !== null && (
                      <div>
                        <p className="text-xs md:text-sm text-muted-foreground mb-1">Estimated Time</p>
                        <p className="text-base md:text-lg font-semibold text-foreground">
                          {routeDuration < 60
                            ? `${routeDuration} sec`
                            : routeDuration < 3600
                            ? `${Math.round(routeDuration / 60)} min`
                            : `${Math.round(routeDuration / 3600)} hr ${Math.round((routeDuration % 3600) / 60)} min`}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Delivery Fee */}
              <div className="pt-4 border-t border-border">
                <div className="flex items-start gap-2">
                  <DollarSign className="w-5 h-5 md:w-6 md:h-6 text-primary flex-shrink-0 mt-1" />
                  <div className="min-w-0">
                    <p className="text-xs md:text-sm text-muted-foreground mb-1">Delivery Fee</p>
                    <p className="text-2xl md:text-3xl font-bold text-foreground">${delivery.fee.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* Notes if available */}
              {delivery.notes && (
                <div className="pt-4 border-t border-border">
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground flex-shrink-0 mt-1" />
                    <div className="min-w-0">
                      <p className="text-xs md:text-sm font-medium text-muted-foreground mb-1">Special Instructions</p>
                      <p className="text-sm md:text-base text-foreground break-words">{delivery.notes}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Customer Phone if available */}
              {delivery.customerPhone && (
                <div className="pt-4 border-t border-border">
                  <p className="text-xs md:text-sm font-medium text-muted-foreground mb-2">Customer Contact</p>
                  <a
                    href={`tel:${delivery.customerPhone}`}
                    className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    <span className="text-sm md:text-base">{delivery.customerPhone}</span>
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
            <button
              onClick={handleAccept}
              disabled={isProcessing}
              className="flex-1 bg-primary text-primary-foreground py-3 md:py-4 rounded-lg font-semibold text-base md:text-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? "Processing..." : "Accept Delivery"}
            </button>
            <button
              onClick={handleReject}
              disabled={isProcessing}
              className="flex-1 bg-destructive text-destructive-foreground py-3 md:py-4 rounded-lg font-semibold text-base md:text-lg hover:bg-destructive/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? "Processing..." : "Reject"}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
