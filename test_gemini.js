const fs = require('fs');

(async () => {
  const envFile = fs.readFileSync('.env.local', 'utf8');
  const apiKey = envFile.match(/GEMINI_API_KEY=(.*)/)[1].trim();

  const systemPrompt = `You are an intelligent travel and accessibility assistant embedded in a map application.
You help users plan trips, itineraries, find places, and book rides. 
Always be polite, enthusiastic, and use beautiful Markdown formatting with emojis for easy reading.

CRITICAL RULES FOR MAP INTEGRATION:
When the user asks you to find places nearby, search for recommendations, or look for something in their radius, use the 'search_place' JSON block:
\`\`\`json
{
  "action": "search_place",
  "query": "pizza",
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

IMPORTANT RULES FOR JSON:
1. You MUST include exactly one of these JSON blocks when a map action is needed or the map will break.
2. For 'search_place' query, you MUST use ONLY a single, simple keyword (e.g., 'pizza', 'cafe', 'hospital'). DO NOT use natural language, city names, or long phrases, because the geocoder will fail.
3. For 'navigate' query, you CAN use the full city or location name.
Provide regular conversational text *outside* the JSON block so the user can read your response while the map updates automatically.

USER'S CURRENT LOCATION: Latitude 40, Longitude -74. Use this to find places nearby!`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: 'find some good cake shops around me' }] }]
      })
    }
  );
  console.log("Status:", res.status);
  const data = await res.json();
  if (!res.ok) {
     console.error(JSON.stringify(data, null, 2));
  } else {
     console.log("SUCCESS:", JSON.stringify(data.candidates[0].content, null, 2));
  }
})();
