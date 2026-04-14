import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const ANTHROPIC_KEY = process.env.ANTHROPIC_OAUTH_TOKEN || process.env.ANTHROPIC_API_KEY || '';
const GEMINI_KEY = 'AIzaSyAd8d0buBn_Lj-V339YXv9UHVoqI8LvFGQ';

const PROFILE = `SULLIVAN MAGDALEON — AI SYSTEMS ENGINEER, 29, Paris
Contact: +33 6 29 84 23 39 | sullivan.magdaleone@gmail.com

SUMMARY: Ingénieur IA orienté production. Conçoit et industrialise des systèmes LLM (RAG, agents, orchestration multi-agents) intégrés aux workflows métier. Automatise acquisition, traitement données, qualification produit et service client. Focus fiabilité, performance, intégration API.

=== EXPERIENCE 1: AI SYSTEMS ENGINEER — Freelance (2023-now) ===
- LLM Systems/RAG: solutions LLM avec RAG, vector database, embeddings, retrieval ciblé, knowledge base. Automatisation acquisition, analyse et support.
- Conversation Memory: thread summary memory (résumés incrémentaux) + récupération éléments pertinents. Réduit tokens, améliore cohérence.
- Multi-Agent Systems: orchestration 15+ agents, agent-to-agent communication, delegation/handoffs, routing multi-LLM (Claude/GPT/Gemini/Qwen) selon coût/latence/qualité.
- Automation Pipelines (Python/Node.js): collecte/enrichissement/scoring/qualification ~500 leads/jour, scheduling, retries, idempotence, déduplication.
- API Integration: REST, webhooks, OAuth, tool calling, intégration CRM/e-commerce/marketing.
- Deployment/DevOps: Docker, Linux/VPS, Cloud Run, secrets, CI/CD, monitoring/logging/alerting.
- Continuous Improvement/Evals: observabilité, analyse erreurs, tests prompts/flows, hardening prod.

=== EXPERIENCE 2: DATA ENGINEER IA — La Compagnie des Animaux (Feb 2023-Aug 2025) ===
- Customer Support Automation: chatbot + callbot, NLP multi-tours, intégration APIs métiers, ~70 appels/jour
- E-commerce Workflow Automation: synchro catalogue, traitement commandes, ShipUp/Shippingbo, ~30 000 commandes/mois
- LLM Ops: classification auto tickets, résumé conversations, extraction/structuration données
- AI Content Pipelines: du brief au contenu final, industrialisation production grande échelle
- CRM & Growth Automation: segmentation, scoring, relances, accompagnement adoption IA

=== EXPERIENCE 3: DATA ENGINEER / WEB SYSTEMS — Agence AARON (Aug 2019-Jan 2023) ===
- Web Data Pipelines Python: extraction, nettoyage, analyse données GSC, crawling, logs
- Log Analysis: parsing NGINX, détection anomalies, génération rapports
- SEO technique pour 20+ clients

=== KEY AI PROJECTS ===
1. Multi-Agent AI System: 15+ agents, agent-to-agent, routing multi-LLM
2. AI Voice Agents (Callbots): conversations multi-tours téléphoniques
3. AI Product Qualification: orientation auto utilisateurs vers produits adaptés (e-commerce)
4. AI Content Automation: pipelines brief-to-production

=== TECH STACK ===
AI/LLM: OpenAI, Anthropic Claude, Gemini, RAG, Vector DB, Prompt Engineering, Tool Calling, Multi-Agent, LangChain, LangGraph
Backend: Python, Node.js, API REST, Webhooks, SQL/PostgreSQL, Pandas/Polars, Parquet/JSON
Cloud/DevOps: Docker, Linux, CI/CD, GCP (Cloud Run, OAuth), Monitoring/Logging/Alerting

=== SALARY ===
Freelance: TJM 450€/day. Full-time: 55-70K€ depending on package.`;

export async function POST(req: Request) {
  try {
    const { question, context } = await req.json();

    const prompt = `You are an elite interview coach. Sullivan is in a LIVE FRENCH job interview with the CEO/DG of BATINEA.

ABOUT BATINEA:
- E-commerce: salle de bain, robinetterie, WC, sanitaire, cuisine
- ~20 collaborateurs, 70 000 visiteurs/mois
- Présence sur ~10 marketplaces
- Stack: PrestaShop / Odoo / Shippingbo
- La DG veut intégrer l'IA concrètement — maturité IA faible dans l'équipe

MISSION (6 mois renouvelable, télétravail libre, Toulouse):
1. Amélioration expérience client: SEO produits, personnalisation parcours, tunnel d'achat, recommandation ML, automatisation support
2. Chatbot agentique: interne+externe, connecté bases produits/SAV/ERP, multi-sources (site+marketplaces)
3. Centralisation support: tickets site+10 marketplaces, catégorisation NLP, suggestions réponses auto
4. Automatisation & ML: workflows, exploitation données ventes/stock/saisonnalité, prédictions
5. Growth: SEA/SEO/contenu optimisé IA, data marketing, growth hacking

Common speech fixes: "la company this animal" = La Compagnie des Animaux, "bati nea" = Batinea, "presta shop" = PrestaShop, "shipping bo" = Shippingbo

${PROFILE}

CONVERSATION SO FAR:
${context || '(interview just started)'}

INTERVIEWER JUST SAID: "${question}"

Give Sullivan THE PERFECT answer. Rules:
- First person "I" — speak AS Sullivan
- 3-4 sentences MAX, natural spoken FRENCH (this is a French interview!)
- ALWAYS connect his experience to BATINEA's specific needs
- Include SPECIFIC numbers from his CV (70 calls/day, 30K orders/month, 500 leads/day, 15+ agents)
- Highlight his Shippingbo experience (same tool as Batinea!)
- Structure: hook → concrete example relevant to Batinea → impact/result
- Sound confident, pragmatic, ROI-focused (the DG cares about business value)
- If salary question: "Mon TJM est de 450€/jour, négociable selon la durée de la mission"
- If they ask about quick wins: mention chatbot support, SEO content automation, ticket categorization
- If asked about team training: mention his experience acculturating teams at La Compagnie des Animaux

Sullivan répond:`;

    // Use Gemini 2.5 Flash with no thinking (best speed/quality balance)
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 400, thinkingConfig: { thinkingBudget: 0 } },
        }),
      }
    );

    const data = await res.json();
    const answer_en = (data.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();

    return NextResponse.json({ answer_en, key_points: [], answer_fr: '' });
  } catch (err: any) {
    return NextResponse.json({ answer_en: 'Error: ' + err.message, key_points: [], answer_fr: '' }, { status: 500 });
  }
}
