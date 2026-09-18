"use client"

import { AdminNav } from "./admin-nav"
import { Eye, FileText, Calendar, Phone, Mail, Bike, Search } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { NotificationBanner } from "@/components/shared/notification-banner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useDebounce } from "@/hooks/use-debounce"
import Image from "next/image"

interface CourierApplication {
  id: string
  fullName: string
  phoneNumber: string
  email: string
  cardName: string
  cardNumber: string
  dateOfBirth: string
  licenseNumber: string
  licenseExpiration: string
  licenseImageUrl?: string
  hasSmartphone: boolean
  hasGhanaNumber: boolean
  profilePhotoUrl?: string
  status: "pending" | "approved" | "rejected"
  submittedAt: Date | string
  reviewedAt?: Date | string
  reviewedBy?: string
  notes?: string
}

export function CourierApplications() {
  const router = useRouter()
  const { getIdToken } = useAuth()
  const [applications, setApplications] = useState<CourierApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<"all" | "pending" | "approved" | "rejected">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null)

  // Debounce search query to avoid too many API calls
  const debouncedSearch = useDebounce(searchQuery, 300)

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true)
      const idToken = await getIdToken()
      if (!idToken) {
        throw new Error("Not authenticated")
      }

      const statusParam = activeFilter === "all" ? "" : activeFilter
      const searchParam = debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : ""
      const url = `/api/platform-admin/courier-applications?status=${statusParam}${searchParam}`

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch applications")
      }

      const data = await response.json()
      setApplications(data.applications)
    } catch (error) {
      console.error("Error fetching applications:", error)
      setNotification({
        message: "Failed to load courier applications",
        type: "error",
      })
    } finally {
      setLoading(false)
    }
  }, [activeFilter, debouncedSearch, getIdToken])

  useEffect(() => {
    fetchApplications()
  }, [fetchApplications])

  const getStatusBadge = (status: CourierApplication["status"]) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-accent text-accent-foreground">Pending</Badge>
      case "approved":
        return <Badge className="bg-primary text-primary-foreground">Approved</Badge>
      case "rejected":
        return <Badge className="bg-destructive text-destructive-foreground">Rejected</Badge>
    }
  }

  const pendingCount = applications.filter((a) => a.status === "pending").length
  const approvedCount = applications.filter((a) => a.status === "approved").length
  const rejectedCount = applications.filter((a) => a.status === "rejected").length

  return (
    <div className="flex h-screen bg-background">
      <AdminNav />

      <main className="flex-1 overflow-auto p-4 md:p-6">
        {notification && (
          <NotificationBanner
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        )}

        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-2">Courier Applications</h1>
            <p className="text-muted-foreground">Review and manage courier registration applications</p>
          </div>

          {/* Search Box */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by email, phone, name, Ghana card number, or license number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-4 mb-6 border-b border-border">
            <button
              onClick={() => setActiveFilter("all")}
              className={`px-4 py-1 font-semibold border-b-2 transition-colors text-sm ${activeFilter === "all"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
            >
              All ({applications.length})
            </button>
            <button
              onClick={() => setActiveFilter("pending")}
              className={`px-4 py-1 font-semibold border-b-2 transition-colors text-sm ${activeFilter === "pending"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setActiveFilter("approved")}
              className={`px-4 py-1 font-semibold border-b-2 transition-colors text-sm ${activeFilter === "approved"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
            >
              Approved ({approvedCount})
            </button>
            <button
              onClick={() => setActiveFilter("rejected")}
              className={`px-4 py-1 font-semibold border-b-2 transition-colors text-sm ${activeFilter === "rejected"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
            >
              Rejected ({rejectedCount})
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading applications...</p>
            </div>
          ) : (
            <>
              {/* Applications Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {applications.map((application) => (
                  <div key={application.id} className="bg-card rounded-lg border border-border p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/20 p-1 rounded-full">
                          {application.profilePhotoUrl ? <Image src={String(application.profilePhotoUrl)}
                            alt="Courier" className="rounded-full object-cover w-12 h-12"
                            width={48}
                            height={48} />
                            : <Bike className="w-12 h-12 text-primary" />}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">{application.fullName}</h3>
                          <p className="text-sm text-muted-foreground">Courier Applicant</p>
                        </div>
                      </div>
                      {getStatusBadge(application.status)}
                    </div>

                    <div className="space-y-3 mb-6 pb-6 border-b border-border">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <p className="text-sm text-foreground">{application.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <p className="text-sm text-foreground">{application.phoneNumber}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <p className="text-sm text-foreground">
                          Applied{" "}
                          {new Date(application.submittedAt).toLocaleDateString()}
                        </p>
                      </div>
                      {application.licenseNumber && (
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <p className="text-sm text-foreground">License: {application.licenseNumber}</p>
                        </div>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => router.push(`/platform-admin/courier-applications/${application.id}`)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                ))}
              </div>

              {applications.length === 0 && (
                <div className="text-center py-12">
                  <Bike className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {searchQuery
                      ? `No applications found matching "${searchQuery}"`
                      : `No ${activeFilter === "all" ? "" : activeFilter} applications found`}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
