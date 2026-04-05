import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const CONFIG_PATH = path.join(process.cwd(), "src", "admin_config.json");

function readConfig() {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {
      maintenanceMode: false,
      maintenanceMessage: "We're performing scheduled maintenance. We'll be back shortly.",
      bannerEnabled: false,
      bannerMessage: "",
      searchDisabled: false,
      downloadsDisabled: false,
      lastUpdatedBy: "system",
      lastUpdatedAt: "",
    };
  }
}

function writeConfig(config: any) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
}

// GET: Fetch admin config (requires auth)
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("x-admin-password");
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword || authHeader !== adminPassword) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const config = readConfig();
  return NextResponse.json(config);
}

// POST: Update admin config (requires auth)
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("x-admin-password");
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword || authHeader !== adminPassword) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const currentConfig = readConfig();

    const updatedConfig = {
      ...currentConfig,
      ...body,
      lastUpdatedBy: "admin",
      lastUpdatedAt: new Date().toISOString(),
    };

    writeConfig(updatedConfig);
    return NextResponse.json({ success: true, config: updatedConfig });
  } catch (error) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
