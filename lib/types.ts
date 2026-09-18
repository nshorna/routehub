/* Mock data for all roles */

export interface Delivery {
  id: string
  orderId: string
  pickupAddress: string
  pickupLatitude?: number
  pickupLongitude?: number
  dropoffAddress: string
  dropoffLatitude?: number
  dropoffLongitude?: number
  fee: number
  status: "pending" | "picked-up" | "in-transit" | "delivered" | "cancelled"
  createdAt: Date
  riderId?: string
  riderName?: string
  customerId?: string
  customerPhone?: string
  sellerId?: string
  notes?: string
}

export interface Rider {
  id: string
  name: string
  phone: string
  email: string
  bikeInfo: string
  // Ghana Card Information
  ghanaCardName?: string
  ghanaCardNumber?: string
  dateOfBirth?: string
  // Motorcycle License Information
  licenseNumber?: string
  licenseExpiration?: string
  // Device Verification
  hasSmartphone?: boolean
  hasGhanaNumber?: boolean
  // Status
  status?: "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "INACTIVE" | "ACTIVE" | "SUSPENDED"
  earnings: number
  completedDeliveries: number
  isOnline: boolean
  currentLocation?: { lat: number; lng: number }
  pendingPayout: number
}

export interface Seller {
  id: string
  businessName: string
  contactName: string
  phone: string
  email: string
  pickupAddress: string
}

export interface User {
  id: string
  name: string
  email: string
  phone: string
  role: "rider" | "seller" | "customer" | "admin"
  status: "pending" | "approved" | "rejected"
  createdAt: Date
}

// Mock data arrays removed - all data now comes from the database

export interface CourierApplication {
  id: string
  // Personal Details
  fullName: string
  phoneNumber: string
  email: string
  // Ghana Card Details
  cardName: string
  cardNumber: string
  dateOfBirth: string
  // Motorcycle License
  licenseNumber: string
  licenseExpiration: string
  licenseImageUrl?: string
  // Device Verification
  hasSmartphone: boolean
  hasGhanaNumber: boolean
  // Profile Photo
  profilePhotoUrl?: string
  // Status
  status: "pending" | "approved" | "rejected"
  submittedAt: Date
  reviewedAt?: Date
  reviewedBy?: string
  notes?: string
}
