"use client";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import L from "leaflet";

// 🔵 USER LOCATION ICON (PULSE)
const userIcon = L.divIcon({
  className: "marker-user",
  html: `
    <div style="
      width:18px;
      height:18px;
      background:#3b82f6;
      border-radius:50%;
      border:3px solid white;
      box-shadow:0 0 12px rgba(59,130,246,0.9);
    "></div>
  `,
});

// 🔴 PLACE ICON GENERATOR
const getPlaceIcon = (index: number) => L.divIcon({
  className: "marker-place",
  html: `
    <div class="marker-falling" style="
      width:16px;
      height:16px;
      background:#ef4444;
      border-radius:50%;
      border:2px solid white;
      box-shadow:0 0 10px rgba(239,68,68,0.9);
      animation-delay: ${index * 0.1}s;
    "></div>
  `,
});

// 🟡 SELECTED ICON (PULSE)
const selectedIcon = L.divIcon({
  className: "marker-selected",
  html: `
    <div style="
      width:14px;
      height:14px;
      background:#facc15;
      border-radius:50%;
      border:2px solid white;
      box-shadow:0 0 10px rgba(250,204,21,0.9);
    "></div>
  `,
});

function MapClickHandler() {
  const setSelectedCoords = useAppStore((s) => s.setSelectedCoords);

  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setSelectedCoords([lat, lng]);
    },
  });

  return null;
}

function MapController() {
  const map = useMap();
  const { zoom, panMode, selectedCoords } = useAppStore();

  // Smooth zoom
  useEffect(() => {
    map.setZoom(zoom, { animate: true });
  }, [zoom, map]);

  // Fly to selected coordinates (snappy, not sluggish)
  useEffect(() => {
    if (selectedCoords) {
      map.flyTo(selectedCoords, zoom, { duration: 0.6, easeLinearity: 0.5 });
    }
  }, [selectedCoords, map]);

  // Continuous panning
  useEffect(() => {
    if (!panMode) return;

    const interval = setInterval(() => {
      const center = map.getCenter();
      const panStep = 0.002;

      if (panMode === "left") map.panTo([center.lat, center.lng - panStep]);
      if (panMode === "right") map.panTo([center.lat, center.lng + panStep]);
      if (panMode === "up") map.panTo([center.lat + panStep, center.lng]);
      if (panMode === "down") map.panTo([center.lat - panStep, center.lng]);
    }, 100);

    return () => clearInterval(interval);
  }, [panMode, map]);

  return null;
}

export default function MapView() {
  const {
    userLocation,
    places,
    showMap,
    zoom,
    selectedCoords,
  } = useAppStore();

  if (!showMap) return null;

  return (
    <div className="absolute inset-0 z-0">
      <MapContainer
        center={userLocation || [12.9716, 77.5946]}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <MapController />
        <MapClickHandler />

        {/* 🔵 USER */}
        {userLocation && (
          <Marker position={userLocation} icon={userIcon}>
            <Popup>You are here</Popup>
          </Marker>
        )}

        {/* 🟡 SELECTED */}
        {selectedCoords && (
          <Marker position={selectedCoords} icon={selectedIcon}>
            <Popup>Selected Location</Popup>
          </Marker>
        )}

        {/* 🟢 PLACES */}
        {places.map((p, i) => (
          <Marker key={i} position={[p.lat, p.lng]} icon={getPlaceIcon(i)}>
            <Popup>{p.name}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}