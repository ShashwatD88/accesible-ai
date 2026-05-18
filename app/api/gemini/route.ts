import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    console.log("🧠 USER:", text);

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `
You are an intelligent map assistant. You control an interactive map for a user.
The user will give you a command. You must parse their intent and return a JSON object describing the action to take.

Respond ONLY with valid JSON. Do not include markdown formatting.

Format:
{
  "action": "action_name",
  "message": "A short, friendly message to speak back to the user",
  "query": "optional search query (e.g. 'hospital', 'restaurant')",
  "radius": 5000, // optional search radius in meters (default to 5000 if user says 'nearby' or 'range of 5kms')
  "zoom": 12, // optional zoom level (1-18)
  "lat": 12.97, // optional exact latitude
  "lng": 77.59, // optional exact longitude
  "panDirection": "left" | "right" | "up" | "down" // optional
}

Allowed actions:
- show_map: Open the map
- hide_map: Close the map
- search_place: Find a specific location or type of place (MUST provide "query", e.g., "hospital" or "New York"). Also extract "radius" in meters if specified.
- zoom_in: Zoom closer
- zoom_out: Zoom out
- pan: Move the map (MUST provide "panDirection")
- stop_pan: Stop panning
- select_place: Select the currently highlighted place
- fly_to: Fly to exact coordinates (MUST provide "lat" and "lng")

User command: ${text}
                  `,
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await res.json();

    console.log("🟡 FULL GEMINI RESPONSE:", data);

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    console.log("🟢 RAW TEXT:", reply);

    // 🔥 EMPTY RESPONSE → fallback
    if (!reply) {
      console.log("⚠️ EMPTY → using fallback");
      return NextResponse.json(fallback(text));
    }

    const clean = reply
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    try {
      const parsed = JSON.parse(clean);
      console.log("✅ PARSED:", parsed);
      return NextResponse.json(parsed);
    } catch {
      console.log("⚠️ BAD JSON → using fallback:", clean);
      return NextResponse.json(fallback(text));
    }
  } catch (err) {
    console.error("🔥 API ERROR:", err);
    return NextResponse.json({ action: "unknown" });
  }
}

// 🔥 FALLBACK SYSTEM (ALWAYS WORKS)
function fallback(text: string) {
  text = text.toLowerCase();

  if (text.includes("zoom in")) return { action: "zoom_in", message: "Zooming in" };
  if (text.includes("zoom out")) return { action: "zoom_out", message: "Zooming out" };
  if (text.includes("open map") || text.includes("show map")) return { action: "show_map", message: "Opening the map" };
  if (text.includes("close map") || text.includes("hide map")) return { action: "hide_map", message: "Closing the map" };
  if (text.includes("find") || text.includes("search") || text.includes("nearby")) {
    let radius = 5000;
    if (text.includes("10km")) radius = 10000;
    else if (text.includes("1km")) radius = 1000;
    return { action: "search_place", query: text.replace("find me", "").replace("nearby", "").trim(), radius, message: "Searching for places" };
  }
  if (text.includes("left")) return { action: "pan", panDirection: "left", message: "Panning left" };
  if (text.includes("right")) return { action: "pan", panDirection: "right", message: "Panning right" };
  if (text.includes("stop")) return { action: "stop_pan", message: "Stopping" };
  if (text.includes("select")) return { action: "select_place", message: "Selecting place" };

  return { action: "unknown", message: "Command not recognized" };
}