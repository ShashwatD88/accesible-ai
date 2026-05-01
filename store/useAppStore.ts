import { create } from "zustand";

type Place = {
  name: string;
  lat: number;
  lng: number;
  accessible: boolean;
};

export type IntentAction = {
  action: string;
  query?: string;
  zoom?: number;
  lat?: number;
  lng?: number;
  message?: string;
  panDirection?: "left" | "right" | "up" | "down";
};

type IntentType = {
  data: IntentAction;
  time: number;
};

// 🔥 LOAD FROM LOCAL STORAGE
function loadPlaces(): Place[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem("places");
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// 🔥 SAVE TO LOCAL STORAGE
function savePlaces(places: Place[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem("places", JSON.stringify(places));
}

interface AppState {
  intent: IntentType | null;
  setIntent: (intent: IntentAction) => void;

  places: Place[];
  setPlaces: (places: Place[]) => void;

  selectedPlace: Place | null;
  selectPlace: (place: Place) => void;

  selectedCoords: [number, number] | null;
  setSelectedCoords: (c: [number, number] | null) => void;

  showMap: boolean;
  setShowMap: (value: boolean) => void;

  showPlacesPanel: boolean;
  setShowPlacesPanel: (v: boolean) => void;

  currentIndex: number;
  setIndex: (i: number) => void;

  userLocation: [number, number] | null;
  setUserLocation: (loc: [number, number]) => void;

  zoom: number;
  setZoom: (z: number | ((prev: number) => number)) => void;

  panMode: "left" | "right" | "up" | "down" | null;
  setPanMode: (m: "left" | "right" | "up" | "down" | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  intent: null,
  setIntent: (data) =>
    set({ intent: { data, time: Date.now() } }),

  // 🔥 LOAD SAVED DATA HERE
  places: loadPlaces(),

  // 🔥 SAVE ON UPDATE
  setPlaces: (places) => {
    savePlaces(places);
    set({ places });
  },

  selectedPlace: null,
  selectPlace: (place) => set({ selectedPlace: place }),

  selectedCoords: null,
  setSelectedCoords: (c) => set({ selectedCoords: c }),

  showMap: false,
  setShowMap: (value) => set({ showMap: value }),

  showPlacesPanel: false,
  setShowPlacesPanel: (v) => set({ showPlacesPanel: v }),

  currentIndex: 0,
  setIndex: (i) => set({ currentIndex: i }),

  userLocation: null,
  setUserLocation: (loc) => set({ userLocation: loc }),

  zoom: 15,
  setZoom: (z) =>
    set((state) => ({
      zoom: typeof z === "function" ? z(state.zoom) : z,
    })),

  panMode: null,
  setPanMode: (m) => set({ panMode: m }),
}));