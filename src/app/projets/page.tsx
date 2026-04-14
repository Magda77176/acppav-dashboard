"use client";
import { useEffect, useState } from "react";

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

type ViewMode = 'grid' | 'list';
type PriorityFilter = 'all' | 'P1' | 'P2' | 'P3';

const PRIORITY_COLORS = {
  P1: 'text-red-400',
  P2: 'text-orange-400', 
  P3: 'text-green-400'
};

const STATUS_COLORS = {
  'Actif': 'border-green-400 text-green-400',
  'En pause': 'border-orange-400 text-orange-400',
  'Terminé': 'border-white text-white'
};

export default function ProjetsPage() {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/projets')
      .then(r => r.json())
      .then(data => {
        setProjects(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading projects:', err);
        setLoading(false);
      });
  }, []);

  const filteredProjects = priorityFilter === 'all' 
    ? projects 
    : projects.filter(p => p.priority === priorityFilter);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR');
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-zinc-800 rounded w-48 mb-2"></div>
          <div className="h-4 bg-zinc-800 rounded w-96"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6" style={{ fontFamily: "'Courier New', 'Consolas', monospace" }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white" style={{ letterSpacing: '0.1em' }}>
            PROJECTS
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1" style={{ letterSpacing: '0.05em' }}>
            {projects.length} PROJECTS • {projects.filter(p => p.status === 'Actif').length} ACTIVE • {projects.filter(p => p.status === 'En pause').length} PAUSED
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-2">
          <div className="flex bg-black border border-gray-600 p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 text-xs font-medium transition-all ${
                viewMode === 'grid' 
                  ? 'bg-white text-black' 
                  : 'text-gray-400 hover:text-white'
              }`}
              style={{ letterSpacing: '0.1em' }}
            >
              GRID
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 text-xs font-medium transition-all ${
                viewMode === 'list' 
                  ? 'bg-white text-black' 
                  : 'text-gray-400 hover:text-white'
              }`}
              style={{ letterSpacing: '0.1em' }}
            >
              LIST
            </button>
          </div>
        </div>
      </div>

      {/* Priority filters */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'P1', 'P2', 'P3'] as PriorityFilter[]).map(priority => (
          <button
            key={priority}
            onClick={() => setPriorityFilter(priority)}
            className={`px-3 py-1.5 text-xs font-medium transition-all border ${
              priorityFilter === priority 
                ? 'bg-white text-black border-white' 
                : 'bg-black text-gray-400 border-gray-600 hover:border-white'
            }`}
            style={{ letterSpacing: '0.1em' }}
          >
            {priority === 'all' ? 'ALL' : (
              <span className={PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS] || ''}>
                {priority}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Projects display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredProjects.map(project => (
            <ProjectCard 
              key={project.id} 
              project={project} 
              expanded={expandedProject === project.id}
              onToggle={() => setExpandedProject(
                expandedProject === project.id ? null : project.id
              )}
              formatDate={formatDate}
            />
          ))}
        </div>
      ) : (
        <ProjectTable 
          projects={filteredProjects} 
          formatDate={formatDate}
          onRowClick={(projectId) => setExpandedProject(
            expandedProject === projectId ? null : projectId
          )}
          expandedProject={expandedProject}
        />
      )}
    </div>
  );
}

