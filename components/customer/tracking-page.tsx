"use client"

import type { Delivery } from "@/lib/types"
import { MapPin, Phone, AlertCircle, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { APP_NAME } from "@/lib/constants"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"

interface TrackingPageProps {
  delivery?: Delivery
  orderId: string
  backHref?: string
  backLabel?: string
  showPickupConfirmation?: boolean
}

export function TrackingPage({ delivery, orderId, backHref = "/customer", backLabel = "Back to Home", showPickupConfirmation = false }: TrackingPageProps) {
  const { getIdToken } = useAuth()
  const [deliveryPin, setDeliveryPin] = useState("")
  const [isConfirmingDelivery, setIsConfirmingDelivery] = useState(false)
  const [deliveryNotification, setDeliveryNotification] = useState<{ message: string; type: "success" | "error" } | null>(null)
  
  const [pickupPin, setPickupPin] = useState("")
  const [isConfirmingPickup, setIsConfirmingPickup] = useState(false)
  const [pickupNotification, setPickupNotification] = useState<{ message: string; type: "success" | "error" } | null>(null)

  const handleConfirmDelivery = async () => {
    if (!deliveryPin || deliveryPin.length !== 4) {
      setDeliveryNotification({
        message: "Please enter a valid 4-digit PIN",
        type: "error",
      })
      return
    }

    setIsConfirmingDelivery(true)
    setDeliveryNotification(null)

    try {
      const response = await fetch(`/api/customer/orders/${orderId}/confirm-delivery`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pin: deliveryPin,
          customerPhone: delivery?.customerPhone,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to confirm delivery")
      }

      setDeliveryNotification({
        message: "Delivery confirmed successfully!",
        type: "success",
      })

      // Refresh the page after a delay to show updated status
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (error) {
      setDeliveryNotification({
        message: error instanceof Error ? error.message : "Failed to confirm delivery",
        type: "error",
      })
    } finally {
      setIsConfirmingDelivery(false)
    }
  }

  const handleConfirmPickup = async () => {
    if (!pickupPin || pickupPin.length !== 4) {
      setPickupNotification({
        message: "Please enter a valid 4-digit PIN",
        type: "error",
      })
      return
    }

    setIsConfirmingPickup(true)
    setPickupNotification(null)

    try {
      const idToken = await getIdToken()
      if (!idToken) {
        throw new Error("Authentication required. Please log in again.")
      }

      const response = await fetch(`/api/seller/orders/${orderId}/confirm-pickup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          pin: pickupPin,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to confirm pickup")
      }

      setPickupNotification({
        message: "Pickup confirmed successfully!",
        type: "success",
      })

      // Refresh the page after a delay to show updated status
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (error) {
      setPickupNotification({
        message: error instanceof Error ? error.message : "Failed to confirm pickup",
        type: "error",
      })
    } finally {
      setIsConfirmingPickup(false)
    }
  }

  if (!delivery) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="bg-[var(--primary)] text-white py-4 md:py-6 px-4">
          <div className="max-w-4xl mx-auto">
            <Link
              href={backHref}
              className="text-green-50 hover:text-white font-medium mb-2 md:mb-4 inline-block text-sm md:text-base"
            >
              ← {backLabel}
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold">Track Delivery</h1>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 md:py-12 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 md:w-16 md:h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2">Delivery Not Found</h2>
            <p className="text-xs md:text-base text-muted-foreground mb-6">Order ID: {orderId}</p>
            <Link
              href={backHref}
              className="inline-block bg-[var(--primary)] text-white px-6 py-2 rounded-lg font-semibold text-sm md:text-base hover:bg-[var(--primary)]/80 transition-colors"
            >
              {backLabel}
            </Link>
          </div>
        </main>
      </div>
    )
  }

  const statusJourney = [
    { step: "Booked", status: "booked", completed: true },
    {
      step: "Picked Up",
      status: "picked-up",
      completed: ["picked-up", "in-transit", "delivered"].includes(delivery.status),
    },
    {
      step: "Out for Delivery",
      status: "in-transit",
      completed: ["in-transit", "delivered"].includes(delivery.status),
    },
    { step: "Delivered", status: "delivered", completed: delivery.status === "delivered" },
  ]

  const statusMessages = {
    pending: "Your delivery has been booked",
    "picked-up": "The rider has picked up your package",
    "in-transit": "Your package is out for delivery",
    delivered: "Your delivery has been completed",
    cancelled: "This delivery has been cancelled",
  }

  const getStatusColor = (status: string) => {
    const colors = {
      pending: "text-yellow-500",
      "picked-up": "text-blue-500",
      "in-transit": "text-[var(--primary)]",
      delivered: "text-green-500",
      cancelled: "text-[var(--destructive)]",
    }
    return colors[status as keyof typeof colors] || "text-gray-500"
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-[var(--primary)] text-white py-4 md:py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <Link
            href={backHref}
            className="text-green-50 hover:text-white font-medium mb-2 md:mb-4 inline-block text-sm md:text-base"
          >
            ← {backLabel}
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold">Track Delivery</h1>
          <p className="text-green-50 text-base md:text-lg mt-2">{orderId}</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 md:py-8">
        {/* Status Badge */}
        <div className="bg-card rounded-lg border border-border p-4 md:p-6 mb-4 md:mb-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xs md:text-sm font-medium text-muted-foreground mb-2">Current Status</h2>
              <p className={`text-2xl md:text-4xl font-bold ${getStatusColor(delivery.status)}`}>
                {delivery.status === "in-transit"
                  ? "Out for Delivery"
                  : delivery.status.charAt(0).toUpperCase() + delivery.status.slice(1).replace("-", " ")}
              </p>
            </div>
            <div className={`text-4xl md:text-5xl flex-shrink-0 ${getStatusColor(delivery.status)}`}>
              {delivery.status === "delivered" && <CheckCircle2 />}
              {delivery.status === "cancelled" && <AlertCircle />}
              {!["delivered", "cancelled"].includes(delivery.status) && <MapPin />}
            </div>
          </div>
          <p className="text-sm md:text-base text-muted-foreground">
            {statusMessages[delivery.status as keyof typeof statusMessages]}
          </p>
        </div>

        {/* Journey Timeline */}
        <div className="bg-card rounded-lg border border-border p-4 md:p-6 mb-4 md:mb-6">
          <h3 className="text-base md:text-lg font-semibold text-foreground mb-4 md:mb-6">Delivery Journey</h3>
          <div className="space-y-3 md:space-y-4">
            {statusJourney.map((item, index) => (
              <div key={item.step} className="flex items-start gap-3 md:gap-4">
                {/* Timeline connector */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center font-semibold text-xs md:text-sm flex-shrink-0 ${
                      item.completed ? "bg-[var(--primary)] text-white" : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {item.completed ? <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5" /> : index + 1}
                  </div>
                  {index < statusJourney.length - 1 && (
                    <div className={`w-1 h-10 md:h-12 ${item.completed ? "bg-[var(--primary)]" : "bg-gray-200"}`} />
                  )}
                </div>

                {/* Step content */}
                <div className="pt-1">
                  <p
                    className={`text-sm md:text-base font-semibold ${item.completed ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    {item.step}
                  </p>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    {item.completed ? "Completed" : item.status === delivery.status ? "In progress" : "Waiting"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
          {/* From */}
          <div className="bg-card rounded-lg border border-border p-4 md:p-6">
            <h4 className="text-xs md:text-sm font-medium text-muted-foreground mb-3">Pickup Location</h4>
            <div className="flex gap-3">
              <div className="bg-[var(--primary)] rounded-full p-2 flex-shrink-0">
                <MapPin className="w-3 h-3 md:w-4 md:h-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-sm md:text-base text-foreground font-semibold break-words">
                  {delivery.pickupAddress}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Sender Location</p>
              </div>
            </div>
          </div>

          {/* To */}
          <div className="bg-card rounded-lg border border-border p-4 md:p-6">
            <h4 className="text-xs md:text-sm font-medium text-muted-foreground mb-3">Drop-off Location</h4>
            <div className="flex gap-3">
              <div className="bg-[var(--destructive)] rounded-full p-2 flex-shrink-0">
                <MapPin className="w-3 h-3 md:w-4 md:h-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-sm md:text-base text-foreground font-semibold break-words">
                  {delivery.dropoffAddress}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Your Location</p>
              </div>
            </div>
          </div>
        </div>

        {/* Rider Info (if assigned) */}
        {delivery.riderName && (
          <div className="bg-[var(--primary)]/10 border border-[var(--primary)] rounded-lg p-4 md:p-6 mb-4 md:mb-6">
            <h4 className="text-base md:text-lg font-semibold text-foreground mb-4">Your Delivery Rider</h4>
            <div className="space-y-3">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground mb-1">Name</p>
                <p className="text-sm md:text-base text-foreground font-semibold">{delivery.riderName}</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 pt-3">
                <button className="flex-1 bg-[var(--primary)] text-white py-2 rounded-lg font-semibold text-xs md:text-sm hover:bg-[var(--primary)]/80 transition-colors flex items-center justify-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>Call Rider</span>
                </button>
                <button className="flex-1 bg-blue-500 text-white py-2 rounded-lg font-semibold text-xs md:text-sm hover:bg-blue-600 transition-colors flex items-center justify-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>View Map</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Map Placeholder */}
        <div className="bg-gray-200 rounded-lg w-full h-40 md:h-64 flex items-center justify-center mb-4 md:mb-6">
          <div className="text-center">
            <MapPin className="w-8 md:w-12 h-8 md:h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-xs md:text-base text-gray-600">Live Map - Rider Location</p>
          </div>
        </div>

        {/* Pickup Confirmation PIN (for sellers when status is pending) */}
        {showPickupConfirmation && delivery.status === "pending" && (
          <div className="bg-card rounded-lg border border-border p-4 md:p-6 mb-4 md:mb-6">
            <h4 className="text-base md:text-lg font-semibold text-foreground mb-3">Confirm Pickup</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Enter the pickup confirmation PIN provided by the rider to confirm the package has been picked up.
            </p>
            {pickupNotification && (
              <div
                className={`mb-4 p-3 rounded-lg text-sm ${
                  pickupNotification.type === "success"
                    ? "bg-green-50 text-green-800 border border-green-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                {pickupNotification.message}
              </div>
            )}
            <div className="flex gap-3">
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                placeholder="Enter 4-digit PIN"
                value={pickupPin}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 4)
                  setPickupPin(value)
                }}
                className="flex-1 text-center text-2xl font-mono tracking-widest"
              />
              <Button
                onClick={handleConfirmPickup}
                disabled={isConfirmingPickup || pickupPin.length !== 4}
                className="bg-[var(--primary)] text-white hover:bg-[var(--primary)]/80"
              >
                {isConfirmingPickup ? "Confirming..." : "Confirm"}
              </Button>
            </div>
          </div>
        )}

        {/* Delivery Confirmation PIN (for customers when status is in-transit or picked-up) */}
        {!showPickupConfirmation && (delivery.status === "in-transit" || delivery.status === "picked-up") && (
          <div className="bg-card rounded-lg border border-border p-4 md:p-6 mb-4 md:mb-6">
            <h4 className="text-base md:text-lg font-semibold text-foreground mb-3">Confirm Delivery</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Enter the delivery confirmation PIN provided by the rider to confirm you received your package.
            </p>
            {deliveryNotification && (
              <div
                className={`mb-4 p-3 rounded-lg text-sm ${
                  deliveryNotification.type === "success"
                    ? "bg-green-50 text-green-800 border border-green-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                {deliveryNotification.message}
              </div>
            )}
            <div className="flex gap-3">
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                placeholder="Enter 4-digit PIN"
                value={deliveryPin}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 4)
                  setDeliveryPin(value)
                }}
                className="flex-1 text-center text-2xl font-mono tracking-widest"
              />
              <Button
                onClick={handleConfirmDelivery}
                disabled={isConfirmingDelivery || deliveryPin.length !== 4}
                className="bg-[var(--primary)] text-white hover:bg-[var(--primary)]/80"
              >
                {isConfirmingDelivery ? "Confirming..." : "Confirm"}
              </Button>
            </div>
          </div>
        )}

        {/* Booking Info */}
        <div className="bg-card rounded-lg border border-border p-4 md:p-6">
          <h4 className="text-base md:text-lg font-semibold text-foreground mb-4">Booking Information</h4>
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div>
              <p className="text-xs md:text-sm text-muted-foreground mb-1">Order ID</p>
              <p className="text-sm md:text-base text-foreground font-semibold">{delivery.orderId}</p>
            </div>
            <div>
              <p className="text-xs md:text-sm text-muted-foreground mb-1">Booked Date</p>
              <p className="text-sm md:text-base text-foreground font-semibold">
                {delivery.createdAt.toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-xs md:text-sm text-muted-foreground mb-1">Delivery Fee</p>
              <p className="text-base md:text-lg text-foreground font-bold text-[var(--primary)]">
                ${delivery.fee.toFixed(2)}
              </p>
            </div>
            {delivery.notes && (
              <div>
                <p className="text-xs md:text-sm text-muted-foreground mb-1">Notes</p>
                <p className="text-xs md:text-sm text-foreground">{delivery.notes}</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-background border-t border-border py-4 md:py-6 px-4 text-center text-muted-foreground text-xs md:text-sm">
        <p>© 2025 {APP_NAME} Delivery Platform | Privacy Policy | Contact Us</p>
      </footer>
    </div>
  )
}
