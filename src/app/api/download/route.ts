import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const appId = searchParams.get("appId");

    if (!appId) {
      return NextResponse.json({ error: "Missing App ID parameter. Please provide a Game ID to download." }, { status: 400 });
    }

    const backendUrl = process.env.BACKEND_URL;
    const accessToken = process.env.SERVER_ACCESS_TOKEN;

    if (!backendUrl || !accessToken) {
      console.error("Missing backend URL or access token in environment.");
      return NextResponse.json({ error: "Server configuration error. Contact administrator." }, { status: 500 });
    }

    // Build the request URL
    const fileUrl = `${backendUrl}/lua/${appId}.lua`;

    console.log(`[API] Fetching: ${fileUrl}`);
    // Fetch the .lua file from the webserver
    const proxyResponse = await fetch(fileUrl, {
      method: "GET",
      headers: {
        "User-Agent": "SteamLuaPatcher/2.0",
        "X-Access-Token": accessToken,
      },
    });

    if (!proxyResponse.ok) {
        console.log(`[API] Webserver error: ${proxyResponse.status}`);
        if (proxyResponse.status === 404) {
            return NextResponse.json(
                { error: `Patch for Game ID ${appId} not found on the server.` },
                { status: 404 }
            );
        }
      return NextResponse.json(
        { error: `Webserver responded with status: ${proxyResponse.status}` },
        { status: proxyResponse.status }
      );
    }

    console.log(`[API] Converting to ArrayBuffer...`);
    const fileArrayBuffer = await proxyResponse.arrayBuffer();

    console.log(`[API] Creating ZIP...`);
    // Create a new zip file and add the lua script + credits to it
    const zip = new JSZip();
    zip.file(`${appId}.lua`, fileArrayBuffer);
    zip.file("README.txt", `--[[
    Title: Lua Script
    Created by: leVi
    Credits: LuaForge
    
    Thank you for downloading! 
--]]
`);

    // Generate the zip buffer
    const zipBuffer = await zip.generateAsync({ type: "uint8array" });

    console.log(`[API] Serving ZIP (${zipBuffer.length} bytes)...`);
    // Return the response as a downloadable ZIP file
    return new NextResponse(zipBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${appId}-lua-patch.zip"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error: any) {
    console.error("SERVER-SIDE DOWNLOAD ERROR:", error.message || error);
    return NextResponse.json({ error: "Failed to securely download the Lua file. Network error." }, { status: 500 });
  }
}