// Project Card Component
function ProjectCard({ 
  project, 
  expanded, 
  onToggle, 
  formatDate 
}: { 
  project: ProjectData;
  expanded: boolean;
  onToggle: () => void;
  formatDate: (date: string) => string;
}) {
  return (
    <div 
      className={`bg-black border p-5 transition-all cursor-pointer hover:border-white ${
        expanded ? 'border-white' : 'border-gray-600'
      }`}
      onClick={onToggle}
    >
      {/* Card header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-sm font-bold ${PRIORITY_COLORS[project.priority]}`} style={{ letterSpacing: '0.1em' }}>
              {project.priority}
            </span>
            <h3 className="font-semibold text-sm text-white" style={{ letterSpacing: '0.05em' }}>{project.name}</h3>
          </div>
          <p className="text-xs text-gray-600">{project.description}</p>
        </div>
        <span className={`px-2 py-0.5 text-[10px] font-medium border ${STATUS_COLORS[project.status]}`} style={{ letterSpacing: '0.1em' }}>
          {project.status.toUpperCase()}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex justify-between text-[10px] text-gray-600 mb-1">
          <span style={{ letterSpacing: '0.1em' }}>PROGRESS</span>
          <span>{project.progress}%</span>
        </div>
        <div className="w-full bg-gray-800 h-1.5">
          <div
            className="h-1.5 transition-all bg-white"
            style={{ width: `${project.progress}%` }}
          ></div>
        </div>
      </div>

      {/* KPIs */}
      <div className="flex flex-wrap gap-1 mb-3">
        {Object.entries(project.kpis).slice(0, 3).map(([key, value]) => (
          <span key={key} className="text-[10px] bg-gray-800 text-gray-300 px-2 py-0.5" style={{ letterSpacing: '0.05em' }}>
            {key.toUpperCase()}: <strong>{value}</strong>
          </span>
        ))}
      </div>

      {/* Last activity */}
      <div className="flex items-start gap-2 bg-gray-900 p-2 mb-3">
        <div>
          <p className="text-[11px] text-gray-400">{project.lastActivity.description}</p>
          <p className="text-[10px] text-gray-600">{formatDate(project.lastActivity.date)}</p>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-gray-600 pt-3 mt-3">
          <div className="space-y-3">
            {/* All KPIs */}
            <div>
              <h4 className="text-xs font-medium text-gray-400 mb-2" style={{ letterSpacing: '0.1em' }}>KPIS COMPLETE</h4>
              <div className="grid grid-cols-2 gap-1">
                {Object.entries(project.kpis).map(([key, value]) => (
                  <span key={key} className="text-[10px] bg-gray-800 text-gray-300 px-2 py-1" style={{ letterSpacing: '0.05em' }}>
                    {key.toUpperCase()}: <strong>{value}</strong>
                  </span>
                ))}
              </div>
            </div>

            {/* Tasks */}
            {project.tasks.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-gray-400 mb-2" style={{ letterSpacing: '0.1em' }}>TASKS ({project.tasks.length})</h4>
                <div className="space-y-1">
                  {project.tasks.slice(0, 3).map(task => (
                    <div key={task.id} className="text-[10px] bg-gray-800 p-2">
                      <div className="flex justify-between items-start">
                        <span className="font-medium text-white">{task.title}</span>
                        <span className={`px-1.5 py-0.5 text-[9px] border ${
                          task.status === 'done' ? 'border-green-400 text-green-400' :
                          task.status === 'in_progress' ? 'border-white text-white' :
                          'border-gray-600 text-gray-400'
                        }`}>
                          {task.status === 'done' ? 'DONE' : 
                           task.status === 'in_progress' ? 'PROGRESS' : 'TODO'}
                        </span>
                      </div>
                      <p className="text-gray-500 mt-1">{task.desc.substring(0, 80)}...</p>
                    </div>
                  ))}
                  {project.tasks.length > 3 && (
                    <p className="text-[10px] text-gray-500">+{project.tasks.length - 3} MORE TASKS...</p>
                  )}
                </div>
              </div>
            )}

            {/* Campaigns */}
            {project.campaigns.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-gray-400 mb-2" style={{ letterSpacing: '0.1em' }}>CAMPAIGNS ({project.campaigns.length})</h4>
                <div className="space-y-1">
                  {project.campaigns.slice(0, 3).map(campaign => (
                    <div key={campaign.id} className="text-[10px] bg-gray-800 p-2">
                      <div className="flex justify-between items-start">
                        <span className="font-medium text-white">{campaign.name}</span>
                        <span className={`px-1.5 py-0.5 text-[9px] border ${
                          campaign.status === 'done' ? 'border-green-400 text-green-400' :
                          campaign.status === 'paused' ? 'border-orange-400 text-orange-400' :
                          'border-white text-white'
                        }`}>
                          {campaign.status === 'done' ? 'DONE' : 
                           campaign.status === 'paused' ? 'PAUSED' : 'ACTIVE'}
                        </span>
                      </div>
                      <p className="text-gray-500 mt-1">{campaign.result}</p>
                    </div>
                  ))}
                  {project.campaigns.length > 3 && (
                    <p className="text-[10px] text-gray-500">+{project.campaigns.length - 3} MORE CAMPAIGNS...</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      <p className="text-[10px] text-gray-600 text-center mt-2">
        {expanded ? 'COLLAPSE' : 'EXPAND'}
      </p>
    </div>
  );
}

// Project Table Component
function ProjectTable({ 
  projects, 
  formatDate, 
  onRowClick, 
  expandedProject 
}: { 
  projects: ProjectData[];
  formatDate: (date: string) => string;
  onRowClick: (id: string) => void;
  expandedProject: string | null;
}) {
  return (
    <div className="bg-black border border-gray-600 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-900 border-b border-gray-600">
            <tr className="text-left">
              <th className="px-4 py-3 text-xs font-medium text-gray-400" style={{ letterSpacing: '0.1em' }}>PROJECT</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-400" style={{ letterSpacing: '0.1em' }}>PRIORITY</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-400" style={{ letterSpacing: '0.1em' }}>STATUS</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-400" style={{ letterSpacing: '0.1em' }}>PROGRESS</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-400" style={{ letterSpacing: '0.1em' }}>KPIS</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-400" style={{ letterSpacing: '0.1em' }}>LAST ACTIVITY</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-600">
            {projects.map(project => (
              <tr 
                key={project.id}
                onClick={() => onRowClick(project.id)}
                className="hover:bg-gray-900 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-white">{project.name}</p>
                    <p className="text-xs text-gray-600">{project.description}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-sm font-bold ${PRIORITY_COLORS[project.priority]}`} style={{ letterSpacing: '0.1em' }}>
                    {project.priority}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 text-[10px] font-medium border ${STATUS_COLORS[project.status]}`} style={{ letterSpacing: '0.1em' }}>
                    {project.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-800 h-1.5">
                      <div
                        className="h-1.5 bg-white"
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-400">{project.progress}%</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(project.kpis).slice(0, 2).map(([key, value]) => (
                      <span key={key} className="text-[10px] bg-gray-800 text-gray-300 px-1.5 py-0.5" style={{ letterSpacing: '0.05em' }}>
                        {key.toUpperCase()}: {value}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div>
                    <p className="text-xs text-white">{project.lastActivity.description.substring(0, 40)}...</p>
                    <p className="text-[10px] text-gray-600">{formatDate(project.lastActivity.date)}</p>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}