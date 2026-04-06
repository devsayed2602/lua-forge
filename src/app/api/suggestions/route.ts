import { NextResponse } from "next/server";

// Global cache to avoid re-parsing the huge JSON on every request within the same container
let cachedGameList: any[] | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 3600 * 1000; // 1 hour for the full index
let cachedSuggestions: any[] | null = null;
let lastSuggestionsTime = 0;
const SUGGESTIONS_TTL = 600 * 1000; // 10 minutes for the final 30 items

export async function GET() {
  try {
    const backendUrl = process.env.BACKEND_URL;
    const accessToken = process.env.SERVER_ACCESS_TOKEN;

    if (!backendUrl || !accessToken) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const currentTime = Date.now();

    // Fast path: If we have cached suggestions, return them immediately
    if (cachedSuggestions && (currentTime - lastSuggestionsTime) < SUGGESTIONS_TTL) {
      return NextResponse.json(cachedSuggestions, {
        headers: {
          "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600"
        }
      });
    }

    if (!cachedGameList || (currentTime - lastFetchTime) > CACHE_TTL) {
      const indexUrl = `${backendUrl}/api/games_index.json`;
      const response = await fetch(indexUrl, {
        method: "GET",
        headers: {
          "User-Agent": "SteamLuaPatcher/2.0",
          "X-Access-Token": accessToken,
        },
        // We still use next cache for the fetch itself
        next: { revalidate: 3600 } 
      });

      if (!response.ok) {
        return NextResponse.json({ error: "Webserver error" }, { status: response.status });
      }

      const data = await response.json();
      if (data && Array.isArray(data.games)) {
        cachedGameList = data.games;
      } else if (Array.isArray(data)) {
        cachedGameList = data;
      }
      lastFetchTime = currentTime;
    }

    if (!cachedGameList) {
      return NextResponse.json({ error: "No games found" }, { status: 404 });
    }

    // Efficiently pick 30 random games for more variety
    const suggestions = [];
    const poolSize = cachedGameList.length;
    const count = Math.min(poolSize, 30);
    
    // Use a set to avoid duplicates in the same suggestion batch
    const indices = new Set<number>();
    while (indices.size < count) {
      indices.add(Math.floor(Math.random() * poolSize));
    }
    
    for (const index of indices) {
      suggestions.push(cachedGameList[index]);
    }

    // Update suggestions cache
    cachedSuggestions = suggestions;
    lastSuggestionsTime = currentTime;

    return NextResponse.json(suggestions, {
      headers: {
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600"
      }
    });
  } catch (error) {
    console.error("Suggestions Error:", error);
    return NextResponse.json({ error: "Failed to fetch suggestions" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
