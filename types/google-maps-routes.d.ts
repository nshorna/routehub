/// <reference types="google.maps" />

declare global {
  interface Window {
    google: typeof google
    __googleMapsScriptLoaded?: boolean
    __googleMapsLoadCallbacks?: Set<() => void>
  }
}

/**
 * Routes API types for Google Maps JavaScript API
 * Note: These types are custom because @types/google.maps v3.58.1 doesn't include
 * the new Routes API types. These match the actual API structure.
 */

// Request types
export interface RoutesComputeRequest {
  origin: {
    location: {
      lat: number
      lng: number
    }
  }
  destination: {
    location: {
      lat: number
      lng: number
    }
  }
  travelMode: google.maps.TravelMode
  routingPreference?: string
  /**
   * Field mask - specifies which fields to return.
   * Use top-level field names like 'routes.legs', 'routes.duration', 'routes.polyline'
   * NOT nested paths like 'routes.legs.distanceMeters'
   */
  fields: string[]
}

// Response types
export interface RoutesComputeResponse {
  routes: RoutesRouteResult[]
}

export interface RoutesRouteResult {
  legs: RoutesRouteLeg[]
  polyline?: {
    encodedPolyline: string
  }
  distanceMeters?: number
  duration?: string
}

export interface RoutesRouteLeg {
  distanceMeters?: number
  duration?: string
  startLocation?: {
    lat: number
    lng: number
  }
  endLocation?: {
    lat: number
    lng: number
  }
}

// Library interface
export interface RoutesLibrary {
  Route: {
    computeRoutes(request: RoutesComputeRequest): Promise<RoutesComputeResponse>
  }
}
