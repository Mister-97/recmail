'use client'

import { useEffect, useRef } from 'react'

type CallPin = {
  lat: number
  lng: number
  name: string | null
  service: string
  count: number
  recent: boolean
}

const PINS: CallPin[] = [
  { lat: 32.7555, lng: -97.3308, name: 'James Martinez',   service: 'AC repair',              count: 3, recent: true },
  { lat: 32.7490, lng: -97.3210, name: 'Maria Rodriguez',  service: 'Emergency leak',          count: 1, recent: true },
  { lat: 32.7620, lng: -97.3410, name: 'Tony Reyes',       service: 'HVAC replacement',        count: 2, recent: true },
  { lat: 32.7357, lng: -97.1081, name: 'David Martinez',   service: 'Furnace tune-up',         count: 4, recent: false },
  { lat: 32.7280, lng: -97.1150, name: 'Sarah Collins',    service: 'Heating tune-up',         count: 2, recent: false },
  { lat: 32.9343, lng: -97.2297, name: 'Linda Chen',       service: 'Water heater',            count: 2, recent: false },
  { lat: 32.8232, lng: -97.1888, name: 'Carlos Rivera',    service: 'AC install',              count: 6, recent: false },
  { lat: 32.8371, lng: -97.0819, name: 'Priya Sharma',     service: 'Electrical panel',        count: 1, recent: true },
  { lat: 32.8440, lng: -97.1436, name: 'David Kim',        service: 'Plumbing repair',         count: 2, recent: false },
  { lat: 32.9401, lng: -97.1336, name: null,               service: 'Roof repair',             count: 1, recent: true },
  { lat: 32.8050, lng: -97.2600, name: null,               service: 'Drain cleaning',          count: 1, recent: false },
  { lat: 32.7700, lng: -97.0500, name: null,               service: 'AC tune-up',              count: 1, recent: false },
  { lat: 32.8900, lng: -97.3100, name: null,               service: 'Pipe inspection',         count: 1, recent: true },
]

export default function ServiceAreaMap() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<unknown>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    import('leaflet').then(L => {
      // Fix default marker icons in webpack
      // @ts-ignore
      delete L.Icon.Default.prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(mapRef.current!, {
        center: [32.8100, -97.2200],
        zoom: 11,
        zoomControl: true,
        scrollWheelZoom: false,
      })

      mapInstanceRef.current = map

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap © CARTO',
        maxZoom: 19,
      }).addTo(map)

      PINS.forEach(pin => {
        const size = pin.count >= 4 ? 20 : pin.count >= 2 ? 16 : 12
        const color = pin.recent ? '#1a73e8' : '#6b7280'
        const borderColor = pin.recent ? '#1557b0' : '#4b5563'

        const icon = L.divIcon({
          className: '',
          html: `<div style="
            width:${size}px;height:${size}px;
            background:${color};
            border:2px solid ${borderColor};
            border-radius:50%;
            box-shadow:0 2px 6px rgba(0,0,0,0.3);
            opacity:0.9;
          "></div>`,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        })

        const marker = L.marker([pin.lat, pin.lng], { icon }).addTo(map)
        marker.bindPopup(`
          <div style="font-family:Inter,sans-serif;min-width:140px">
            <p style="font-weight:700;font-size:12px;margin:0 0 2px">${pin.name || 'Unknown caller'}</p>
            <p style="font-size:11px;color:#6b7280;margin:0 0 4px">${pin.service}</p>
            <span style="font-size:10px;font-weight:600;color:${pin.recent ? '#1a73e8' : '#6b7280'};background:${pin.recent ? '#e8f0fe' : '#f3f4f6'};padding:2px 6px;border-radius:999px">
              ${pin.count} call${pin.count > 1 ? 's' : ''} · ${pin.recent ? 'Recent' : 'Past'}
            </span>
          </div>
        `, { offset: [0, -6] })
      })
    })

    return () => {
      if (mapInstanceRef.current) {
        // @ts-ignore
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    import('leaflet/dist/leaflet.css')
  }, [])

  return <div ref={mapRef} className="w-full h-full rounded-xl" />
}
