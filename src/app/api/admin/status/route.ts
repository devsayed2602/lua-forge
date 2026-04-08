import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

// Public endpoint - no auth required. Returns only what visitors need to know.
export async function GET() {
  try {
    const config: any = await redis.get("site_config");

    if (!config) throw new Error("No config found");

    return NextResponse.json({
      maintenanceMode: config.maintenanceMode || false,
      maintenanceMessage: config.maintenanceMessage || "",
      bannerEnabled: config.bannerEnabled || false,
      bannerMessage: config.bannerMessage || "",
      searchDisabled: config.searchDisabled || false,
      downloadsDisabled: config.downloadsDisabled || false,
    });
  } catch (error) {
    return NextResponse.json({
      maintenanceMode: false,
      maintenanceMessage: "",
      bannerEnabled: false,
      bannerMessage: "",
      searchDisabled: false,
      downloadsDisabled: false,
    });
  }
}
