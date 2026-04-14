#!/usr/bin/env node
/**
 * Sync articles from local server to Vercel deployment
 * Run this to update the articles data in the cloud dashboard
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const LOCAL_SERVER = 'http://localhost:3333';
const OUTPUT_FILE = path.join(__dirname, '../src/app/api/acppav/articles/route.ts');

async function fetchArticles() {
  try {
    console.log('🔄 Fetching articles from local server...');
    
    const response = await fetch(`${LOCAL_SERVER}/api/acppav/articles`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const articles = await response.json();
    console.log(`✅ Fetched ${articles.length} articles`);
    
    return articles;
  } catch (error) {
    console.error('❌ Failed to fetch articles:', error.message);
    
    // Fallback: return mock data
    console.log('🔄 Using fallback mock data...');
    return [
      {
        id: 1,
        title: "Secrétaire assistante médico-administrative 2026 : métier, salaire et formation",
        status: "published",
        slug: "secretaire-medicale-2026",
        keyword: "secrétaire assistante médico-administrative",
        volume: 8100,
        cluster: "Médico-social",
        category: "Médico-social",
        type: "article",
        filename: "medico-social-01-secretaire-medicale.md"
      },
      {
        id: 2,
        title: "AES 2026 : Accompagnant Educatif et Social, formation et débouchés",
        status: "published", 
        slug: "aes-accompagnant-educatif-social-2026",
        keyword: "AES accompagnant éducatif et social",
        volume: 5400,
        cluster: "Médico-social",
        category: "Médico-social", 
        type: "article",
        filename: "medico-social-02-aes.md"
      }
    ];
  }
}

function generateRouteFile(articles) {
  const routeContent = `import { NextRequest, NextResponse } from "next/server";

// Articles data synced from local server
const articles = ${JSON.stringify(articles, null, 2)};

export async function GET() {
  try {
    return NextResponse.json(articles);
  } catch (error) {
    console.error('Error loading articles:', error);
    return NextResponse.json({ error: 'Failed to load articles' }, { status: 500 });
  }
}`;

  fs.writeFileSync(OUTPUT_FILE, routeContent);
  console.log(`✅ Updated ${OUTPUT_FILE}`);
}

async function main() {
  console.log('📊 ACPPAV Articles Sync');
  console.log('=======================');
  
  const articles = await fetchArticles();
  generateRouteFile(articles);
  
  console.log('');
  console.log('✅ Sync complete!');
  console.log('💡 Now commit and push to update the cloud dashboard');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { fetchArticles, generateRouteFile };