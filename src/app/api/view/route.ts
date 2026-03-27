import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const appId = searchParams.get("appId");

    if (!appId) {
      return NextResponse.json({ error: "Missing App ID parameter." }, { status: 400 });
    }

    const backendUrl = process.env.BACKEND_URL;
    const accessToken = process.env.SERVER_ACCESS_TOKEN;

    if (!backendUrl || !accessToken) {
      return NextResponse.json({ error: "Server configuration error." }, { status: 500 });
    }

    const fileUrl = `${backendUrl}/lua/${appId}.lua`;

    const response = await fetch(fileUrl, {
      method: "GET",
      headers: {
        "User-Agent": "SteamLuaPatcher/2.0",
        "X-Access-Token": accessToken,
      },
    });

    if (!response.ok) {
        if (response.status === 404) {
            return NextResponse.json(
                { error: `Patch for Game ID ${appId} not found.` },
                { status: 404 }
            );
        }
      return NextResponse.json({ error: "Webserver error." }, { status: response.status });
    }

    const content = await response.text();
    return new NextResponse(content, {
        status: 200,
        headers: { "Content-Type": "text/plain" }
    });
  } catch (error) {
    console.error("View Error:", error);
    return NextResponse.json({ error: "Failed to fetch file content." }, { status: 500 });
  }
}
