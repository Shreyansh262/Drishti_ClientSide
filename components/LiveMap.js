"use client"
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api"

const containerStyle = {
  width: "100%",
  height: "300px"
}

export default function LocationMap({ lat, lng }) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY // Set in .env.local
  })

  const center = { lat, lng }

  return isLoaded ? (
    <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={15}>
      <Marker position={center} />
    </GoogleMap>
  ) : (
    <div>Loading map...</div>
  )
}
