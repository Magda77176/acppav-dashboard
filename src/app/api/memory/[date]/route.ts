import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const MEMORY_DIR = "/root/openclaw/memory";

export async function GET(_req: Request, { params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  const file = path.join(MEMORY_DIR, `${date}.md`);
  if (!fs.existsSync(file)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ date, content: fs.readFileSync(file, "utf-8") });
}
