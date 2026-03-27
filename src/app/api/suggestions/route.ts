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

    // Pick 18 random games to fill at least 3 rows on all breakpoints (6 cols × 3 rows)
    const shuffled = gameList.sort(() => 0.5 - Math.random());
    const suggestions = shuffled.slice(0, 18);

    return NextResponse.json(suggestions);
  } catch (error) {
    console.error("Suggestions Error:", error);
    return NextResponse.json({ error: "Failed to fetch suggestions" }, { status: 500 });
  }
}
