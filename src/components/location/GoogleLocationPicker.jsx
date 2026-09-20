import { useState, useEffect, useRef } from 'react'
import { Input } from '../ui/Input'

const DEFAULT_CENTER = { lat: 8.8932, lng: 76.6141 } // Kollam, Kerala default

export default function GoogleLocationPicker({
  location = '',
  latitude = null,
  longitude = null,
  onChange = () => {},
  error = null,
  label = 'Location',
  required = true,
}) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerInstanceRef = useRef(null)
  const geocoderInstanceRef = useRef(null)

  const [mapsLoaded, setMapsLoaded] = useState(false)
  const [detectingLocation, setDetectingLocation] = useState(false)
  const [geoError, setGeoError] = useState(null)
  const [isDetectedView, setIsDetectedView] = useState(latitude !== null && longitude !== null)

  // 1. Silently load Google Maps JS API in background if API key exists
  useEffect(() => {
    if (!apiKey) return

    if (window.google && window.google.maps) {
      setMapsLoaded(true)
      return
    }

    const existingScript = document.getElementById('google-maps-js-api')
    if (existingScript) {
      existingScript.addEventListener('load', () => setMapsLoaded(true))
      return
    }

    try {
      const script = document.createElement('script')
      script.id = 'google-maps-js-api'
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places`
      script.async = true
      script.defer = true
      script.onload = () => setMapsLoaded(true)
      script.onerror = (err) => {
        console.warn('Google Maps API script load notice:', err)
      }
      document.head.appendChild(script)
    } catch (err) {
      console.warn('Google Maps script injection notice:', err)
    }
  }, [apiKey])

  // 2. Initialize Google Map & Marker when in Detected View & Maps API is loaded
  useEffect(() => {
    if (!isDetectedView || !mapsLoaded || !mapRef.current || !window.google) return

    const currentLat = latitude !== null ? Number(latitude) : DEFAULT_CENTER.lat
    const currentLng = longitude !== null ? Number(longitude) : DEFAULT_CENTER.lng
    const currentCenter = { lat: currentLat, lng: currentLng }

    const map = new window.google.maps.Map(mapRef.current, {
      center: currentCenter,
      zoom: 15,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
    })
    mapInstanceRef.current = map

    const marker = new window.google.maps.Marker({
      position: currentCenter,
      map: map,
      draggable: true,
      animation: window.google.maps.Animation.DROP,
    })
    markerInstanceRef.current = marker

    geocoderInstanceRef.current = new window.google.maps.Geocoder()

    // Map Click Handler
    const clickListener = map.addListener('click', (e) => {
      const lat = e.latLng.lat()
      const lng = e.latLng.lng()
      marker.setPosition({ lat, lng })
      reverseGeocode(lat, lng)
    })

    // Marker Drag Handler
    const dragListener = marker.addListener('dragend', () => {
      const pos = marker.getPosition()
      if (pos) {
        const lat = pos.lat()
        const lng = pos.lng()
        reverseGeocode(lat, lng)
      }
    })

    return () => {
      if (clickListener) window.google.maps.event.removeListener(clickListener)
      if (dragListener) window.google.maps.event.removeListener(dragListener)
    }
  }, [isDetectedView, mapsLoaded, latitude, longitude])

  // Helper for Reverse Geocoding
  const reverseGeocode = (lat, lng) => {
    if (geocoderInstanceRef.current) {
      geocoderInstanceRef.current.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          onChange({ location: results[0].formatted_address, latitude: lat, longitude: lng })
        } else {
          onChange({ location: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, latitude: lat, longitude: lng })
        }
      })
    } else {
      onChange({ location: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, latitude: lat, longitude: lng })
    }
  }

  // 3. Handle Auto Detect Button Click
  const handleDetectLocation = () => {
    setGeoError(null)

    if (typeof window === 'undefined' || !navigator || !navigator.geolocation) {
      setGeoError("Location detection isn't supported by this browser. Please enter your location manually.")
      return
    }

    setDetectingLocation(true)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude

        setDetectingLocation(false)
        setIsDetectedView(true)

        // Try reverse geocoding if Maps JS loaded
        if (window.google && window.google.maps && window.google.maps.Geocoder) {
          const geocoder = new window.google.maps.Geocoder()
          geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            const readableAddr = (status === 'OK' && results && results[0])
              ? results[0].formatted_address
              : `${lat.toFixed(4)}, ${lng.toFixed(4)}`
            onChange({ location: readableAddr, latitude: lat, longitude: lng })
          })
        } else {
          const readableAddr = `${lat.toFixed(4)}, ${lng.toFixed(4)}`
          onChange({ location: readableAddr, latitude: lat, longitude: lng })
        }
      },
      (err) => {
        setDetectingLocation(false)
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError('Location permission was denied. Please enter your location manually.')
        } else {
          setGeoError('Unable to detect your location. Please enter it manually.')
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }

  // Handle Switch Back to Manual Selection
  const handleResetLocationMode = () => {
    setIsDetectedView(false)
    setGeoError(null)
    onChange({ location: '', latitude: null, longitude: null })
  }

  // ------------------------------------------------------------------
  // VIEW B: DETECTED LOCATION VIEW (After successful detection)
  // ------------------------------------------------------------------
  if (isDetectedView) {
    return (
      <div className="space-y-4 p-4 md:p-5 rounded-xl border border-teal-200 bg-teal-50/20 shadow-2xs">
        <div className="flex items-center justify-between border-b border-teal-200/60 pb-3">
          <div>
            <h4 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
              <span className="text-teal-700">📍</span> Detected Location
            </h4>
            <p className="text-xs text-stone-500 mt-0.5">
              You can confirm or edit the address text below.
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetLocationMode}
            className="inline-flex items-center gap-1 text-xs font-semibold text-teal-800 hover:text-teal-900 hover:underline cursor-pointer"
          >
            <span>↩ Use a different location</span>
          </button>
        </div>

        {/* Editable detected address input */}
        <Input
          label="Detected address:"
          placeholder="Example: Kalamassery, Ernakulam"
          value={location}
          onChange={(e) => {
            onChange({
              location: e.target.value,
              latitude: latitude,
              longitude: longitude,
            })
          }}
          error={error}
        />

        {/* Google Map Container if loaded */}
        {mapsLoaded ? (
          <div className="relative rounded-xl border border-stone-200 overflow-hidden shadow-xs bg-stone-100">
            <div ref={mapRef} className="w-full h-56 sm:h-64" />
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-stone-100 border border-stone-200 text-xs text-stone-600">
            <span>Location detected successfully.</span>
          </div>
        )}
      </div>
    )
  }

  // ------------------------------------------------------------------
  // VIEW A: INITIAL CHOICE VIEW (Two Clearly Separate Options)
  // ------------------------------------------------------------------
  return (
    <div className="space-y-4">
      {label && (
        <label className="block text-sm font-semibold text-stone-900">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* OPTION 1 — MANUAL INPUT */}
      <div className="p-4 md:p-5 rounded-xl border border-stone-200 bg-white shadow-2xs space-y-2.5">
        <div className="flex items-center gap-2">
          <span className="text-sm">✍️</span>
          <h4 className="text-sm font-bold text-stone-900">Enter location manually</h4>
        </div>
        <Input
          placeholder="Enter address, place, landmark, city..."
          value={location}
          onChange={(e) => {
            onChange({
              location: e.target.value,
              latitude: null,
              longitude: null,
            })
          }}
          error={error}
        />
        <p className="text-[11px] text-stone-500">
          Type any address or place name directly. Works without maps or location permissions.
        </p>
      </div>

      {/* OR DIVIDER */}
      <div className="relative flex items-center justify-center my-3">
        <div className="border-t border-stone-200 w-full" />
        <span className="bg-stone-50 px-4 text-[11px] font-bold text-stone-400 uppercase tracking-widest absolute">
          OR
        </span>
      </div>

      {/* OPTION 2 — AUTO DETECT */}
      <div className="p-4 md:p-5 rounded-xl border border-teal-200/80 bg-teal-50/20 shadow-2xs space-y-3">
        <div>
          <h4 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
            <span className="text-teal-700">📍</span> Detect my current location
          </h4>
          <p className="text-xs text-stone-600 mt-1">
            Use your device's location to automatically find where you are.
          </p>
        </div>

        <button
          type="button"
          onClick={handleDetectLocation}
          disabled={detectingLocation}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-teal-700/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>{detectingLocation ? 'Detecting your location...' : '📍 Detect my current location'}</span>
        </button>

        {geoError && (
          <p className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200 font-medium">
            {geoError}
          </p>
        )}
      </div>
    </div>
  )
}
