import { NextResponse } from "next/server";
import fs from "fs";

export async function GET() {
  const raw = fs.readFileSync("/root/openclaw/data/photographes-prospects.csv", "utf-8");
  const lines = raw.trim().split("\n");
  const headers = lines[0].split(",");
  const rows = lines.slice(1).map(line => {
    const cols = line.split(",");
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => obj[h.trim()] = (cols[i] || "").trim());
    return obj;
  });
  const withEmail = rows.filter(r => r.Email).length;
  const withPhone = rows.filter(r => r.Telephone).length;
  const withSite = rows.filter(r => r.Site).length;
  return NextResponse.json({
    total: rows.length,
    withEmail,
    withoutEmail: rows.length - withEmail,
    withPhone,
    withSite,
    rows,
  });
}
