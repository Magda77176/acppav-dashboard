import { NextRequest, NextResponse } from "next/server";

// Mock data pour Vercel - remplacé par les vraies données via script
const mockArticles = [
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

export async function GET() {
  try {
    // En production, on pourrait charger depuis une source externe
    // Pour l'instant, retourner les données mockées
    return NextResponse.json(mockArticles);
  } catch (error) {
    console.error('Error loading articles:', error);
    return NextResponse.json({ error: 'Failed to load articles' }, { status: 500 });
  }
}