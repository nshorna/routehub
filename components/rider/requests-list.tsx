"use client"

import { useEffect, useState } from "react"
import type { Delivery } from "@/lib/types"
import { RiderNav } from "./rider-nav"
import { MapPin, DollarSign, ChevronRight } from "lucide-react"
import Link from "next/link"

interface RequestsListProps {
  requests: Delivery[]
}

export function RequestsList({ requests: initialRequests }: RequestsListProps) {
  const [requests, setRequests] = useState<Delivery[]>(initialRequests)

  // Periodically refresh available delivery requests so rider doesn't have to reload.
  useEffect(() => {
    let isMounted = true

    const fetchRequests = async () => {
      try {
        const response = await fetch("/api/rider/requests", {
          cache: "no-store",
        })

        if (!response.ok) return

        const data: Delivery[] = await response.json()
        if (isMounted) {
          setRequests(data)
        }
      } catch (error) {
        console.error("Failed to refresh rider requests", error)
      }
    }

    // Initial refresh to ensure freshest data on mount
    fetchRequests()

    const intervalId = setInterval(fetchRequests, 15000) // 15 seconds

    return () => {
      isMounted = false
      clearInterval(intervalId)
    }
  }, [])
  return (
    <div className="flex flex-col md:flex-row h-screen bg-background">
      <RiderNav />

      <main className="flex-1 overflow-auto p-4 md:p-6 mt-16 md:mt-0">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">New Delivery Requests</h1>
          <p className="text-sm md:text-base text-muted-foreground mb-6">{requests.length} available deliveries</p>


          {requests.length === 0 ? (
            <div className="bg-card rounded-lg border border-border p-8 text-center">
              <p className="text-muted-foreground">No delivery requests available at this time.</p>
            </div>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {requests.map((request) => (
                <Link
                  key={request.id}
                  href={`/rider/requests/${request.id}`}
                  className="block bg-card rounded-lg border border-border p-4 md:p-6 transition-all hover:border-primary hover:shadow-md"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
                    {/* Pickup */}
                    <div>
                      <div className="flex items-start gap-3">
                        <div className="bg-primary rounded-full p-2 flex-shrink-0">
                          <MapPin className="w-4 h-4 text-primary-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs md:text-sm font-medium text-muted-foreground">Pickup Location</p>
                          <p className="text-sm md:text-base text-foreground font-semibold break-words">
                            {request.pickupAddress}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Dropoff */}
                    <div>
                      <div className="flex items-start gap-3">
                        <div className="bg-destructive rounded-full p-2 flex-shrink-0">
                          <MapPin className="w-4 h-4 text-destructive-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs md:text-sm font-medium text-muted-foreground">Dropoff Location</p>
                          <p className="text-sm md:text-base text-foreground font-semibold break-words">
                            {request.dropoffAddress}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Fee and Order ID - responsive grid */}
                  <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6 pb-4 md:pb-6 border-b border-border">
                    <div>
                      <p className="text-xs md:text-sm text-muted-foreground mb-1">Order ID</p>
                      <p className="text-sm md:text-base text-foreground font-semibold">{request.orderId}</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <DollarSign className="w-4 h-4 md:w-5 md:h-5 text-primary flex-shrink-0 mt-1" />
                      <div className="min-w-0">
                        <p className="text-xs md:text-sm text-muted-foreground mb-1">Delivery Fee</p>
                        <p className="text-lg md:text-2xl font-bold text-foreground">${request.fee.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>

                  {/* View Details Link */}
                  <div className="flex items-center justify-between text-primary hover:text-primary/80 transition-colors">
                    <span className="text-sm md:text-base font-semibold">View Details</span>
                    <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
