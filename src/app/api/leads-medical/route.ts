import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const contacts = searchParams.get('contacts');
    const verifyStatus = searchParams.get('verify-status');

    // Return verification progress
    if (verifyStatus === 'true') {
      const root = path.join(process.cwd(), "..");
      let state: any = {};
      let okCount = 0, koCount = 0, totalToVerify = 0;

      const statePath = path.join(root, "data", "verify-medical-state.json");
      const okPath = path.join(root, "data", "verified-medical-ok.json");
      const koPath = path.join(root, "data", "verified-medical-ko.json");
      const totalPath = path.join(root, "data", "enriched-all-medical.json");

      if (fs.existsSync(statePath)) state = JSON.parse(fs.readFileSync(statePath, "utf-8"));
      if (fs.existsSync(okPath)) okCount = JSON.parse(fs.readFileSync(okPath, "utf-8")).length;
      if (fs.existsSync(koPath)) koCount = JSON.parse(fs.readFileSync(koPath, "utf-8")).length;
      if (fs.existsSync(totalPath)) totalToVerify = JSON.parse(fs.readFileSync(totalPath, "utf-8")).length;

      return NextResponse.json({
        total: totalToVerify,
        processed: okCount + koCount,
        ok: okCount,
        ko: koCount,
        hitRate: (okCount + koCount) > 0 ? ((okCount / (okCount + koCount)) * 100).toFixed(1) : "0",
        running: (okCount + koCount) > 0 && (okCount + koCount) < totalToVerify,
      });
    }

    // Return contacts list (merge Emelia + verified new)
    if (contacts === 'true') {
      const root = path.join(process.cwd(), "..");
      let allContacts: any[] = [];

      // Emelia existing
      const emeliaPath = path.join(root, "data", "emelia-enriched-contacts.json");
      if (fs.existsSync(emeliaPath)) {
        const data = JSON.parse(fs.readFileSync(emeliaPath, "utf-8"));
        allContacts = data.map((c: any) => ({ ...c, source: "emelia", status: "en_campagne" }));
      }

      // Verified new contacts
      const okPath = path.join(root, "data", "verified-medical-ok.json");
      if (fs.existsSync(okPath)) {
        const data = JSON.parse(fs.readFileSync(okPath, "utf-8"));
        allContacts = allContacts.concat(data.map((c: any) => ({ ...c, source: "enrichment", status: "vérifié" })));
      }

      // Dedupe
      const seen = new Set();
      allContacts = allContacts.filter(c => {
        if (seen.has(c.email)) return false;
        seen.add(c.email);
        return true;
      });

      return NextResponse.json(allContacts);
    }

    // Default: dashboard stats
    const dataPath = path.join(process.cwd(), "data", "medical-dashboard-data.json");
    const altPath = path.join(process.cwd(), "..", "dashboard-leads", "medical-dashboard-data.json");

    let raw: string;
    if (fs.existsSync(dataPath)) {
      raw = fs.readFileSync(dataPath, "utf-8");
    } else if (fs.existsSync(altPath)) {
      raw = fs.readFileSync(altPath, "utf-8");
    } else {
      return NextResponse.json({ error: "Data file not found" }, { status: 404 });
    }

    return NextResponse.json(JSON.parse(raw));
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
