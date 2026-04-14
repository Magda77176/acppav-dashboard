import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import path from 'path';

interface AgentData {
  id: string;
  name: string;
  emoji: string;
  role: string;
  color: string;
  status: string;
  task: string;
  activity: string;
  mood: string;
  needs: { energy: number; social: number; fun: number; hunger: number };
  personalItems: string[];
  points: number;
  achievements: string[];
  speechBubble: string;
}

interface OfficeStats {
  tasks: {
    done: number;
    in_progress: number;
    backlog: number;
  };
  lastCampaign: {
    name: string;
    date: string;
    status: string;
  } | null;
  currentDate: string;
  agents: AgentData[];
}

export async function GET() {
  try {
    // Lire les stats de tâches
    const tasksPath = path.join(process.cwd(), 'data', 'tasks.json');
    const tasksData = JSON.parse(readFileSync(tasksPath, 'utf-8'));
    
    // Compter les tâches par statut
    const taskStats = {
      done: tasksData.tasks.filter((t: any) => t.status === 'done').length,
      in_progress: tasksData.tasks.filter((t: any) => t.status === 'in_progress').length,
      backlog: tasksData.tasks.filter((t: any) => t.status === 'pending' || t.status === 'backlog').length,
    };

    // Lire les campagnes
    const campaignsPath = path.join(process.cwd(), 'data', 'campaigns.json');
    const campaignsData = JSON.parse(readFileSync(campaignsPath, 'utf-8'));
    
    // Trouver la dernière campagne
    const lastCampaign = campaignsData.length > 0 ? {
      name: campaignsData[0].name,
      date: campaignsData[0].date,
      status: campaignsData[0].status
    } : null;

    // Lire les agents réels depuis les fichiers AGENT.md
    const agentsPath = '/root/openclaw/agents';
    const agentFolders = [
      'prospection', 'copywriter', 'commercial-medical', 'acppav', 
      'seo-expert', 'copywriter-email', 'linkedin-outreach', 
      'agent-sullivan', 'content-machine', 'veille-opportunites',
      'konnecting-people', 'da-uiux'
    ];

    const agents: AgentData[] = [];
    const agentEmojis = ['🎯', '✍️', '🏥', '💊', '🔍', '📧', '💼', '🕵️', '⚡', '👁️', '🌟', '🎨'];
    const agentColors = [
      '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', 
      '#ffeaa7', '#dda0dd', '#98d8c8', '#f7dc6f',
      '#bb8fce', '#85c1e9', '#f8c471', '#82e0aa'
    ];
    const statuses = ['working', 'hunting', 'creating', 'analyzing', 'networking', 'playing'];
    const moods = ['focused', 'energetic', 'creative', 'analytical', 'social', 'relaxed'];
    
    agentFolders.forEach((folder, index) => {
      try {
        const agentFilePath = path.join(agentsPath, folder, 'AGENT.md');
        const agentContent = readFileSync(agentFilePath, 'utf-8');
        
        // Parser le nom et la mission depuis le contenu
        const lines = agentContent.split('\n');
        const title = lines.find(l => l.startsWith('# Agent ')) || '# Agent Unknown';
        const subtitle = lines.find(l => l.startsWith('## ')) || '## Expert';
        
        const name = title.replace('# Agent ', '').trim();
        const role = subtitle.replace('## ', '').split('—')[0].trim();
        
        // Récupérer une tâche récente liée à cet agent
        const agentTasks = tasksData.tasks.filter((t: any) => 
          t.assignee?.toLowerCase().includes(name.toLowerCase()) || 
          t.title.toLowerCase().includes(name.toLowerCase()) ||
          t.desc.toLowerCase().includes(name.toLowerCase())
        );
        const currentTask = agentTasks[0]?.title || `Développer ${name}`;
        
        agents.push({
          id: `agent-${index + 1}`,
          name,
          emoji: agentEmojis[index] || '🤖',
          role,
          color: agentColors[index] || '#888888',
          status: statuses[index % statuses.length],
          task: currentTask,
          activity: `${statuses[index % statuses.length].charAt(0).toUpperCase()}${statuses[index % statuses.length].slice(1)}`,
          mood: moods[index % moods.length],
          needs: {
            energy: 60 + Math.floor(Math.random() * 40),
            social: 40 + Math.floor(Math.random() * 60),
            fun: 30 + Math.floor(Math.random() * 70),
            hunger: 20 + Math.floor(Math.random() * 80)
          },
          personalItems: ['laptop', 'coffee', 'notebook'],
          points: Math.floor(Math.random() * 500) + 100,
          achievements: ['Expert', 'Productif'],
          speechBubble: [
            'En cours de développement...', 
            'Nouvelle mission!', 
            'Code terminé!',
            'Analyse des données...',
            'Pause café? ☕',
            'Résultats prometteurs!'
          ][Math.floor(Math.random() * 6)]
        });
      } catch (err) {
        console.error(`Error reading agent ${folder}:`, err);
      }
    });

    const response: OfficeStats = {
      tasks: taskStats,
      lastCampaign,
      currentDate: new Date().toLocaleDateString('fr-FR'),
      agents
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in /api/office/live:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}