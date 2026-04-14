import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const TASKS_FILE = path.join(process.cwd(), "data", "tasks.json");

function readTasks() {
  return JSON.parse(fs.readFileSync(TASKS_FILE, "utf-8"));
}

export async function GET() {
  return NextResponse.json(readTasks());
}

export async function POST(req: Request) {
  const body = await req.json();
  fs.writeFileSync(TASKS_FILE, JSON.stringify(body, null, 2));
  return NextResponse.json({ ok: true });
}
