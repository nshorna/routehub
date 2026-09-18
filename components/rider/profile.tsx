"use client"

import type React from "react"

import type { Rider } from "@/lib/types"
import { RiderNav } from "./rider-nav"
import { useState } from "react"
import { NotificationBanner } from "@/components/shared/notification-banner"
import { NotificationEnableButton } from "@/components/shared/notification-enable-button"

interface RiderProfileProps {
  rider: Rider
  updateProfile: (formData: FormData) => Promise<void>
}

type RiderProfileFormState = {
  name: string
  phone: string
  email: string
  bikeInfo: string
  ghanaCardName: string
  ghanaCardNumber: string
  dateOfBirth: string
  licenseNumber: string
  licenseExpiration: string
  hasSmartphone: boolean
  hasGhanaNumber: boolean
}

export function RiderProfile({ rider, updateProfile }: RiderProfileProps) {
  const [formData, setFormData] = useState<RiderProfileFormState>({
    name: rider.name || "",
    phone: rider.phone || "",
    email: rider.email || "",
    bikeInfo: rider.bikeInfo || "",
    ghanaCardName: rider.ghanaCardName || "",
    ghanaCardNumber: rider.ghanaCardNumber || "",
    dateOfBirth: rider.dateOfBirth || "",
    licenseNumber: rider.licenseNumber || "",
    licenseExpiration: rider.licenseExpiration || "",
    hasSmartphone: rider.hasSmartphone ?? false,
    hasGhanaNumber: rider.hasGhanaNumber ?? false,
  })

  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    setFormData((prev) => ({ ...prev, [name]: checked }))
  }

  const handleSubmit = () => {
    // Let the server action handle persistence; just show a local success message.
    setNotification({
      message: "Profile updated successfully!",
      type: "success",
    })
  }

  return (
    <div className="flex h-screen bg-background">
      <RiderNav />

      <main className="flex-1 overflow-auto p-4 md:p-6">
        {notification && (
          <NotificationBanner
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        )}

        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-2">Profile Settings</h1>
          <p className="text-muted-foreground mb-6">Update your personal, ID, and bike information</p>

          <form
            action={updateProfile}
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {/* Personal Information */}
            <div className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Personal Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full border border-border rounded-lg px-4 py-2 text-foreground bg-background focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full border border-border rounded-lg px-4 py-2 text-foreground bg-background focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full border border-border rounded-lg px-4 py-2 text-foreground bg-background focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Ghana Card Information */}
            <div className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Ghana Card Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Card Name</label>
                  <input
                    type="text"
                    name="ghanaCardName"
                    value={formData.ghanaCardName}
                    onChange={handleChange}
                    className="w-full border border-border rounded-lg px-4 py-2 text-foreground bg-background focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Card Number</label>
                  <input
                    type="text"
                    name="ghanaCardNumber"
                    value={formData.ghanaCardNumber}
                    onChange={handleChange}
                    className="w-full border border-border rounded-lg px-4 py-2 text-foreground bg-background focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Date of Birth</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className="w-full border border-border rounded-lg px-4 py-2 text-foreground bg-background focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Motorcycle License & Bike Information */}
            <div className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Motorcycle & License Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">License Number</label>
                  <input
                    type="text"
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleChange}
                    className="w-full border border-border rounded-lg px-4 py-2 text-foreground bg-background focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">License Expiration</label>
                  <input
                    type="date"
                    name="licenseExpiration"
                    value={formData.licenseExpiration}
                    onChange={handleChange}
                    className="w-full border border-border rounded-lg px-4 py-2 text-foreground bg-background focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Bike Details</label>
                  <input
                    type="text"
                    name="bikeInfo"
                    value={formData.bikeInfo}
                    onChange={handleChange}
                    placeholder="e.g., Honda CB150 - Blue"
                    className="w-full border border-border rounded-lg px-4 py-2 text-foreground bg-background focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Device Verification */}
            <div className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Device Verification</h2>
              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    name="hasSmartphone"
                    checked={formData.hasSmartphone}
                    onChange={handleCheckboxChange}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-foreground">I have a smartphone</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    name="hasGhanaNumber"
                    checked={formData.hasGhanaNumber}
                    onChange={handleCheckboxChange}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-foreground">I have an active Ghana phone number</span>
                </label>
              </div>
            </div>

            {/* Account Status (read-only) */}
            <div className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Account Status</h2>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-medium">Status:</span> {rider.status ?? "Unknown"}
                </p>
                <p>
                  <span className="font-medium">Online:</span> {rider.isOnline ? "Yes" : "No"}
                </p>
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Notifications</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Enable push notifications to receive updates about delivery requests and status changes.
              </p>
              <NotificationEnableButton />
            </div>

            {/* Save Button */}
            <button
              type="submit"
              className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              Save Changes
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
