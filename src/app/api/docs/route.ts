import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DOCS_DIR = "/root/openclaw/_archive/docs";

export async function GET() {
  if (!fs.existsSync(DOCS_DIR)) return NextResponse.json([]);
  const files = fs.readdirSync(DOCS_DIR);
  const docs = files.map(f => {
    const stat = fs.statSync(path.join(DOCS_DIR, f));
    const lower = f.toLowerCase();
    let category = "autre";
    if (lower.includes("email")) category = "email";
    else if (lower.includes("brief")) category = "brief";
    else if (lower.includes("workflow")) category = "workflow";
    else if (lower.includes("prospect")) category = "prospect";
    else if (lower.includes("mission")) category = "mission";
    else if (lower.includes("dashboard")) category = "dashboard";
    else if (lower.includes("crm")) category = "crm";
    else if (lower.includes("seo")) category = "seo";
    return { filename: f, size: stat.size, mtime: stat.mtime, category };
  });
  return NextResponse.json(docs);
}
