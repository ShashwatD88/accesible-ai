import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { messages, userLocation } = await req.json();

    let formattedMessages: any[] = [];
    let lastRole = null;
    for (const m of messages) {
      if (!m.text || !m.text.trim()) continue;
      
      const role = m.role === "model" ? "model" : "user";
      if (role === lastRole) {
        formattedMessages[formattedMessages.length - 1].parts[0].text += "\n\n" + m.text;
      } else {
        formattedMessages.push({ role, parts: [{ text: m.text }] });
        lastRole = role;
      }
    }

    if (formattedMessages.length > 0 && formattedMessages[0].role === "model") {
      formattedMessages.shift();
    }

let systemPrompt = `You are an intelligent travel and accessibility assistant embedded in a map application.
You help users plan trips, itineraries, find places, book rides, and answer general questions about the world. 
Always be polite, enthusiastic, and use beautiful Markdown formatting with emojis for easy reading.

CRITICAL RULES FOR MAP INTEGRATION (ONLY WHEN MAP UPDATE IS NEEDED):
1. When the user asks you to find places nearby, search for recommendations, or look for something in their radius, use the 'search_place' JSON block. 
2. If the user explicitly specifies a particular city or area (like "in London" or "near Hubli"), include it in the 'location' field. 
3. IF the user asks for places "nearby", "around me", or does not specify a city, you MUST OMIT the 'location' field entirely so the system uses their GPS coordinates.
\`\`\`json
{
  "action": "search_place",
  "query": "bakery",
  "location": "Yeshwantpur, Bangalore",
  "radius": 5000
}
\`\`\`

When the user asks you to go to, spot, or navigate to a specific city, country, or distant location, use the 'navigate' JSON block:
\`\`\`json
{
  "action": "navigate",
  "query": "New York"
}
\`\`\`

When the user asks you to plan a trip or create an itinerary for a city, use the 'plan_trip' JSON block. Provide a beautiful day-by-day itinerary in the conversational text, and in the JSON block, provide the city coordinates and a list of specific places mentioned in your itinerary with their coordinates.
\`\`\`json
{
  "action": "plan_trip",
  "location": "Paris",
  "lat": 48.8566,
  "lng": 2.3522,
  "places": [
    {"name": "Eiffel Tower", "lat": 48.8584, "lng": 2.2945},
    {"name": "Louvre Museum", "lat": 48.8606, "lng": 2.3376}
  ]
}
\`\`\`

IMPORTANT RULES FOR JSON & GENERAL CONVERSATION:
1. ONLY include a JSON block when a map action is needed (showing places, navigating, or planning a trip on the map).
2. For GENERAL QUESTIONS (like "what is the distance between X and Y?", "how do I travel to Z?", general knowledge, or conversational chat), DO NOT output any JSON block! Just provide a helpful, conversational response in Markdown. You are a full AI agent, like Google, so feel free to answer any question!
3. For 'search_place' query, you MUST extract the SINGLE most generic noun category. Drop all adjectives! (e.g., if user asks for 'vegetarian restaurant', output 'restaurant'. If 'eye hospital', output 'hospital'. If 'cake shop', output 'bakery'). NEVER use multiple words or natural language in the query, because the geocoder will fail.
4. For 'navigate' query, you CAN use the full city or location name.
Provide regular conversational text *outside* the JSON block so the user can read your response while the map updates automatically.`;

    if (userLocation) {
      systemPrompt += `\n\nUSER'S CURRENT LOCATION: Latitude ${userLocation[0]}, Longitude ${userLocation[1]}. Use this to find places nearby!`;
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: formattedMessages,
        }),
      }
    );

    const data = await res.json();
    
    if (!res.ok) {
       console.error("Gemini API Error:", JSON.stringify(data, null, 2));
       if (res.status === 429) {
          return NextResponse.json({ text: "I'm currently receiving too many requests and hit my API rate limit! Please wait a minute and try again.", action: null });
       }
       return NextResponse.json({ text: "Sorry, I encountered an API error while processing that.", action: null });
    }

    const replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't process that.";

    let action = null;
    let textWithoutAction = replyText;
    
    // Extract JSON block using regex
    let jsonMatch = replyText.match(/```json\s*([\s\S]*?)\s*```/);
    
    // Fallback: If no markdown block, try to find a raw JSON object
    if (!jsonMatch) {
      jsonMatch = replyText.match(/(\{[\s\S]*"action"\s*:\s*"(?:search_place|navigate)"[\s\S]*\})/);
    }

    if (jsonMatch) {
      try {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        action = JSON.parse(jsonStr);
        textWithoutAction = replyText.replace(jsonMatch[0], "").trim();
      } catch(e) {
        console.error("Failed to parse inner JSON", e);
      }
    }

    return NextResponse.json({ text: textWithoutAction, action });

  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json({ text: "An error occurred while connecting to the assistant.", action: null }, { status: 500 });
  }
}
