"use client"

import type React from "react"

import type { Seller } from "@/lib/types"
import { SellerNav } from "./seller-nav"
import { useState } from "react"
import { NotificationBanner } from "@/components/shared/notification-banner"
import { NotificationEnableButton } from "@/components/shared/notification-enable-button"
import { Copy, Check } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

interface SellerProfileProps {
  seller: Seller
}

export function SellerProfile({ seller }: SellerProfileProps) {
  const router = useRouter()
  const { signOut } = useAuth()
  const [formData, setFormData] = useState({
    businessName: seller.businessName,
    contactName: seller.contactName,
    phone: seller.phone,
    email: seller.email,
  })

  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setNotification({
      message: "Store profile updated successfully!",
      type: "success",
    })
  }

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(seller.pickupAddress)
    setCopiedField("address")
    setTimeout(() => setCopiedField(null), 2000)
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
    <div className="flex h-screen bg-background">
      <SellerNav onLogout={handleLogout} />

      <main className="flex-1 overflow-auto p-4 md:p-6">
        {notification && (
          <NotificationBanner
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        )}

        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-2">Store Profile</h1>
          <p className="text-muted-foreground mb-6">Manage your business information</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Business Information */}
            <div className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Business Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Business Name</label>
                  <input
                    type="text"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleChange}
                    className="w-full border border-border rounded-lg px-4 py-2 text-foreground bg-background focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Contact Name</label>
                  <input
                    type="text"
                    name="contactName"
                    value={formData.contactName}
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

            {/* Pickup Address (Fixed) */}
            <div className="bg-primary/10 border border-primary rounded-lg p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Default Pickup Address</h2>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-foreground font-semibold text-lg">{seller.pickupAddress}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    This is your fixed pickup location for all deliveries
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyAddress}
                  className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                >
                  {copiedField === "address" ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Notifications</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Enable push notifications to receive updates about new orders and delivery status changes.
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
