"use client";

import * as RL from "react-leaflet";
import { useAppStore } from "@/store/useAppStore";

const MapContainer: any = RL.MapContainer;
const TileLayer: any = RL.TileLayer;
const Marker: any = RL.Marker;
const Popup: any = RL.Popup;

export default function BackgroundMap() {
  const { places, selectedPlace } = useAppStore();

  return (
    <div className="absolute inset-0 opacity-0 pointer-events-none">
      <MapContainer
        center={[12.9716, 77.5946]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {places.map((p: any, i: number) => (
          <Marker key={i} position={[p.lat, p.lng]}>
            <Popup>{p.name}</Popup>
          </Marker>
        ))}

        {selectedPlace && (
          <Marker position={[selectedPlace.lat, selectedPlace.lng]}>
            <Popup>Selected: {selectedPlace.name}</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}