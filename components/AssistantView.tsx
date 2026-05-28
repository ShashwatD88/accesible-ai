"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";

// Define a type for a place with reviews and ratings
type PlaceWithReviews = {
  name: string;
  lat: number;
  lng: number;
  accessible: boolean;
  rating: number;
  reviewsCount: number;
  reviews: string[];
  imageUrl?: string;
  distance?: string;
};

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): string {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c; 
  return d.toFixed(1) + " km";
}

// Mock review snippets to randomly pick from
const MOCK_REVIEWS = [
  "Great atmosphere and very accessible!",
  "Loved the service, definitely coming back.",
  "Wheelchair access was perfect. Friendly staff.",
  "A bit crowded, but manageable. Good experience overall.",
  "Highly recommend this place to anyone.",
  "Clean, bright, and easy to navigate.",
  "Food was excellent, and the ramp was clearly marked.",
  "One of my favorite spots in town."
];

// Generate mock data for places
const generateMockDataForPlace = (place: any): PlaceWithReviews => {
  const rating = (Math.random() * (5.0 - 3.5) + 3.5).toFixed(1);
  const reviewsCount = Math.floor(Math.random() * 500) + 10;
  const numReviewsToPick = Math.floor(Math.random() * 2) + 1;
  const reviews: string[] = [];
  
  for (let i = 0; i < numReviewsToPick; i++) {
    const randomReview = MOCK_REVIEWS[Math.floor(Math.random() * MOCK_REVIEWS.length)];
    if (!reviews.includes(randomReview)) reviews.push(randomReview);
  }

  // Placeholder images based on keywords
  const nameLower = place.name.toLowerCase();
  let keyword = "building";
  if (nameLower.includes("coffee") || nameLower.includes("cafe")) keyword = "cafe";
  else if (nameLower.includes("restaurant") || nameLower.includes("food") || nameLower.includes("pizza")) keyword = "pizza,restaurant";
  else if (nameLower.includes("park")) keyword = "park";
  else if (nameLower.includes("hospital") || nameLower.includes("clinic")) keyword = "hospital";
  else if (nameLower.includes("grocery") || nameLower.includes("supermarket")) keyword = "grocery";

  return {
    ...place,
    rating: parseFloat(rating),
    reviewsCount,
    reviews,
    imageUrl: `https://loremflickr.com/400/300/${keyword}?lock=${Math.floor(Math.random() * 1000)}`
  };
};

