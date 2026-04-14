import { NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync } from "fs";

const FILE = "/root/openclaw/mission-control/data/campaigns.json";

export async function GET() {
  try {
    if (existsSync(FILE)) return NextResponse.json(JSON.parse(readFileSync(FILE, "utf-8")));
    return NextResponse.json([]);
  } catch { return NextResponse.json([]); }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (Array.isArray(body)) {
      writeFileSync(FILE, JSON.stringify(body, null, 2));
    } else {
      // Add single campaign
      const existing = existsSync(FILE) ? JSON.parse(readFileSync(FILE, "utf-8")) : [];
      existing.push({ ...body, id: `camp-${Date.now()}` });
      writeFileSync(FILE, JSON.stringify(existing, null, 2));
    }
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "fail" }, { status: 500 }); }
}
