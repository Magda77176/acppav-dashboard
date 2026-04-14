import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

export async function POST(request: any) {
  return NextResponse.json({ message: "Use /api/acppav/modifications for modifications" }, { status: 405 });
}

export async function GET() {
  try {
    const dataPath = join(process.cwd(), "data", "../../projects/acppav/data/articles.json");
    // Try multiple paths
    let articles: any[] = [];
    const paths = [
      join(process.cwd(), "..", "projects", "acppav", "data", "articles.json"),
      join(process.cwd(), "data", "articles-acppav.json"),
    ];
    
    for (const p of paths) {
      try {
        const raw = readFileSync(p, "utf-8");
        articles = JSON.parse(raw);
        break;
      } catch {}
    }

    // Check for modification logs
    const modLogsPath = join(process.cwd(), "..", "projects", "acppav", "data", "modifications", "all-modifications.json");
    let modifications: any[] = [];
    
    if (existsSync(modLogsPath)) {
      try {
        modifications = JSON.parse(readFileSync(modLogsPath, "utf-8"));
      } catch {}
    }

    // Add modification counts to articles
    articles = articles.map(article => {
      const modCount = modifications.filter(mod => mod.articleFile === article.filename).length;
      return { ...article, modificationCount: modCount };
    });

    return NextResponse.json({ articles, modifications });
  } catch (error) {
    return NextResponse.json({ articles: [], modifications: [] }, { status: 200 });
  }
}