export default function AssistantView() {
  const { chatMessages, addChatMessage, userLocation, setShowAssistantView, setSelectedCoords, setShowMap, setZoom, assistantPlacesList, setAssistantPlacesList, setPlaces } = useAppStore();
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const placesList = assistantPlacesList as PlaceWithReviews[];
  const setPlacesList = setAssistantPlacesList;
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const fetchPlaces = async (query: string, radius: number = 5000, targetLat?: number, targetLon?: number) => {
    // First try Nominatim
    const searchUrl = new URL("https://nominatim.openstreetmap.org/search");
    searchUrl.searchParams.append("format", "json");
    searchUrl.searchParams.append("q", query);
    searchUrl.searchParams.append("limit", "20");
    
    const centerLat = targetLat ?? userLocation?.[0];
    const centerLon = targetLon ?? userLocation?.[1];

    if (centerLat !== undefined && centerLon !== undefined) {
      searchUrl.searchParams.append("lat", centerLat.toString());
      searchUrl.searchParams.append("lon", centerLon.toString());
      
      if (radius) {
        // Radius is in meters. 1 degree latitude is approx 111,320 meters.
        const latDelta = radius / 111320;
        const lonDelta = radius / (111320 * Math.cos(centerLat * Math.PI / 180));
        // viewbox=<x1>,<y1>,<x2>,<y2> (left, top, right, bottom)
        const left = centerLon - lonDelta;
        const right = centerLon + lonDelta;
        const top = centerLat + latDelta;
        const bottom = centerLat - latDelta;
        
        searchUrl.searchParams.append("viewbox", `${left},${top},${right},${bottom}`);
        searchUrl.searchParams.append("bounded", "1");
      }
    }

    try {
      const res = await fetch(searchUrl.toString());
      const results = await res.json();
      
      if (results && results.length > 0) {
        let parsedPlaces = results.map((r: any) => ({
          name: r.display_name.split(",")[0],
          lat: parseFloat(r.lat),
          lng: parseFloat(r.lon),
          accessible: Math.random() > 0.3 // Randomize for mock data if not strictly available
        }));

        if (centerLat !== undefined && centerLon !== undefined) {
          // Sort by actual distance locally
          parsedPlaces.sort((a: any, b: any) => {
            const distA = parseFloat(calculateDistance(centerLat, centerLon, a.lat, a.lng));
            const distB = parseFloat(calculateDistance(centerLat, centerLon, b.lat, b.lng));
            return distA - distB;
          });
          
          // Relaxing filter: If places are outside radius, keep the closest ones anyway
          // We limit to top 10 nearest regardless of absolute radius to ensure UI isn't empty
          parsedPlaces = parsedPlaces.slice(0, 10);
        }

        // Augment with ratings & reviews
        const augmented = parsedPlaces.map((p: any) => {
          const m = generateMockDataForPlace(p);
          m.distance = (centerLat !== undefined && centerLon !== undefined) ? calculateDistance(centerLat, centerLon, p.lat, p.lng) : undefined;
          return m;
        });
        
        if (augmented.length > 0) {
          setPlacesList(augmented);
          setPlaces(augmented);
        } else {
          setPlacesList([]);
          addChatMessage({ role: "model", text: `I'm sorry, I couldn't find any "${query}" nearby. Try a broader search or a different location!` });
        }
      } else {
        setPlacesList([]);
        addChatMessage({ role: "model", text: `I'm sorry, I couldn't find any "${query}" nearby. Try a broader search or a different location!` });
      }
    } catch (err) {
      console.error("Geocoding failed", err);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMsg = { role: "user" as const, text: inputText };
    addChatMessage(userMsg);
    setInputText("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...chatMessages, userMsg], userLocation })
      });
      const data = await res.json();
      
      if (data.text) {
        addChatMessage({ role: "model", text: data.text });
      }
      
      if (data.action) {
        console.log("🤖 Chat triggered action:", data.action);
        
        if (data.action.action === "search_place") {
          if (data.action.places && data.action.places.length > 0) {
            // Use real data from Gemini
            const placesWithDist = data.action.places.map((p: any) => {
              const m = generateMockDataForPlace(p);
              return {
                ...m,
                accessible: true,
                distance: userLocation ? calculateDistance(userLocation[0], userLocation[1], p.lat, p.lng) : undefined
              };
            });
            setPlacesList(placesWithDist);
            setPlaces(placesWithDist);
          } else if (data.action.query) {
            let targetLat: number | undefined;
            let targetLon: number | undefined;

            if (data.action.location) {
              try {
                const geoUrl = new URL("https://nominatim.openstreetmap.org/search");
                geoUrl.searchParams.append("format", "json");
                geoUrl.searchParams.append("q", data.action.location);
                geoUrl.searchParams.append("limit", "1");
                const geoRes = await fetch(geoUrl.toString());
                const geoData = await geoRes.json();
                
                if (geoData && geoData.length > 0) {
                  targetLat = parseFloat(geoData[0].lat);
                  targetLon = parseFloat(geoData[0].lon);
                  
                  // Move map to the search target area
                  setSelectedCoords([targetLat, targetLon]);
                  setZoom(13);
                  setShowMap(true);
                  // We DO NOT close AssistantView here so they can see the side panel places!
                }
              } catch (err) {
                console.error("Failed to geocode location:", data.action.location);
              }
            }

            await fetchPlaces(data.action.query, data.action.radius || 5000, targetLat, targetLon);
          }
        } else if (data.action.action === "navigate") {
          // Find the specific city or location and go to it
          const searchUrl = new URL("https://nominatim.openstreetmap.org/search");
          searchUrl.searchParams.append("format", "json");
          searchUrl.searchParams.append("q", data.action.query);
          searchUrl.searchParams.append("limit", "1");
          
          const geoRes = await fetch(searchUrl.toString());
          const geoData = await geoRes.json();
          if (geoData && geoData.length > 0) {
            const lat = parseFloat(geoData[0].lat);
            const lon = parseFloat(geoData[0].lon);
            setSelectedCoords([lat, lon]);
            setZoom(13);
            setShowMap(true);
            setShowAssistantView(false);
          } else {
             addChatMessage({ role: "model", text: `I couldn't find ${data.action.query} on the map.` });
          }
        } else if (data.action.action === "plan_trip") {
          if (data.action.lat && data.action.lng) {
            setSelectedCoords([data.action.lat, data.action.lng]);
            setZoom(13);
            setShowMap(true);
          }
          if (data.action.places && data.action.places.length > 0) {
            const placesWithMockData = data.action.places.map((p: any) => {
               const m = generateMockDataForPlace(p);
               return { ...m, lat: p.lat, lng: p.lng, accessible: true };
            });
            setPlacesList(placesWithMockData);
            setPlaces(placesWithMockData);
          }
        }
      }
    } catch (err) {
      addChatMessage({ role: "model", text: "Oops, something went wrong!" });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper for rendering stars
  const renderStars = (rating: number) => {
    return (
      <div className="flex text-yellow-400">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star}>
            {rating >= star ? "★" : rating >= star - 0.5 ? "★" : "☆"}
          </span>
        ))}
      </div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-50 bg-gray-50 flex flex-col md:flex-row overflow-hidden font-outfit text-gray-800"
    >
      
      {/* 🔙 Back Button */}
      <motion.button 
        onClick={() => setShowAssistantView(false)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="absolute top-6 left-6 z-[60] bg-white shadow-lg text-blue-600 p-3 rounded-full flex items-center justify-center border border-gray-100 hover:shadow-xl transition-shadow"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
      </motion.button>

      {/* 🗨️ Left/Top Column: Conversational AI */}
      <div className="w-full md:w-1/2 h-1/2 md:h-full bg-white shadow-2xl z-10 flex flex-col border-b md:border-b-0 md:border-r border-gray-100 relative">
        {/* Header */}
        <div className="h-16 md:h-24 flex items-center px-4 md:px-10 border-b border-blue-200/40 shrink-0 ml-14 md:ml-16 bg-gradient-to-r from-white via-blue-50 to-blue-100/40">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mr-3 shadow-md shadow-blue-500/10">
            <span className="text-white text-lg md:text-xl">✨</span>
          </div>
          <div>
            <h1 className="text-lg md:text-2xl font-space-grotesk font-black text-black tracking-wider uppercase leading-none">
              accessible <span className="text-blue-600 font-extrabold">ai</span>
            </h1>
            <p className="text-[10px] md:text-xs font-outfit text-gray-500 tracking-wide uppercase mt-1">
              Your smart travel companion
            </p>
          </div>
        </div>

        {/* Chat Area */}
        <div 
          ref={scrollRef} 
          className="flex-1 overflow-y-auto p-4 md:p-10 space-y-4 md:space-y-6 scroll-smooth"
        >
          {chatMessages.map((msg, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div 
                className={`max-w-[85%] rounded-2xl md:rounded-3xl p-3 md:p-5 text-sm leading-relaxed shadow-sm ${
                  msg.role === "user" 
                    ? "bg-blue-600 text-white rounded-br-none" 
                    : "bg-gray-50 text-gray-800 rounded-bl-none border border-gray-100"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>
              </div>
            </motion.div>
          ))}
          
          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="bg-gray-50 text-gray-800 rounded-3xl rounded-bl-none p-5 px-6 border border-gray-100 shadow-sm">
                <div className="flex gap-2">
                  <span className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-bounce" />
                  <span className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-bounce delay-75" />
                  <span className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-bounce delay-150" />
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-8 border-t border-gray-100 bg-white shrink-0">
          <div className="relative flex items-center">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask me to find places..."
              className="w-full bg-gray-50 text-gray-900 border border-gray-200 rounded-full pl-4 md:pl-6 pr-14 py-3 md:py-4 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all text-base shadow-inner"
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !inputText.trim()}
              className="absolute right-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2.5 rounded-full shadow-md transition-all flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
            </button>
          </div>
        </div>
      </div>

      {/* 📍 Right/Bottom Column: Places & Reviews Feed */}
      <div className="w-full md:w-1/2 h-1/2 md:h-full bg-gray-50 overflow-y-auto p-4 md:p-10 pt-4 md:pt-10 custom-scrollbar">
        <AnimatePresence>
          {placesList.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="h-full flex flex-col items-center justify-center text-gray-400"
            >
              <div className="w-24 h-24 mb-6 text-gray-200">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
              </div>
              <p className="text-xl font-medium">Discover Places</p>
              <p className="text-sm mt-2 max-w-sm text-center">Ask the assistant to find places, and they'll appear here along with ratings and reviews.</p>
            </motion.div>
          ) : (
            <div className="space-y-4 md:space-y-8">
              <motion.h2 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6 flex justify-between items-center"
              >
                <span>Places</span>
                <button 
                  onClick={() => setShowAssistantView(false)}
                  className="px-3 py-1.5 md:px-4 md:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs md:text-sm font-semibold transition-colors shadow-sm"
                >
                  Show on Map
                </button>
              </motion.h2>
              {placesList.map((place, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex gap-3 md:gap-6">
                    {/* Place Image */}
                    <div className="w-20 h-20 md:w-32 md:h-32 bg-gray-200 rounded-xl md:rounded-2xl shrink-0 overflow-hidden relative">
                       {place.imageUrl ? (
                         <img src={place.imageUrl} alt={place.name} className="w-full h-full object-cover" />
                       ) : (
                         <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                           <span className="text-4xl opacity-50">📍</span>
                         </div>
                       )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                       <div className="flex justify-between items-start gap-2">
                         <h3 className="text-base md:text-xl font-bold text-gray-900 line-clamp-1">{place.name}</h3>
                        {place.accessible && (
                          <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-semibold flex items-center gap-1 shrink-0">
                            <span className="text-sm">♿</span> Accessible
                          </span>
                        )}
                      </div>
                      
                      {/* Ratings */}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {renderStars(place.rating)}
                        <span className="font-bold text-gray-700">{place.rating}</span>
                        <span className="text-gray-400 text-sm">({place.reviewsCount} reviews)</span>
                        {place.distance && (
                          <span className="text-blue-600 font-semibold text-sm ml-2 bg-blue-50 px-2 py-1 rounded-lg">
                            🚗 {place.distance}
                          </span>
                        )}
                      </div>

                      {/* Reviews Preview */}
                      <div className="mt-4 space-y-2">
                        {place.reviews.map((review, idx) => (
                          <div key={idx} className="flex gap-2">
                            <div className="w-6 h-6 rounded-full bg-gray-200 shrink-0 flex items-center justify-center text-xs font-bold text-gray-500">
                              {String.fromCharCode(65 + Math.floor(Math.random() * 26))}
                            </div>
                            <p className="text-sm text-gray-600 italic line-clamp-2">"{review}"</p>
                          </div>
                        ))}
                      </div>

                      {/* Actions */}
                       <div className="mt-3 md:mt-6 flex justify-end gap-2">
                         <button 
                           onClick={() => {
                             setSelectedCoords([place.lat, place.lng]);
                             setZoom(16);
                             setShowMap(true);
                             setShowAssistantView(false);
                           }}
                           className="px-3 py-2 md:px-5 md:py-2.5 bg-black hover:bg-gray-800 text-white rounded-xl text-xs md:text-sm font-semibold transition-colors"
                         >
                           View on Map
                         </button>
                       </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
