import { NextResponse } from "next/server";
import fs from "fs";

export async function GET() {
  const data = JSON.parse(fs.readFileSync("/root/openclaw/tools/scheduler-state.json", "utf-8"));
  return NextResponse.json(data);
}
