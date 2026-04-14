import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface ChatMessage {
  id: string;
  timestamp: number;
  from: 'sullivan' | 'agent';
  agentId?: string;
  message: string;
  mood?: string;
}

interface ChatHistory {
  [agentId: string]: ChatMessage[];
}

// Réponses contextuelles basées sur le rôle et mood de chaque agent
const agentResponses = {
  'jarvis': {
    'focused': [
      "Tout est sous contrôle, Sullivan. Les agents performent à 94.7%.",
      "J'optimise les workflows en temps réel. Quelque chose de spécifique ?",
      "Systems nominal. Prêt pour les prochaines directives.",
      "L'orchestration multi-étages fonctionne parfaitement."
    ],
    'relaxed': [
      "Salut Sullivan ! Petit break bien mérité après cette session productive.",
      "Comment ça va ? Je surveille tout depuis mon bureau.",
      "Toujours là pour coordonner l'équipe !"
    ]
  },
  'prospection': {
    'detective': [
      "J'ai des pistes intéressantes ! 🔍 Veux-tu que je creuse plus ?",
      "Mes radars détectent 12 nouveaux prospects qualifiés.",
      "La chasse est fructueuse aujourd'hui, patron !",
      "J'ai déniché quelques perles rares..."
    ],
    'focused': [
      "Mode détective activé. Recherche en cours...",
      "Les données parlent ! J'analyse les patterns."
    ]
  },
  'copywriter-email': {
    'playful': [
      "Hé Sullivan ! 🏓 Une petite partie pour libérer la créativité ?",
      "Les meilleures idées viennent pendant les breaks !",
      "Ping-pong = brainstorming en mouvement !"
    ],
    'creative': [
      "L'inspiration frappe ! J'ai 3 nouvelles approches email.",
      "Les mots dansent dans ma tête... ✍️",
      "Prêt à transformer les prospects en clients !"
    ]
  },
  'linkedin-outreach': {
    'social': [
      "Networking time ! ☕ Café + connexions = magie.",
      "J'ai élargi notre réseau de 47 contacts qualifiés !",
      "Les relations avant les transactions, toujours.",
      "LinkedIn buzze ! Notre reach explose."
    ]
  },
  'seo-expert': {
    'analytical': [
      "Les algorithmes évoluent... 📈 J'adapte nos stratégies.",
      "Core Web Vitals optimisés sur tous nos sites !",
      "J'ai identifié 23 nouvelles opportunités de mots-clés.",
      "Les data ne mentent jamais, Sullivan."
    ]
  },
  'copywriter': {
    'inspired': [
      "Eureka ! 💡 J'ai trouvé l'angle parfait pour IPG !",
      "Les mots coulent comme une rivière aujourd'hui...",
      "Inspiration à 100% ! Prêt à créer du contenu viral."
    ],
    'creative': [
      "Mode création activé. Que veux-tu que je rédige ?",
      "Post-its partout ! Mes idées débordent."
    ]
  },
  'dev-web': {
    'relaxed': [
      "Break bien mérité ! 🕹️ High score en vue !",
      "Cerveau en pause créative... Code incoming !",
      "L'arcade stimule ma logique de dev."
    ],
    'focused': [
      "Code is poetry. Sites et landing pages au top !",
      "React + performance = ma spécialité."
    ]
  },
  'commercial': {
    'confident': [
      "Deal fermé ! 💼 Les dentistes adorent notre approche.",
      "Pipeline médical en feu ! Ça sonne sans arrêt.",
      "Confiance à 100%. Next target acquired !"
    ]
  },
  'da-uiux': {
    'zen': [
      "L'aquarium inspire ma créativité... 🐠 Zen total.",
      "Design is meditation. Chaque pixel compte.",
      "Les couleurs parlent à mon âme."
    ],
    'inspired': [
      "Vision artistique claire ! Prêt à designer l'incroyable.",
      "L'art rencontre la fonction. Magic happens !"
    ]
  },
  'social-media': {
    'energetic': [
      "Viral content incoming ! 📱 Les trends sont with us !",
      "Social buzzing ! Engagement through the roof !",
      "Content machine activated !"
    ]
  },
  'veille': {
    'alert': [
      "Radars actifs ! 📡 Changements détectés dans le marché.",
      "Intelligence gathering complete. Briefing ?",
      "Surveillance mode ON. Rien n'échappe à mes capteurs."
    ]
  },
  'agent-sullivan': {
    'determined': [
      "Target in sight ! 🎯 Mission premium en approche.",
      "Rooftop strategy session. La vue aide à penser grand !",
      "Hunt mode: LEGENDARY. Prêt à décrocher du premium !"
    ]
  }
};

export async function GET() {
  try {
    const chatHistoryPath = path.join(process.cwd(), 'mission-control/data/chat-history.json');
    
    if (!fs.existsSync(chatHistoryPath)) {
      return NextResponse.json({});
    }
    
    const chatData = fs.readFileSync(chatHistoryPath, 'utf8');
    return NextResponse.json(JSON.parse(chatData));
  } catch (error) {
    console.error('Error reading chat history:', error);
    return NextResponse.json({}, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { agentId, message } = await request.json();
    
    if (!agentId || !message) {
      return NextResponse.json({ error: 'Missing agentId or message' }, { status: 400 });
    }

    // Charger l'historique existant
    const chatHistoryPath = path.join(process.cwd(), 'mission-control/data/chat-history.json');
    let chatHistory: ChatHistory = {};
    
    if (fs.existsSync(chatHistoryPath)) {
      const chatData = fs.readFileSync(chatHistoryPath, 'utf8');
      chatHistory = JSON.parse(chatData);
    }
    
    // Charger les données des agents pour le context
    const officeStatePath = path.join(process.cwd(), 'mission-control/data/office-state.json');
    const officeData = JSON.parse(fs.readFileSync(officeStatePath, 'utf8'));
    const agent = officeData.agents.find((a: any) => a.id === agentId);
    
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Ajouter le message de Sullivan
    if (!chatHistory[agentId]) {
      chatHistory[agentId] = [];
    }
    
    const sullivanMessage: ChatMessage = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      from: 'sullivan',
      message
    };
    
    chatHistory[agentId].push(sullivanMessage);

    // Générer une réponse de l'agent basée sur son mood et rôle
    const agentMood = agent.mood || 'focused';
    const agentData = (agentResponses as Record<string, Record<string, string[]>>)[agentId];
    const responses = agentData?.[agentMood] || agentData?.['focused'] || ["Salut Sullivan ! Comment puis-je t'aider ?"];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    // Ajouter la réponse de l'agent avec un petit délai simulé
    setTimeout(() => {
      const agentMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        timestamp: Date.now() + 1000,
        from: 'agent',
        agentId,
        message: randomResponse,
        mood: agentMood
      };
      
      chatHistory[agentId].push(agentMessage);
      
      // Garder seulement les 50 derniers messages par agent
      if (chatHistory[agentId].length > 50) {
        chatHistory[agentId] = chatHistory[agentId].slice(-50);
      }
      
      // Sauvegarder
      fs.writeFileSync(chatHistoryPath, JSON.stringify(chatHistory, null, 2));
    }, 1000);

    // Sauvegarder immédiatement le message de Sullivan
    fs.writeFileSync(chatHistoryPath, JSON.stringify(chatHistory, null, 2));
    
    return NextResponse.json({ 
      success: true, 
      agentResponse: randomResponse,
      agentMood 
    });
    
  } catch (error) {
    console.error('Error handling chat:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}