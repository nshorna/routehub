"use client"

import { AdminNav } from "./admin-nav"
import { CheckCircle, XCircle, FileText, Calendar, Phone, Mail, User, Bike, Smartphone, ArrowLeft } from "lucide-react"
import { useState, useEffect } from "react"
import { NotificationBanner } from "@/components/shared/notification-banner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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

export function CourierApplicationDetail() {
  const router = useRouter()
  const params = useParams()
  const { getIdToken } = useAuth()
  const [application, setApplication] = useState<CourierApplication | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null)
  const [notes, setNotes] = useState("")
  const [showNotesInput, setShowNotesInput] = useState(false)

  const applicationId = params.id as string

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        const idToken = await getIdToken()
        if (!idToken) {
          router.push("/platform-admin/courier-applications")
          return
        }

        const response = await fetch(`/api/platform-admin/courier-applications/${applicationId}`, {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch application")
        }

        const data = await response.json()
        setApplication(data.application)
        setNotes(data.application.notes || "")
      } catch (error) {
        console.error("Error fetching application:", error)
        setNotification({
          message: "Failed to load application details",
          type: "error",
        })
      } finally {
        setLoading(false)
      }
    }

    if (applicationId) {
      fetchApplication()
    }
  }, [applicationId, router, getIdToken])

  const handleStatusChange = async (newStatus: "approved" | "rejected") => {
    if (!application) return

    setUpdating(true)
    try {
      const idToken = await getIdToken()
      if (!idToken) {
        throw new Error("Not authenticated")
      }

      const response = await fetch(`/api/platform-admin/courier-applications/${applicationId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          status: newStatus,
          notes: notes || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update status")
      }

      const data = await response.json()
      setApplication(data.application)
      setNotification({
        message: `Application has been ${newStatus}!`,
        type: "success",
      })
      setShowNotesInput(false)
    } catch (error) {
      console.error("Error updating status:", error)
      setNotification({
        message: error instanceof Error ? error.message : "Failed to update status",
        type: "error",
      })
    } finally {
      setUpdating(false)
    }
  }

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

  if (loading) {
    return (
      <div className="flex h-screen bg-background">
        <AdminNav />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading application details...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!application) {
    return (
      <div className="flex h-screen bg-background">
        <AdminNav />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-12">
              <p className="text-muted-foreground">Application not found</p>
              <Button onClick={() => router.push("/platform-admin/courier-applications")} className="mt-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Applications
              </Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

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

        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => router.push("/platform-admin/courier-applications")}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Applications
            </Button>
            <h1 className="text-3xl font-bold text-foreground mb-2">Courier Application Details</h1>
            <p className="text-muted-foreground">Review application information and take action</p>
          </div>

          <div className="space-y-6">
            {/* Personal Details */}
            <div className="bg-card rounded-lg border border-border p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Personal Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Full Name</p>
                  <p className="text-foreground font-medium">{application.fullName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Email</p>
                  <p className="text-foreground font-medium">{application.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Phone Number</p>
                  <p className="text-foreground font-medium">{application.phoneNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Date of Birth</p>
                  <p className="text-foreground font-medium">
                    {application.dateOfBirth
                      ? new Date(application.dateOfBirth).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Ghana Card Details */}
            <div className="bg-card rounded-lg border border-border p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Ghana Card Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Name on Card</p>
                  <p className="text-foreground font-medium">{application.cardName || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Card Number</p>
                  <p className="text-foreground font-medium">{application.cardNumber || "N/A"}</p>
                </div>
              </div>
            </div>

            {/* Motorcycle License */}
            <div className="bg-card rounded-lg border border-border p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Bike className="w-5 h-5 text-primary" />
                Motorcycle License
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">License Number</p>
                  <p className="text-foreground font-medium">{application.licenseNumber || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Expiration Date</p>
                  <p className="text-foreground font-medium">
                    {application.licenseExpiration
                      ? new Date(application.licenseExpiration).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              </div>
              {application.licenseImageUrl && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">License Image</p>
                  <img
                    src={application.licenseImageUrl}
                    alt="License"
                    className="max-w-full h-48 object-contain border rounded-md"
                  />
                </div>
              )}
            </div>

            {/* Device Verification */}
            <div className="bg-card rounded-lg border border-border p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-primary" />
                Device Verification
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle
                    className={`w-5 h-5 ${application.hasSmartphone ? "text-primary" : "text-muted-foreground"}`}
                  />
                  <span
                    className={application.hasSmartphone ? "text-foreground" : "text-muted-foreground"}
                  >
                    Has Smartphone: {application.hasSmartphone ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle
                    className={`w-5 h-5 ${application.hasGhanaNumber ? "text-primary" : "text-muted-foreground"}`}
                  />
                  <span
                    className={application.hasGhanaNumber ? "text-foreground" : "text-muted-foreground"}
                  >
                    Has Ghana Phone Number: {application.hasGhanaNumber ? "Yes" : "No"}
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Photo */}
            {application.profilePhotoUrl && (
              <div className="bg-card rounded-lg border border-border p-6">
                <h3 className="text-lg font-semibold mb-4">Profile Photo</h3>
                <img
                  src={application.profilePhotoUrl}
                  alt="Profile"
                  className="w-32 h-32 object-cover border rounded-full"
                />
              </div>
            )}

            {/* Application Status */}
            <div className="bg-card rounded-lg border border-border p-6">
              <h3 className="text-lg font-semibold mb-4">Application Status</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Status</p>
                  <div>{getStatusBadge(application.status)}</div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Submitted</p>
                  <p className="text-foreground font-medium">
                    {new Date(application.submittedAt).toLocaleString()}
                  </p>
                </div>
                {application.reviewedAt && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Reviewed</p>
                    <p className="text-foreground font-medium">
                      {new Date(application.reviewedAt).toLocaleString()}
                      {application.reviewedBy && ` by ${application.reviewedBy}`}
                    </p>
                  </div>
                )}
                {application.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Notes</p>
                    <p className="text-foreground">{application.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            {application.status === "pending" && (
              <div className="bg-card rounded-lg border border-border p-6">
                <h3 className="text-lg font-semibold mb-4">Take Action</h3>
                {showNotesInput && (
                  <div className="mb-4">
                    <Label htmlFor="notes">Notes (optional)</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add any notes about this application..."
                      className="mt-2"
                    />
                  </div>
                )}
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleStatusChange("approved")}
                    disabled={updating}
                    className="flex-1"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => {
                      if (!showNotesInput) {
                        setShowNotesInput(true)
                      } else {
                        handleStatusChange("rejected")
                      }
                    }}
                    variant="destructive"
                    disabled={updating}
                    className="flex-1"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    {showNotesInput ? "Reject" : "Reject"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
