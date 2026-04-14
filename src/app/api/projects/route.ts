import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";

const DATA_FILE = "/root/openclaw/mission-control/data/projects.json";

export async function GET() {
  try {
    if (existsSync(DATA_FILE)) {
      const data = JSON.parse(readFileSync(DATA_FILE, "utf-8"));
      return NextResponse.json(data);
    }
    return NextResponse.json([]);
  } catch {
    return NextResponse.json([]);
  }
}
