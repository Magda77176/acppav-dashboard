import { NextRequest, NextResponse } from "next/server";

// Mock intelligent responses based on keywords
const generateMockResponse = (message: string): string => {
  const lowerMessage = message.toLowerCase();
  
  // Salutations
  if (lowerMessage.includes("bonjour") || lowerMessage.includes("salut") || lowerMessage.includes("hello")) {
    return "Bonjour ! Je suis Jarvis, votre assistant IA. Comment puis-je vous aider aujourd'hui ?";
  }
  
  // Questions sur l'heure/date
  if (lowerMessage.includes("heure") || lowerMessage.includes("temps")) {
    const now = new Date();
    return `Il est actuellement ${now.toLocaleTimeString('fr-FR')} le ${now.toLocaleDateString('fr-FR')}.`;
  }
  
  // Questions sur la météo
  if (lowerMessage.includes("météo") || lowerMessage.includes("temps qu'il fait")) {
    return "Je ne peux pas encore accéder aux données météorologiques en temps réel, mais cette fonctionnalité sera bientôt disponible.";
  }
  
  // Questions sur le système
  if (lowerMessage.includes("système") || lowerMessage.includes("statut") || lowerMessage.includes("santé")) {
    return "Tous les systèmes fonctionnent normalement. Neural Network opérationnel, reconnaissance vocale active, et moteur TTS prêt.";
  }
  
  // Questions sur les projets
  if (lowerMessage.includes("projet") || lowerMessage.includes("travail") || lowerMessage.includes("mission")) {
    return "Je supervise actuellement plusieurs projets : Saphir Noir, Infinity Medical, ACPPAV et les missions freelance SEO. Souhaitez-vous des détails sur l'un d'eux ?";
  }
  
  // Questions sur les agents
  if (lowerMessage.includes("agent") || lowerMessage.includes("équipe")) {
    return "L'équipe compte 12 agents spécialisés : SEO Expert, Copywriter, Prospection, LinkedIn Outreach, et d'autres. Ils sont tous opérationnels.";
  }
  
  // Questions sur la prospection
  if (lowerMessage.includes("prospect") || lowerMessage.includes("client") || lowerMessage.includes("lead")) {
    return "Les campagnes de prospection sont en cours. Saphir Noir cible les photographes mariage, Infinity Medical les dentistes. Voulez-vous un rapport détaillé ?";
  }
  
  // Questions sur l'argent/revenus
  if (lowerMessage.includes("argent") || lowerMessage.includes("revenu") || lowerMessage.includes("chiffre") || lowerMessage.includes("euros")) {
    return "Je surveille les KPIs financiers de tous les projets. L'objectif est de générer du revenu concret quotidiennement via la prospection et les missions.";
  }
  
  // Questions sur Sullivan
  if (lowerMessage.includes("sullivan") || lowerMessage.includes("patron") || lowerMessage.includes("boss")) {
    return "Sullivan Magdaleon est mon créateur et superviseur. Il dirige l'écosystème d'agents et les 3 agences spécialisées par secteur.";
  }
  
  // Remerciements
  if (lowerMessage.includes("merci") || lowerMessage.includes("thanks")) {
    return "De rien ! C'est un plaisir de vous aider. N'hésitez pas si vous avez d'autres questions.";
  }
  
  // Au revoir
  if (lowerMessage.includes("au revoir") || lowerMessage.includes("bye") || lowerMessage.includes("à bientôt")) {
    return "À bientôt ! Restez productifs et n'hésitez pas à me solliciter si besoin.";
  }
  
  // Questions d'aide générale
  if (lowerMessage.includes("aide") || lowerMessage.includes("help") || lowerMessage.includes("que peux-tu faire")) {
    return "Je peux vous aider avec : le suivi des projets, les statistiques des campagnes, la coordination des agents, et répondre à vos questions sur l'écosystème Jarvis.";
  }
  
  // Question sur les capacités vocales
  if (lowerMessage.includes("vocal") || lowerMessage.includes("parler") || lowerMessage.includes("voix")) {
    return "Cette interface vocale utilise la reconnaissance vocale native du navigateur et Edge TTS pour ma voix. Une expérience Iron Man authentique !";
  }
  
  // Question sur l'IA
  if (lowerMessage.includes("intelligence") || lowerMessage.includes("claude") || lowerMessage.includes("opus")) {
    return "Je fonctionne sur Claude Opus 4.6 pour l'orchestration, avec des sous-agents Sonnet 4 pour l'exécution. Une architecture optimisée pour la performance et les coûts.";
  }
  
  // Réponse par défaut intelligente
  return `Je comprends que vous mentionnez "${message}". Pouvez-vous préciser votre demande ? Je peux vous aider avec la gestion des projets, le suivi des agents, ou répondre à vos questions sur l'écosystème.`;
};

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();
    
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: "Message requis" },
        { status: 400 }
      );
    }

    // For now, use mock responses
    // TODO: Integrate with OpenClaw API when ready
    const response = generateMockResponse(message);
    
    return NextResponse.json({ 
      response,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Erreur API chat:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "Jarvis Chat API opérationnelle",
    timestamp: new Date().toISOString(),
    features: [
      "Réponses contextuelles intelligentes",
      "Support des salutations et questions courantes",
      "Informations sur les projets et agents",
      "Intégration OpenClaw à venir"
    ]
  });
}