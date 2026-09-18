"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Navigation, MapPin, Clock, ArrowRight, X, CheckCircle2, Phone } from "lucide-react"
import { useState, useEffect } from "react"

export interface TurnByTurnStep {
  instruction: string
  distance: string
  duration: string
  maneuver?: string
}

export interface DrivingModeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  destination: string
  destinationType: "pickup" | "delivery"
  currentLocation?: { lat: number; lng: number } | null
  destinationLocation?: { lat: number; lng: number } | null
  steps: TurnByTurnStep[]
  distance: string
  duration: string
  onGetDirections?: () => void
  onConfirmArrival?: () => void
  onCall?: () => void
  phoneNumber?: string
  confirmationPin?: string
  isLoading?: boolean
}

export function DrivingModeDialog({
  open,
  onOpenChange,
  destination,
  destinationType,
  steps,
  distance,
  duration,
  onGetDirections,
  onConfirmArrival,
  onCall,
  phoneNumber,
  confirmationPin,
  isLoading = false,
}: DrivingModeDialogProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isNavigating, setIsNavigating] = useState(false)

  // Reset step index when dialog opens or destination changes
  useEffect(() => {
    if (open) {
      setCurrentStepIndex(0)
      setIsNavigating(false)
    }
  }, [open, destination])

  const currentStep = steps[currentStepIndex] || steps[0]
  const isLastStep = currentStepIndex >= steps.length - 1

  const handleNextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1)
    }
  }

  const handlePreviousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1)
    }
  }

  const handleStartNavigation = () => {
    setIsNavigating(true)
    onGetDirections?.()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-full w-full h-full md:h-auto md:max-w-2xl md:max-h-[90vh] p-0 gap-0"
        showCloseButton={!isNavigating}
      >
        {!isNavigating ? (
          // Pre-navigation view
          <div className="flex flex-col h-full md:h-auto">
            <DialogHeader className="px-6 pt-6 pb-4 border-b">
              <DialogTitle className="text-2xl font-bold">
                {destinationType === "pickup" ? "Navigate to Pickup" : "Navigate to Delivery"}
              </DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
              {/* Destination Info */}
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground mb-1">
                      {destinationType === "pickup" ? "Pickup Location" : "Delivery Location"}
                    </p>
                    <p className="text-base font-semibold break-words">{destination}</p>
                  </div>
                </div>
              </div>

              {/* Route Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-card border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Navigation className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Distance</span>
                  </div>
                  <p className="text-2xl font-bold">{distance}</p>
                </div>
                <div className="bg-card border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Estimated Time</span>
                  </div>
                  <p className="text-2xl font-bold">{duration}</p>
                </div>
              </div>

              {/* Turn-by-turn Preview */}
              {steps.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3">Route Overview</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {steps.slice(0, 5).map((step, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 bg-card border rounded-lg"
                      >
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{step.instruction}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {step.distance} • {step.duration}
                          </p>
                        </div>
                      </div>
                    ))}
                    {steps.length > 5 && (
                      <p className="text-xs text-muted-foreground text-center py-2">
                        +{steps.length - 5} more steps
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Confirmation PIN (if available) */}
              {confirmationPin && (
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-xs text-muted-foreground mb-2">
                    {destinationType === "pickup"
                      ? "Pickup Confirmation PIN"
                      : "Delivery Confirmation PIN"}
                  </p>
                  <p className="text-3xl font-mono font-bold text-blue-700 dark:text-blue-400 text-center tracking-widest">
                    {confirmationPin}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    {destinationType === "pickup"
                      ? "Share with seller to confirm pickup"
                      : "Share with customer to confirm delivery"}
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="border-t px-6 py-4 space-y-3">
              {onCall && phoneNumber && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={onCall}
                >
                  <Phone className="w-4 h-4" />
                  <span>Call {destinationType === "pickup" ? "Seller" : "Customer"}</span>
                </Button>
              )}
              <Button
                className="w-full text-lg py-6"
                onClick={handleStartNavigation}
                disabled={isLoading}
              >
                <Navigation className="w-5 h-5" />
                <span>{isLoading ? "Loading..." : "Start Navigation"}</span>
              </Button>
            </div>
          </div>
        ) : (
          // Driving mode view - immersive navigation
          <div className="flex flex-col h-full md:h-[600px] bg-gradient-to-b from-background to-muted/20">
            {/* Header with close button */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-medium">Navigating</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsNavigating(false)}
                className="h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Main navigation content */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 space-y-6">
              {/* Current instruction - Large and prominent */}
              <div className="text-center space-y-4 w-full">
                <div className="text-6xl md:text-7xl font-bold text-primary mb-4">
                  {currentStepIndex + 1}
                </div>
                <h2 className="text-2xl md:text-3xl font-bold leading-tight px-4">
                  {currentStep?.instruction || "Continue straight"}
                </h2>
                <div className="flex items-center justify-center gap-4 text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Navigation className="w-4 h-4" />
                    <span className="text-lg font-semibold">{currentStep?.distance || distance}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-lg font-semibold">{currentStep?.duration || duration}</span>
                  </div>
                </div>
              </div>

              {/* Step navigation */}
              {steps.length > 1 && (
                <div className="flex items-center gap-4 w-full max-w-md">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handlePreviousStep}
                    disabled={currentStepIndex === 0}
                    className="flex-1"
                  >
                    Previous
                  </Button>
                  <div className="text-sm text-muted-foreground">
                    {currentStepIndex + 1} of {steps.length}
                  </div>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleNextStep}
                    disabled={isLastStep}
                    className="flex-1"
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>

            {/* Bottom action bar */}
            <div className="border-t bg-background/95 backdrop-blur px-4 py-4 space-y-3">
              {/* Route summary */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground truncate flex-1">{destination}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold">{distance}</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="font-semibold">{duration}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-3">
                {onCall && phoneNumber && (
                  <Button
                    variant="outline"
                    onClick={onCall}
                    className="w-full"
                  >
                    <Phone className="w-4 h-4" />
                    <span className="hidden sm:inline">Call</span>
                  </Button>
                )}
                {onConfirmArrival && (
                  <Button
                    onClick={onConfirmArrival}
                    className="w-full"
                    size="lg"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>I've Arrived</span>
                  </Button>
                )}
                {!onConfirmArrival && (
                  <Button
                    variant="outline"
                    onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`, "_blank")}
                    className="w-full"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>Open Maps</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

