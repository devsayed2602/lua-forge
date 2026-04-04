import { NextResponse } from "next/server";

export async function GET() {
  try {
    const backendUrl = process.env.BACKEND_URL;
    const accessToken = process.env.SERVER_ACCESS_TOKEN;

    if (!backendUrl || !accessToken) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const indexUrl = `${backendUrl}/api/games_index.json`;

    const response = await fetch(indexUrl, {
      method: "GET",
      headers: {
        "User-Agent": "SteamLuaPatcher/2.0",
        "X-Access-Token": accessToken,
      },
      next: { revalidate: 3600 } // Cache the huge file on the server for 1 hour
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Webserver error" }, { status: response.status });
    }

    const data = await response.json();
    let gameList = [];
    
    if (data && Array.isArray(data.games)) {
      gameList = data.games;
    } else if (Array.isArray(data)) {
      gameList = data;
    }

    // Efficiently pick 18 random games (instead of sorting 66,000 items)
    const suggestions = [];
    const poolSize = gameList.length;
    for (let i = 0; i < 18; i++) {
        suggestions.push(gameList[Math.floor(Math.random() * poolSize)]);
    }

    return NextResponse.json(suggestions);
  } catch (error) {
    console.error("Suggestions Error:", error);
    return NextResponse.json({ error: "Failed to fetch suggestions" }, { status: 500 });
  }
}
