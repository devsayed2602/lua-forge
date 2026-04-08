import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

const DEFAULT_CONFIG = {
  maintenanceMode: false,
  maintenanceMessage: "We're performing scheduled maintenance. We'll be back shortly.",
  bannerEnabled: false,
  bannerMessage: "",
  searchDisabled: false,
  downloadsDisabled: false,
  lastUpdatedBy: "system",
  lastUpdatedAt: "",
};

async function readConfig() {
  try {
    const config = await redis.get("site_config");
    return config || DEFAULT_CONFIG;
  } catch (error) {
    console.error("Redis fetch error:", error);
    return DEFAULT_CONFIG;
  }
}

async function writeConfig(config: any) {
  await redis.set("site_config", JSON.stringify(config));
}

// GET: Fetch admin config (requires auth)
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("x-admin-password")?.trim();
  const adminPassword = process.env.ADMIN_PASSWORD?.trim();

  if (!adminPassword) {
    console.error("ADMIN_PASSWORD environment variable is NOT set on the server.");
    return NextResponse.json({ error: "Server configuration missing: ADMIN_PASSWORD" }, { status: 500 });
  }

  if (authHeader !== adminPassword) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const config = await readConfig();
  return NextResponse.json(config);
}

// POST: Update admin config (requires auth)
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("x-admin-password")?.trim();
  const adminPassword = process.env.ADMIN_PASSWORD?.trim();

  if (!adminPassword) {
    console.error("ADMIN_PASSWORD environment variable is NOT set on the server.");
    return NextResponse.json({ error: "Server configuration missing: ADMIN_PASSWORD" }, { status: 500 });
  }

  if (authHeader !== adminPassword) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const currentConfig: any = await readConfig();

    const updatedConfig = {
      ...currentConfig,
      ...body,
      lastUpdatedBy: "admin",
      lastUpdatedAt: new Date().toISOString(),
    };

    await writeConfig(updatedConfig);
    return NextResponse.json({ success: true, config: updatedConfig });
  } catch (error) {
    return NextResponse.json({ error: "Invalid request body or Redis error" }, { status: 400 });
  }
}
