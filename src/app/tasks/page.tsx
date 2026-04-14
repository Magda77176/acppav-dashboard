"use client";
import { useEffect, useState } from "react";

type Task = { id: string; title: string; assignee: string; status: string; priority: string };
const COLUMNS = [
  { id: "backlog", label: "BACKLOG" },
  { id: "in_progress", label: "EN COURS" },
  { id: "review", label: "REVIEW" },
  { id: "done", label: "TERMINE" },
];

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    fetch("/api/tasks").then(r => r.json()).then(d => setTasks(Array.isArray(d) ? d : d.tasks || []));
  }, []);

  const moveTask = (id: string, newStatus: string) => {
    const updated = tasks.map(t => t.id === id ? { ...t, status: newStatus } : t);
    setTasks(updated);
    fetch("/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tasks: updated }) });
  };

  return (
    <div 
      className="max-w-7xl mx-auto"
      style={{ 
        backgroundColor: '#000000',
        fontFamily: "'Courier New', 'Consolas', monospace"
      }}
    >
      <h1 
        className="text-2xl font-bold mb-6" 
        style={{ 
          color: '#e0e0e0',
          fontFamily: "'Courier New', 'Consolas', monospace",
          letterSpacing: '0.1em'
        }}
      >
        TASKS
      </h1>
      <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory" style={{ WebkitOverflowScrolling: 'touch' }}>
        {COLUMNS.map(col => (
          <div key={col.id} className="space-y-3 min-w-[260px] sm:min-w-0 flex-1 snap-start">
            <div className="flex items-center justify-between mb-2">
              <h2 
                className="font-semibold text-sm"
                style={{ 
                  color: '#666',
                  fontFamily: "'Courier New', 'Consolas', monospace",
                  letterSpacing: '0.1em'
                }}
              >
                {col.label}
              </h2>
              <span 
                className="text-xs px-2 py-0.5"
                style={{ 
                  color: '#666',
                  fontFamily: "'Courier New', 'Consolas', monospace"
                }}
              >
                {tasks.filter(t => t.status === col.id).length}
              </span>
            </div>
            <div 
              className="space-y-2 min-h-[200px] p-3"
              style={{ 
                backgroundColor: '#000000',
                border: '1px solid #222'
              }}
            >
              {tasks.filter(t => t.status === col.id).map(task => (
                <div 
                  key={task.id} 
                  className="task-card p-3"
                  style={{ 
                    backgroundColor: '#000000',
                    border: '1px solid #222',
                    fontFamily: "'Courier New', 'Consolas', monospace"
                  }}
                >
                  <p 
                    className="text-sm font-medium mb-2"
                    style={{ color: '#e0e0e0' }}
                  >
                    {task.title}
                  </p>
                  <div className="flex items-center justify-between">
                    <span 
                      className="text-xs"
                      style={{ 
                        color: '#666',
                        fontFamily: "'Courier New', 'Consolas', monospace"
                      }}
                    >
                      {task.assignee}
                    </span>
                    <span 
                      className="text-xs"
                      style={{ 
                        color: '#666',
                        fontFamily: "'Courier New', 'Consolas', monospace"
                      }}
                    >
                      {task.priority}
                    </span>
                    <div className="flex gap-1">
                      {col.id !== "backlog" && (
                        <button 
                          onClick={() => moveTask(task.id, COLUMNS[COLUMNS.findIndex(c => c.id === col.id) - 1].id)} 
                          className="text-xs hover:border"
                          style={{ 
                            color: '#666',
                            fontFamily: "'Courier New', 'Consolas', monospace"
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.border = '1px solid #e0e0e0'}
                          onMouseLeave={(e) => e.currentTarget.style.border = 'none'}
                        >
                          ←
                        </button>
                      )}
                      {col.id !== "done" && (
                        <button 
                          onClick={() => moveTask(task.id, COLUMNS[COLUMNS.findIndex(c => c.id === col.id) + 1].id)} 
                          className="text-xs hover:border"
                          style={{ 
                            color: '#666',
                            fontFamily: "'Courier New', 'Consolas', monospace"
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.border = '1px solid #e0e0e0'}
                          onMouseLeave={(e) => e.currentTarget.style.border = 'none'}
                        >
                          →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
