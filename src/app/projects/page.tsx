"use client";
import { useEffect, useState } from "react";

interface Project {
  id: string;
  name: string;
  desc: string;
  status: string;
  category: string;
  progress: number;
  metrics: Record<string, any>;
  nextAction: string;
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-500/20 text-green-400",
  blocked: "bg-red-500/20 text-red-400",
  paused: "bg-yellow-500/20 text-yellow-400",
  planned: "bg-zinc-700 text-zinc-400",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Actif",
  blocked: "Bloqué",
  paused: "En pause",
  planned: "Planifié",
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetch("/api/projects").then(r => r.json()).then(setProjects);
  }, []);

  const categories = ["all", ...Array.from(new Set(projects.map(p => p.category)))];
  const filtered = filter === "all" ? projects : projects.filter(p => p.category === filter);
  const activeCount = projects.filter(p => p.status === "active").length;
  const blockedCount = projects.filter(p => p.status === "blocked").length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">📁 Projets</h1>
          <p className="text-sm text-zinc-500">{projects.length} projets · {activeCount} actifs · {blockedCount} bloqués</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === cat ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700"
            }`}
          >
            {cat === "all" ? "Tous" : cat}
          </button>
        ))}
      </div>

      {/* Project grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map(p => (
          <div key={p.id} className={`bg-zinc-900 border rounded-xl p-5 transition-all ${
            p.status === "active" ? "border-zinc-700" : p.status === "blocked" ? "border-red-500/30" : "border-zinc-800"
          }`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-sm">{p.name}</h3>
                <p className="text-xs text-zinc-500 mt-0.5">{p.category}</p>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${STATUS_COLORS[p.status] || ""}`}>
                {STATUS_LABELS[p.status] || p.status}
              </span>
            </div>

            <p className="text-xs text-zinc-400 mb-3">{p.desc}</p>

            {/* Progress bar */}
            <div className="mb-3">
              <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                <span>Progression</span>
                <span>{p.progress}%</span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full ${
                    p.progress >= 70 ? "bg-green-500" : p.progress >= 40 ? "bg-blue-500" : p.progress >= 20 ? "bg-yellow-500" : "bg-zinc-600"
                  }`}
                  style={{ width: `${p.progress}%` }}
                ></div>
              </div>
            </div>

            {/* Metrics */}
            {Object.keys(p.metrics).length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {Object.entries(p.metrics).map(([k, v]) => (
                  <span key={k} className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded">
                    {k.replace(/_/g, " ")}: <strong>{String(v)}</strong>
                  </span>
                ))}
              </div>
            )}

            {/* Next action */}
            <div className="flex items-start gap-2 bg-zinc-800/50 rounded-lg p-2">
              <span className="text-[10px]">▶</span>
              <p className="text-[11px] text-zinc-400">{p.nextAction}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
