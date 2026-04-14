import { NextResponse } from "next/server";
import fs from "fs";

export async function GET() {
  const content = fs.readFileSync("/root/openclaw/MEMORY.md", "utf-8");
  return NextResponse.json({ content });
}
