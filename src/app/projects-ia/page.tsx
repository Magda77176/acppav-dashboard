"use client";
import { useEffect, useState } from "react";

interface ProjectIA {
  id: string;
  name: string;
  hasAgent: boolean;
  hasMcp: boolean;
  hasWorkflow: boolean;
  hasDockerfile: boolean;
  hasCICD: boolean;
  hasTests: boolean;
  gitStatus: string;
  gitRemote: string | null;
  lastCommit: string | null;
  gcpUrl: string | null;
  files: string[];
}

export default function ProjectsIAPage() {
  const [projects, setProjects] = useState<ProjectIA[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [deploying, setDeploying] = useState<string | null>(null);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    const r = await fetch("/api/projects-ia");
    const d = await r.json();
    setProjects(d.projects || []);
    setLoading(false);
  };

  const createProject = async () => {
    if (!newName) return;
    setCreating(true);
    await fetch("/api/projects-ia", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });
    setNewName("");
    setCreating(false);
    loadProjects();
  };

  const deploy = async (id: string, action: string) => {
    setDeploying(`${id}:${action}`);
    try {
      const r = await fetch(`/api/projects-ia/${id}/deploy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const d = await r.json();
      if (d.success) {
        alert(`✅ ${action} — ${d.url || "OK"}`);
        loadProjects();
      } else {
        alert(`❌ ${action} — ${d.error}`);
      }
    } catch (e) {
      alert(`❌ ${action} failed`);
    }
    setDeploying(null);
  };

  const stackItems = [
    { key: "hasAgent", label: "ADK", icon: "🤖" },
    { key: "hasMcp", label: "MCP", icon: "🔌" },
    { key: "hasWorkflow", label: "GRAPH", icon: "🔀" },
    { key: "hasDockerfile", label: "DOCKER", icon: "📦" },
    { key: "hasCICD", label: "CI/CD", icon: "🚀" },
    { key: "hasTests", label: "TESTS", icon: "✅" },
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="w-5 h-5 border border-gray-700 border-t-white" style={{animation: 'spin 1s linear infinite'}} />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-4" style={{ fontFamily: "'Courier New', monospace" }}>
      
      {/* Header */}
      <div className="border border-gray-800 bg-black p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-sm sm:text-base font-bold text-white" style={{ letterSpacing: '0.15em' }}>
              PROJETS IA — GCP NATIVE
            </h1>
            <p className="text-[10px] text-gray-600 mt-1" style={{ letterSpacing: '0.05em' }}>
              ADK · MCP · LANGGRAPH · VERTEX AI · CLOUD RUN · OPENTELEMETRY
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="nom-projet"
              className="bg-black border border-gray-700 text-white text-xs px-3 py-2 w-36 font-mono"
              style={{ letterSpacing: '0.05em' }}
            />
            <button
              onClick={createProject}
              disabled={!newName || creating}
              className="border border-green-800 text-green-400 text-[10px] px-3 py-2 hover:border-green-400 disabled:opacity-30"
              style={{ letterSpacing: '0.1em' }}
            >
              {creating ? "..." : "+ NOUVEAU"}
            </button>
          </div>
        </div>
      </div>

      {/* Projects grid */}
      <div className="space-y-3">
        {projects.length === 0 ? (
          <div className="border border-gray-800 bg-black p-8 text-center">
            <p className="text-gray-600 text-xs" style={{ letterSpacing: '0.1em' }}>
              AUCUN PROJET — CRÉEZ-EN UN DEPUIS LE TEMPLATE
            </p>
          </div>
        ) : projects.map((p) => (
          <div key={p.id} className="border border-gray-800 bg-black">
            {/* Project header */}
            <div
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-950"
              onClick={() => setExpandedProject(expandedProject === p.id ? null : p.id)}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={`w-2 h-2 shrink-0 ${p.gitStatus === 'clean' ? 'bg-green-400' : p.gitStatus === 'modified' ? 'bg-orange-400' : 'bg-gray-600'}`} />
                <div className="min-w-0">
                  <span className="text-sm text-white font-bold" style={{ letterSpacing: '0.08em' }}>
                    {p.id.toUpperCase()}
                  </span>
                  {p.gitRemote && (
                    <span className="text-[9px] text-gray-600 ml-2">
                      {p.gitRemote.replace('https://github.com/', '').replace('.git', '')}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Stack badges */}
              <div className="flex items-center gap-1">
                {stackItems.map(s => (
                  <span
                    key={s.key}
                    className={`text-[8px] px-1.5 py-0.5 border ${
                      (p as any)[s.key]
                        ? 'border-green-800 text-green-400'
                        : 'border-gray-800 text-gray-700'
                    }`}
                    title={s.label}
                  >
                    {s.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Expanded details */}
            {expandedProject === p.id && (
              <div className="border-t border-gray-800 p-4 space-y-4">
                {/* Last commit */}
                {p.lastCommit && (
                  <div className="text-[10px] text-gray-500">
                    <span className="text-gray-600">LAST COMMIT:</span> {p.lastCommit}
                  </div>
                )}

                {/* Files */}
                <div>
                  <h3 className="text-[10px] text-gray-600 mb-2" style={{ letterSpacing: '0.1em' }}>FILES</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 max-h-40 overflow-y-auto">
                    {p.files.map(f => (
                      <span key={f} className="text-[10px] text-gray-500 truncate">{f}</span>
                    ))}
                  </div>
                </div>

                {/* Deploy actions */}
                <div>
                  <h3 className="text-[10px] text-gray-600 mb-2" style={{ letterSpacing: '0.1em' }}>ACTIONS</h3>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => deploy(p.id, "git-init")}
                      disabled={deploying !== null}
                      className="border border-gray-700 text-gray-400 text-[10px] px-3 py-1.5 hover:border-white hover:text-white disabled:opacity-30"
                    >
                      {deploying === `${p.id}:git-init` ? "..." : "GIT INIT"}
                    </button>
                    <button
                      onClick={() => deploy(p.id, "git-push")}
                      disabled={deploying !== null || !p.gitRemote}
                      className="border border-blue-800 text-blue-400 text-[10px] px-3 py-1.5 hover:border-blue-400 disabled:opacity-30"
                    >
                      {deploying === `${p.id}:git-push` ? "..." : "GIT PUSH"}
                    </button>
                    <button
                      onClick={() => deploy(p.id, "docker-build")}
                      disabled={deploying !== null || !p.hasDockerfile}
                      className="border border-orange-800 text-orange-400 text-[10px] px-3 py-1.5 hover:border-orange-400 disabled:opacity-30"
                    >
                      {deploying === `${p.id}:docker-build` ? "..." : "BUILD DOCKER"}
                    </button>
                    <button
                      onClick={() => deploy(p.id, "deploy-gcp")}
                      disabled={deploying !== null || !p.hasDockerfile}
                      className="border border-green-800 text-green-400 text-[10px] px-3 py-1.5 hover:border-green-400 disabled:opacity-30"
                    >
                      {deploying === `${p.id}:deploy-gcp` ? "DEPLOYING..." : "🚀 DEPLOY GCP"}
                    </button>
                  </div>
                </div>

                {/* GCP URL */}
                {p.gcpUrl && (
                  <div className="text-[10px]">
                    <span className="text-gray-600">GCP URL: </span>
                    <a href={p.gcpUrl} target="_blank" className="text-green-400 hover:underline">{p.gcpUrl}</a>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
