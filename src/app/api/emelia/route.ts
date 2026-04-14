import { NextResponse } from "next/server";
import https from "https";

const API_KEY = "Qj7HvMDe2x7GksG9mKcsXjknyRzpD9xyI68ceT71sZFAKTZx";
const CAMPAIGN_ID = "69cbe3127072071f17e74105";

function graphql(query: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query });
    const req = https.request(
      {
        hostname: "graphql.emelia.io",
        path: "/graphql",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: API_KEY,
        },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk: string) => (body += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(body));
          } catch {
            reject(new Error(`Parse error: ${body.substring(0, 200)}`));
          }
        });
      }
    );
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

// Cache: refresh max every 5 min
let cache: { data: any; ts: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

export async function GET() {
  try {
    if (cache && Date.now() - cache.ts < CACHE_TTL) {
      return NextResponse.json(cache.data);
    }

    // 1. Get all campaigns + active campaign details
    const campaignsRes = await graphql(
      `query { campaigns { _id name status } }`
    );
    const campaigns = campaignsRes.data?.campaigns || [];

    const campaignDetailRes = await graphql(
      `query { campaign(id: "${CAMPAIGN_ID}") { _id name status createdAt startAt recipients { processing total_count } schedule { dailyContact dailyLimit trackOpens trackLinks } } }`
    );
    const campaignDetail = campaignDetailRes.data?.campaign || {};

    // 2. For the active campaign, paginate all activities
    const allActivities: any[] = [];
    for (let page = 0; page < 200; page++) {
      const r = await graphql(
        `query { activities(campaignId: "${CAMPAIGN_ID}", page: ${page}) { activities { _id date event step } } }`
      );
      const acts = r.data?.activities?.activities || [];
      if (acts.length === 0) break;
      allActivities.push(...acts);
      if (acts.length < 30) break;
    }

    // 3. Count by event type
    const byEvent: Record<string, number> = {};
    allActivities.forEach((a) => {
      byEvent[a.event] = (byEvent[a.event] || 0) + 1;
    });

    // 4. Count SENT by day
    const sentByDay: Record<string, number> = {};
    const opensByDay: Record<string, number> = {};
    const repliesByDay: Record<string, number> = {};

    allActivities.forEach((a) => {
      const day = a.date?.substring(0, 10);
      if (!day) return;
      if (a.event === "SENT") sentByDay[day] = (sentByDay[day] || 0) + 1;
      if (a.event === "FIRST_OPEN") opensByDay[day] = (opensByDay[day] || 0) + 1;
      if (a.event === "REPLIED") repliesByDay[day] = (repliesByDay[day] || 0) + 1;
    });

    // 5. Get reply details
    const replies = allActivities
      .filter((a) => a.event === "REPLIED")
      .map((a) => ({ id: a._id, date: a.date, step: a.step }));

    const result = {
      campaign: {
        id: CAMPAIGN_ID,
        name: campaignDetail.name || campaigns.find((c: any) => c._id === CAMPAIGN_ID)?.name || "Unknown",
        status: campaignDetail.status || campaigns.find((c: any) => c._id === CAMPAIGN_ID)?.status || "UNKNOWN",
        totalContacts: campaignDetail.recipients?.total_count || 0,
        processing: campaignDetail.recipients?.processing || false,
        dailyContact: campaignDetail.schedule?.dailyContact || 0,
        dailyLimit: campaignDetail.schedule?.dailyLimit || 0,
        startedAt: campaignDetail.startAt ? new Date(Number(campaignDetail.startAt)).toISOString() : null,
      },
      allCampaigns: campaigns.map((c: any) => ({
        id: c._id,
        name: c.name,
        status: c.status,
      })),
      stats: {
        sent: byEvent["SENT"] || 0,
        opened: byEvent["FIRST_OPEN"] || 0,
        replied: byEvent["REPLIED"] || 0,
        bounced: byEvent["BOUNCED"] || 0,
        clicked: byEvent["CLICKED"] || 0,
        unsubscribed: byEvent["UNSUBSCRIBED"] || 0,
        openRate: byEvent["SENT"]
          ? Math.round(((byEvent["FIRST_OPEN"] || 0) / byEvent["SENT"]) * 100)
          : 0,
        replyRate: byEvent["SENT"]
          ? Math.round(((byEvent["REPLIED"] || 0) / byEvent["SENT"]) * 1000) / 10
          : 0,
      },
      sentByDay,
      opensByDay,
      repliesByDay,
      replies,
      totalActivities: allActivities.length,
      fetchedAt: new Date().toISOString(),
    };

    cache = { data: result, ts: Date.now() };
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch Emelia stats" },
      { status: 500 }
    );
  }
}
