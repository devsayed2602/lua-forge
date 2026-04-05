import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const CONFIG_PATH = path.join(process.cwd(), "src", "admin_config.json");

// Public endpoint - no auth required. Returns only what visitors need to know.
export async function GET() {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
    const config = JSON.parse(raw);

    return NextResponse.json({
      maintenanceMode: config.maintenanceMode || false,
      maintenanceMessage: config.maintenanceMessage || "",
      bannerEnabled: config.bannerEnabled || false,
      bannerMessage: config.bannerMessage || "",
      searchDisabled: config.searchDisabled || false,
      downloadsDisabled: config.downloadsDisabled || false,
    });
  } catch {
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
