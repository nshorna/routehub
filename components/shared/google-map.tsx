'use client'

import { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react'
import Script from 'next/script'
/// <reference types="google.maps" />

export interface GoogleMapProps {
  /** Center coordinates for the map */
  center?: { lat: number; lng: number }
  /** Initial zoom level (default: 15) */
  zoom?: number
  /** Map height (default: '400px') */
  height?: string
  /** Map width (default: '100%') */
  width?: string
  /** Whether the map is interactive (default: true) */
  interactive?: boolean
  /** Whether to allow clicking to select coordinates */
  allowClickToSelect?: boolean
  /** Whether the marker is draggable (only if allowClickToSelect is true) */
  draggableMarker?: boolean
  /** Whether to show controls (map type, street view, fullscreen) */
  showControls?: boolean
  /** Callback when coordinates are selected */
  onCoordinatesSelect?: (coords: { lat: number; lng: number }) => void
  /** Callback when map is ready */
  onMapReady?: (map: any) => void
  /** Whether to enable geocoding (reverse geocode selected coordinates) */
  enableGeocoding?: boolean
  /** Callback when address is geocoded */
  onAddressGeocoded?: (address: string) => void
  /** Custom marker position (if provided, will be shown instead of allowing selection) */
  markerPosition?: { lat: number; lng: number } | null
  /** Custom marker title */
  markerTitle?: string
  /** Pickup location for route display */
  pickupLocation?: { lat: number; lng: number } | null
  /** Dropoff location for route display */
  dropoffLocation?: { lat: number; lng: number } | null
  /** Whether to show route between pickup and dropoff */
  showRoute?: boolean
  /** Callback when route is calculated (receives distance in meters and duration in seconds) */
  onRouteCalculated?: (distance: number, duration: number) => void
  /** API key for Google Maps */
  apiKey?: string
  /** Additional className for the map container */
  className?: string
}

export interface GoogleMapRef {
  /** Get current map instance */
  getMap: () => google.maps.Map | null
  /** Pan to coordinates */
  panTo: (coords: { lat: number; lng: number }) => void
  /** Set zoom level */
  setZoom: (zoom: number) => void
  /** Get current location and pan to it */
  getCurrentLocation: () => Promise<{ lat: number; lng: number }>
  /** Set marker position programmatically */
  setMarkerPosition: (coords: { lat: number; lng: number } | null) => void
}

/**
 * Unified Google Maps component with proper initialization and cleanup
 * 
 * Features:
 * - Proper script loading (only loads once globally)
 * - View-only and interactive modes
 * - Click to select coordinates
 * - Draggable markers
 * - Get current location
 * - Geocoding support
 * - Proper cleanup on unmount
 */
export const GoogleMap = forwardRef<GoogleMapRef, GoogleMapProps>(({
  center = { lat: 5.6037, lng: -0.1870 }, // Default to Accra, Ghana
  zoom = 15,
  height = '400px',
  width = '100%',
  interactive = true,
  allowClickToSelect = false,
  draggableMarker = true,
  showControls = true,
  onCoordinatesSelect,
  onMapReady,
  enableGeocoding = false,
  onAddressGeocoded,
  markerPosition: externalMarkerPosition,
  markerTitle = 'Selected location',
  pickupLocation,
  dropoffLocation,
  showRoute = false,
  onRouteCalculated,
  apiKey,
  className = '',
}, ref) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markerRef = useRef<google.maps.Marker | null>(null)
  const pickupMarkerRef = useRef<google.maps.Marker | null>(null)
  const dropoffMarkerRef = useRef<google.maps.Marker | null>(null)
  const routePolylineRef = useRef<google.maps.Polyline | null>(null)
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null)
  const clickListenerRef = useRef<google.maps.MapsEventListener | null>(null)
  const dragListenerRef = useRef<google.maps.MapsEventListener | null>(null)
  const geocoderRef = useRef<google.maps.Geocoder | null>(null)
  const [isMapReady, setIsMapReady] = useState(false)
  const [isScriptLoaded, setIsScriptLoaded] = useState(false)
  const [internalMarkerPosition, setInternalMarkerPosition] = useState<{ lat: number; lng: number } | null>(null)

  // Use external marker position if provided, otherwise use internal state
  const markerPosition = externalMarkerPosition !== undefined ? externalMarkerPosition : internalMarkerPosition

  // Check if script is already loaded
  useEffect(() => {
    // Initialize callbacks set if it doesn't exist
    if (!window.__googleMapsLoadCallbacks) {
      window.__googleMapsLoadCallbacks = new Set()
    }

    // If script is already loaded, mark as ready immediately
    if (window.google?.maps && window.__googleMapsScriptLoaded) {
      setIsScriptLoaded(true)
      return
    }

    // If script is loading but not ready yet, add callback
    const callback = () => {
      setIsScriptLoaded(true)
    }
    window.__googleMapsLoadCallbacks.add(callback)

    return () => {
      window.__googleMapsLoadCallbacks?.delete(callback)
    }
  }, [])

  // Geocode coordinates
  const geocodeCoordinates = useCallback((lat: number, lng: number) => {
    if (!enableGeocoding || !geocoderRef.current) return

    geocoderRef.current.geocode(
      { location: { lat, lng } },
      (results: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
        if (status === 'OK' && results && results[0] && onAddressGeocoded) {
          onAddressGeocoded(results[0].formatted_address)
        }
      }
    )
  }, [enableGeocoding, onAddressGeocoded])

  // Update marker position
  const updateMarker = useCallback((lat: number, lng: number, shouldGeocode = true) => {
    if (!mapInstanceRef.current) return

    // Remove existing marker
    if (markerRef.current) {
      if (dragListenerRef.current) {
        window.google?.maps?.event?.removeListener(dragListenerRef.current)
        dragListenerRef.current = null
      }
      markerRef.current.setMap(null)
      markerRef.current = null
    }

    // Add new marker
    markerRef.current = new window.google.maps.Marker({
      position: { lat, lng },
      map: mapInstanceRef.current,
      draggable: allowClickToSelect && draggableMarker,
      title: markerTitle,
    })

    // Add drag listener if marker is draggable
    if (allowClickToSelect && draggableMarker) {
      dragListenerRef.current = markerRef.current.addListener('dragend', (e: any) => {
        const newLat = e.latLng.lat()
        const newLng = e.latLng.lng()
        setInternalMarkerPosition({ lat: newLat, lng: newLng })
        onCoordinatesSelect?.({ lat: newLat, lng: newLng })
        if (shouldGeocode) {
          geocodeCoordinates(newLat, newLng)
        }
      })
    }

    // Geocode if enabled
    if (shouldGeocode) {
      geocodeCoordinates(lat, lng)
    }
  }, [allowClickToSelect, draggableMarker, markerTitle, onCoordinatesSelect, geocodeCoordinates])

  // Initialize map
  const initializeMap = useCallback(() => {
    if (!mapRef.current || !window.google?.maps) return

    // Check if map instance already exists and is valid
    if (mapInstanceRef.current) {
      try {
        const mapDiv = mapInstanceRef.current.getDiv()
        if (mapDiv && mapDiv === mapRef.current) {
          // Map is still valid
          setIsMapReady(true)
          onMapReady?.(mapInstanceRef.current)
          return
        }
      } catch (e) {
        // Map instance is stale, clear it
        mapInstanceRef.current = null
      }
    }

    setIsMapReady(false)

    // Create map instance
    const map = new window.google.maps.Map(mapRef.current, {
      center: center,
      zoom: zoom,
      disableDefaultUI: !showControls,
      mapTypeControl: showControls,
      streetViewControl: showControls,
      fullscreenControl: showControls,
      gestureHandling: interactive ? 'greedy' : 'none',
    })

    mapInstanceRef.current = map

    // Initialize geocoder if needed
    if (enableGeocoding) {
      geocoderRef.current = new window.google.maps.Geocoder()
    }

    // Initialize directions service (always initialize, it's lightweight)
    directionsServiceRef.current = new window.google.maps.DirectionsService()

    // Add click listener if click-to-select is enabled
    if (allowClickToSelect) {
      clickListenerRef.current = map.addListener('click', (e: any) => {
        const lat = e.latLng.lat()
        const lng = e.latLng.lng()
        setInternalMarkerPosition({ lat, lng })
        onCoordinatesSelect?.({ lat, lng })
        updateMarker(lat, lng, true)
      })
    }

    // Set initial marker position if provided
    if (markerPosition) {
      updateMarker(markerPosition.lat, markerPosition.lng, true)
    }

    setIsMapReady(true)
    onMapReady?.(map)
  }, [
    center,
    zoom,
    interactive,
    showControls,
    allowClickToSelect,
    markerPosition,
    onCoordinatesSelect,
    onMapReady,
    enableGeocoding,
    updateMarker,
    showRoute,
  ])

  // Initialize map when script is loaded
  useEffect(() => {
    if (isScriptLoaded && window.google?.maps && mapRef.current) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        initializeMap()
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [isScriptLoaded, initializeMap])

  // Update pickup and dropoff markers and route
  const updatePickupDropoffMarkers = useCallback(() => {
    if (!isMapReady || !mapInstanceRef.current || !window.google?.maps) return

    // Remove existing markers
    if (pickupMarkerRef.current) {
      pickupMarkerRef.current.setMap(null)
      pickupMarkerRef.current = null
    }
    if (dropoffMarkerRef.current) {
      dropoffMarkerRef.current.setMap(null)
      dropoffMarkerRef.current = null
    }

    const bounds = new window.google.maps.LatLngBounds()
    let hasLocations = false

    // Add pickup marker
    if (pickupLocation) {
      pickupMarkerRef.current = new window.google.maps.Marker({
        position: pickupLocation,
        map: mapInstanceRef.current,
        title: 'Pickup Location',
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#34A853',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
        },
        label: {
          text: 'P',
          color: '#FFFFFF',
          fontSize: '12px',
          fontWeight: 'bold',
        },
      })
      bounds.extend(pickupLocation)
      hasLocations = true
    }

    // Add dropoff marker
    if (dropoffLocation) {
      dropoffMarkerRef.current = new window.google.maps.Marker({
        position: dropoffLocation,
        map: mapInstanceRef.current,
        title: 'Dropoff Location',
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#EA4335',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
        },
        label: {
          text: 'D',
          color: '#FFFFFF',
          fontSize: '12px',
          fontWeight: 'bold',
        },
      })
      bounds.extend(dropoffLocation)
      hasLocations = true
    }

    // Fit bounds to show both markers
    if (hasLocations) {
      mapInstanceRef.current.fitBounds(bounds)
      // Add padding to bounds
      const padding: google.maps.Padding = { top: 50, right: 50, bottom: 50, left: 50 }
      mapInstanceRef.current.fitBounds(bounds, padding)
    }

    // Draw route using legacy DirectionsService if both locations are available
    if (showRoute && pickupLocation && dropoffLocation) {
      // Initialize directions service if not already initialized
      if (!directionsServiceRef.current) {
        directionsServiceRef.current = new window.google.maps.DirectionsService()
      }
      // Remove existing route polyline
      if (routePolylineRef.current) {
        routePolylineRef.current.setMap(null)
        routePolylineRef.current = null
      }

      // Create directions request using legacy API
      // Note: Using DRIVING mode for motorcycle routing (motorcycles use the same road network as cars)
      const request: google.maps.DirectionsRequest = {
        origin: new window.google.maps.LatLng(pickupLocation.lat, pickupLocation.lng),
        destination: new window.google.maps.LatLng(dropoffLocation.lat, dropoffLocation.lng),
        travelMode: window.google.maps.TravelMode.DRIVING, // DRIVING mode is used for motorcycle routing
      }

      // Compute route using DirectionsService
      directionsServiceRef.current.route(request, (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK && result) {
          const route = result.routes[0]
          
          // Extract distance and duration from the route
          let totalDistance = 0
          let totalDuration = 0
          
          if (route.legs && route.legs.length > 0) {
            route.legs.forEach((leg) => {
              if (leg.distance && leg.distance.value) {
                totalDistance += leg.distance.value // value is in meters
              }
              if (leg.duration && leg.duration.value) {
                totalDuration += leg.duration.value // value is in seconds
              }
            })
          }

          // Call callback with distance and duration
          if (onRouteCalculated && totalDistance > 0 && totalDuration > 0) {
            onRouteCalculated(totalDistance, totalDuration)
          }

          // Render the route polyline on the map
          if (route.overview_polyline) {
            // Decode the polyline using Google Maps geometry library
            // overview_polyline is a string containing the encoded polyline
            if (window.google.maps.geometry && window.google.maps.geometry.encoding) {
              const decodedPath = window.google.maps.geometry.encoding.decodePath(route.overview_polyline)
              
              routePolylineRef.current = new window.google.maps.Polyline({
                path: decodedPath,
                geodesic: true,
                strokeColor: '#4285F4',
                strokeOpacity: 1.0,
                strokeWeight: 5,
                map: mapInstanceRef.current,
              })
            } else {
              console.warn('Geometry library not loaded. Please include "geometry" in the libraries parameter.')
            }
          }
        } else {
          console.error('Directions request failed:', status)
        }
      })
    }
  }, [isMapReady, pickupLocation, dropoffLocation, showRoute, onRouteCalculated])

  // Update marker when external marker position changes
  useEffect(() => {
    if (isMapReady && mapInstanceRef.current && externalMarkerPosition !== undefined) {
      if (externalMarkerPosition) {
        updateMarker(externalMarkerPosition.lat, externalMarkerPosition.lng, true)
      } else {
        // Remove marker if position is null
        if (markerRef.current) {
          if (dragListenerRef.current) {
            window.google?.maps?.event?.removeListener(dragListenerRef.current)
            dragListenerRef.current = null
          }
          markerRef.current.setMap(null)
          markerRef.current = null
        }
        setInternalMarkerPosition(null)
      }
    }
  }, [externalMarkerPosition, isMapReady, updateMarker])

  // Update pickup/dropoff markers when locations change or map becomes ready
  useEffect(() => {
    if (isMapReady && (pickupLocation || dropoffLocation)) {
      // Small delay to ensure directions services are initialized
      const timer = setTimeout(() => {
        updatePickupDropoffMarkers()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [pickupLocation, dropoffLocation, isMapReady, updatePickupDropoffMarkers])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        // Remove click listener
        if (clickListenerRef.current) {
          window.google?.maps?.event?.removeListener(clickListenerRef.current)
          clickListenerRef.current = null
        }

        // Remove marker and drag listener
        if (markerRef.current) {
          if (dragListenerRef.current) {
            window.google?.maps?.event?.removeListener(dragListenerRef.current)
            dragListenerRef.current = null
          }
          markerRef.current.setMap(null)
          markerRef.current = null
        }

        // Remove pickup/dropoff markers
        if (pickupMarkerRef.current) {
          pickupMarkerRef.current.setMap(null)
          pickupMarkerRef.current = null
        }
        if (dropoffMarkerRef.current) {
          dropoffMarkerRef.current.setMap(null)
          dropoffMarkerRef.current = null
        }

        // Remove route polyline
        if (routePolylineRef.current) {
          routePolylineRef.current.setMap(null)
          routePolylineRef.current = null
        }

        mapInstanceRef.current = null
      }

      geocoderRef.current = null
      directionsServiceRef.current = null
    }
  }, [])

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    getMap: () => mapInstanceRef.current,
    panTo: (coords: { lat: number; lng: number }) => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.panTo(coords)
      }
    },
    setZoom: (zoomLevel: number) => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setZoom(zoomLevel)
      }
    },
    getCurrentLocation: () => {
      return new Promise<{ lat: number; lng: number }>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation is not supported by your browser'))
          return
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            const coords = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            }
            resolve(coords)
          },
          (error) => {
            let errorMessage = 'Failed to get your location'
            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMessage = 'Location access denied. Please enable location permissions.'
                break
              case error.POSITION_UNAVAILABLE:
                errorMessage = 'Location information is unavailable.'
                break
              case error.TIMEOUT:
                errorMessage = 'Location request timed out.'
                break
            }
            reject(new Error(errorMessage))
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          }
        )
      })
    },
    setMarkerPosition: (coords: { lat: number; lng: number } | null) => {
      if (coords && isMapReady && mapInstanceRef.current) {
        updateMarker(coords.lat, coords.lng, true)
        setInternalMarkerPosition(coords)
      } else if (!coords && markerRef.current) {
        if (dragListenerRef.current) {
          window.google?.maps?.event?.removeListener(dragListenerRef.current)
          dragListenerRef.current = null
        }
        markerRef.current.setMap(null)
        markerRef.current = null
        setInternalMarkerPosition(null)
      }
    },
  }), [isMapReady, updateMarker])

  // Handle script load
  const handleScriptLoad = () => {
    if (!window.__googleMapsScriptLoaded) {
      window.__googleMapsScriptLoaded = true
      // Call all registered callbacks
      window.__googleMapsLoadCallbacks?.forEach(callback => callback())
      window.__googleMapsLoadCallbacks?.clear()
    }
  }

  const effectiveApiKey = apiKey || process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY
  const shouldLoadScript = effectiveApiKey && !window.__googleMapsScriptLoaded && typeof window !== 'undefined'
  // Include geometry library if route is needed (for polyline decoding)
  const libraries = showRoute ? '&libraries=geometry' : ''

  return (
    <>
      {shouldLoadScript && (
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${effectiveApiKey}${libraries}`}
          onLoad={handleScriptLoad}
          strategy="lazyOnload"
        />
      )}
      <div className={`relative ${className}`} style={{ width, height }}>
        {!isMapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
            <p className="text-muted-foreground">Loading map...</p>
          </div>
        )}
        <div ref={mapRef} className="w-full h-full" />
      </div>
    </>
  )
})

GoogleMap.displayName = 'GoogleMap'
