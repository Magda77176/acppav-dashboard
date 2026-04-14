import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const MEMORY_DIR = "/root/openclaw/memory";

export async function GET() {
  const files = fs.readdirSync(MEMORY_DIR).filter(f => f.endsWith(".md")).sort().reverse();
  const list = files.map(f => ({
    filename: f,
    date: f.replace(".md", ""),
    size: fs.statSync(path.join(MEMORY_DIR, f)).size,
    mtime: fs.statSync(path.join(MEMORY_DIR, f)).mtime,
  }));
  return NextResponse.json(list);
}
