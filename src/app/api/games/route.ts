import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const backendUrl = process.env.BACKEND_URL;
    const accessToken = process.env.SERVER_ACCESS_TOKEN;

    if (!backendUrl || !accessToken) {
      console.error("Missing backend URL or access token in environment.");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const indexUrl = `${backendUrl}/api/games_index.json`;

    const response = await fetch(indexUrl, {
      method: "GET",
      headers: {
        "User-Agent": "SteamLuaPatcher/2.0",
        "X-Access-Token": accessToken,
      },
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Webserver index responded with status: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400"
      }
    });
  } catch (error) {
    console.error("Backend Error Fetching Index:", error);
    return NextResponse.json({ error: "Failed to fetch game index" }, { status: 500 });
  }
}
