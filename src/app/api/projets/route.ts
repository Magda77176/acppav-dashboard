import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface Task {
  id: string;
  title: string;
  desc: string;
  assignee: string;
  priority: string;
  project: string;
  status: string;
}

interface Campaign {
  id: string;
  type: string;
  name: string;
  date: string;
  status: string;
  target: string;
  details: any;
  result: string;
  pause_reason?: string;
}

interface ProjectData {
  id: string;
  name: string;
  priority: 'P1' | 'P2' | 'P3';
  description: string;
  status: 'Actif' | 'En pause' | 'Terminé';
  progress: number;
  kpis: Record<string, number | string>;
  lastActivity: {
    date: string;
    description: string;
  };
  tasks: Task[];
  campaigns: Campaign[];
}

export async function GET() {
  try {
    // Lire les fichiers de données
    const tasksPath = path.join(process.cwd(), 'data', 'tasks.json');
    const campaignsPath = path.join(process.cwd(), 'data', 'campaigns.json');
    
    const tasksData = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));
    const campaignsData = JSON.parse(fs.readFileSync(campaignsPath, 'utf8'));
    
    const tasks: Task[] = tasksData.tasks;
    const campaigns: Campaign[] = campaignsData;

    // Définition des projets avec leurs métadonnées
    const projectsConfig = [
      {
        id: 'saphir-noir',
        name: 'Saphir Noir',
        priority: 'P1' as const,
        description: 'Prospection photographes mariage',
        status: 'En pause' as const,
      },
      {
        id: 'infinity-medical',
        name: 'Infinity Medical',
        priority: 'P1' as const,
        description: 'Prospection dentistes LinkedIn',
        status: 'En pause' as const,
      },
      {
        id: 'freelance-seo',
        name: 'Freelance SEO',
        priority: 'P1' as const,
        description: 'Missions freelance Sullivan',
        status: 'Actif' as const,
      },
      {
        id: 'acppav',
        name: 'ACPPAV',
        priority: 'P2' as const,
        description: 'Articles formation pharmacie',
        status: 'Actif' as const,
      },
      {
        id: 'ici-pour-gagner',
        name: 'IciPourGagner',
        priority: 'P2' as const,
        description: 'Blog affiliation SEO',
        status: 'Actif' as const,
      },
      {
        id: 'agence-eve',
        name: "Agence d'Eve",
        priority: 'P3' as const,
        description: 'SEO local artisans BTP',
        status: 'Actif' as const,
      },
      {
        id: 'konnecting-people',
        name: 'Konnecting People',
        priority: 'P3' as const,
        description: 'Trustpilot growth',
        status: 'Actif' as const,
      },
      {
        id: 'openclaw-france',
        name: 'OpenClaw France',
        priority: 'P1' as const,
        description: 'SaaS assistant IA',
        status: 'Actif' as const,
      },
    ];

    // Calculer les données pour chaque projet
    const projects: ProjectData[] = projectsConfig.map(config => {
      const projectTasks = tasks.filter(task => 
        task.project === config.name || 
        (config.id === 'saphir-noir' && task.project === 'Saphir Noir') ||
        (config.id === 'infinity-medical' && task.project === 'Infinity Medical') ||
        (config.id === 'freelance-seo' && task.project === 'Freelance SEO') ||
        (config.id === 'ici-pour-gagner' && task.project === 'IciPourGagner') ||
        (config.id === 'agence-eve' && task.project === "Agence d'Eve") ||
        (config.id === 'konnecting-people' && task.project === 'Konnecting People') ||
        (config.id === 'openclaw-france' && task.project === 'OpenClaw France') ||
        (config.id === 'acppav' && task.project === 'ACPPAV')
      );

      const projectCampaigns = campaigns.filter(campaign => {
        const targetLower = campaign.target?.toLowerCase() || '';
        return (
          (config.id === 'saphir-noir' && (targetLower.includes('photographe') || targetLower.includes('mariage'))) ||
          (config.id === 'infinity-medical' && (targetLower.includes('dentiste') || targetLower.includes('infinity medical'))) ||
          (config.id === 'freelance-seo' && targetLower.includes('freelance')) ||
          (config.id === 'ici-pour-gagner' && targetLower.includes('ici')) ||
          (config.id === 'agence-eve' && targetLower.includes('eve')) ||
          (config.id === 'konnecting-people' && targetLower.includes('konnecting')) ||
          (config.id === 'openclaw-france' && targetLower.includes('openclaw')) ||
          (config.id === 'acppav' && targetLower.includes('acppav'))
        );
      });

      // Calculer les KPIs selon le projet
      const kpis: Record<string, number | string> = {};
      
      switch (config.id) {
        case 'saphir-noir':
          const saphirEmailCampaigns = projectCampaigns.filter(c => c.type === 'email');
          const totalEmailsSent = saphirEmailCampaigns.reduce((sum, c) => sum + (c.details?.sent || 0), 0);
          const totalPhotographers = saphirEmailCampaigns.reduce((sum, c) => sum + (c.details?.count || 0), 0);
          kpis['Emails envoyés'] = totalEmailsSent;
          kpis['Photographes contactés'] = totalPhotographers;
          kpis['Domaines contactés'] = projectCampaigns.filter(c => c.target?.includes('Mariage')).length;
          kpis['Taux réponse'] = '0%'; // À calculer avec les vraies réponses
          break;

        case 'infinity-medical':
          const linkedinCampaigns = projectCampaigns.filter(c => c.type === 'linkedin');
          const messagesSent = linkedinCampaigns.filter(c => c.details?.action === 'message').reduce((sum, c) => sum + (c.details?.count || 1), 0);
          const invitesSent = linkedinCampaigns.filter(c => c.details?.action === 'invite').reduce((sum, c) => sum + (c.details?.count || 0), 0);
          kpis['Messages LinkedIn'] = messagesSent;
          kpis['Invitations envoyées'] = invitesSent;
          kpis['Dentistes contactés'] = messagesSent + invitesSent;
          kpis['RDV obtenus'] = 1; // Jessy Bourguia a répondu avec son tel
          break;

        case 'freelance-seo':
          const freelanceTasks = projectTasks.filter(t => t.title.toLowerCase().includes('freelance') || t.desc.toLowerCase().includes('freelance'));
          kpis['Candidatures envoyées'] = 21; // Mentionné dans les campaigns
          kpis['Entretiens'] = 0;
          kpis['Missions actives'] = 0;
          break;

        case 'acppav':
          kpis['Articles publiés'] = 0;
          kpis['Articles target'] = 60;
          kpis['Conformité YMYL'] = '100%';
          break;

        case 'ici-pour-gagner':
          kpis['Articles publiés'] = 30; // Calendrier épuisé
          kpis['Trafic estimé'] = 'N/A';
          break;

        case 'agence-eve':
          kpis['Audits réalisés'] = 0;
          kpis['Clients'] = 0;
          break;

        case 'konnecting-people':
          kpis['Avis collectés'] = 0;
          kpis['Note moyenne'] = 'N/A';
          break;

        case 'openclaw-france':
          kpis['Clients'] = 1; // Sullivan utilise
          kpis['MRR'] = '0€';
          kpis['Churn'] = '0%';
          break;
      }

      // Calculer le progrès
      const totalTasks = projectTasks.length;
      const doneTasks = projectTasks.filter(t => t.status === 'done').length;
      const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

      // Dernière activité
      const sortedTasks = projectTasks.sort((a, b) => new Date(b.desc).getTime() - new Date(a.desc).getTime());
      const sortedCampaigns = projectCampaigns.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      const lastTask = sortedTasks[0];
      const lastCampaign = sortedCampaigns[0];
      
      let lastActivity = {
        date: '2026-03-13',
        description: 'Aucune activité récente'
      };

      if (lastTask && lastCampaign) {
        const taskDate = new Date('2026-03-13'); // Date fictive pour les tâches
        const campaignDate = new Date(lastCampaign.date);
        
        if (campaignDate > taskDate) {
          lastActivity = {
            date: lastCampaign.date,
            description: lastCampaign.name
          };
        } else {
          lastActivity = {
            date: '2026-03-13',
            description: lastTask.title
          };
        }
      } else if (lastCampaign) {
        lastActivity = {
          date: lastCampaign.date,
          description: lastCampaign.name
        };
      } else if (lastTask) {
        lastActivity = {
          date: '2026-03-13',
          description: lastTask.title
        };
      }

      return {
        id: config.id,
        name: config.name,
        priority: config.priority,
        description: config.description,
        status: config.status,
        progress,
        kpis,
        lastActivity,
        tasks: projectTasks,
        campaigns: projectCampaigns
      };
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error in /api/projets:', error);
    return NextResponse.json({ error: 'Failed to load projects' }, { status: 500 });
  }
}