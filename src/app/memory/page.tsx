"use client";
import { useEffect, useState } from "react";

export default function MemoryPage() {
  const [files, setFiles] = useState<any[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [tab, setTab] = useState<"daily" | "longterm">("daily");
  const [longterm, setLongterm] = useState("");

  useEffect(() => {
    fetch("/api/memory").then(r => r.json()).then(setFiles);
  }, []);

  const loadFile = (date: string) => {
    setSelected(date);
    setTab("daily");
    fetch(`/api/memory/${date}`).then(r => r.json()).then(d => setContent(d.content || ""));
  };

  const loadLongterm = () => {
    setTab("longterm");
    setSelected(null);
    if (!longterm) fetch("/api/memory/longterm").then(r => r.json()).then(d => setLongterm(d.content || ""));
  };

  return (
    <div 
      className="max-w-7xl mx-auto flex gap-6" 
      style={{ 
        height: "calc(100vh - 4rem)",
        backgroundColor: '#000000',
        fontFamily: "'Courier New', 'Consolas', monospace"
      }}
    >
      {/* Sidebar */}
      <div 
        className="w-64 shrink-0 overflow-auto"
        style={{ 
          backgroundColor: '#000000',
          border: '1px solid #222'
        }}
      >
        <div 
          className="p-4 space-y-1"
          style={{ borderBottom: '1px solid #222' }}
        >
          <button 
            onClick={loadLongterm} 
            className="w-full text-left px-3 py-2 text-sm"
            style={{
              backgroundColor: tab === "longterm" ? '#000000' : '#000000',
              color: tab === "longterm" ? '#e0e0e0' : '#666',
              border: tab === "longterm" ? '1px solid #e0e0e0' : 'none',
              fontFamily: "'Courier New', 'Consolas', monospace",
              letterSpacing: '0.1em'
            }}
            onMouseEnter={(e) => {
              if (tab !== "longterm") {
                e.currentTarget.style.backgroundColor = '#0a0a0a';
                e.currentTarget.style.color = '#e0e0e0';
              }
            }}
            onMouseLeave={(e) => {
              if (tab !== "longterm") {
                e.currentTarget.style.backgroundColor = '#000000';
                e.currentTarget.style.color = '#666';
              }
            }}
          >
            MEMORY.MD (LONG-TERME)
          </button>
        </div>
        <div className="p-2 space-y-0.5 max-h-[70vh] overflow-auto">
          {files.map(f => (
            <button
              key={f.date}
              onClick={() => loadFile(f.date)}
              className="w-full text-left px-3 py-1.5 text-xs truncate"
              style={{
                backgroundColor: selected === f.date ? '#000000' : '#000000',
                color: selected === f.date ? '#e0e0e0' : '#666',
                border: selected === f.date ? '1px solid #e0e0e0' : 'none',
                fontFamily: "'Courier New', 'Consolas', monospace"
              }}
              onMouseEnter={(e) => {
                if (selected !== f.date) {
                  e.currentTarget.style.backgroundColor = '#0a0a0a';
                  e.currentTarget.style.color = '#e0e0e0';
                }
              }}
              onMouseLeave={(e) => {
                if (selected !== f.date) {
                  e.currentTarget.style.backgroundColor = '#000000';
                  e.currentTarget.style.color = '#666';
                }
              }}
            >
              {f.date}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div 
        className="flex-1 p-6 overflow-auto"
        style={{ 
          backgroundColor: '#000000',
          border: '1px solid #222'
        }}
      >
        {tab === "longterm" ? (
          <>
            <h2 
              className="text-xl font-bold mb-4"
              style={{ 
                color: '#666',
                fontFamily: "'Courier New', 'Consolas', monospace",
                letterSpacing: '0.1em'
              }}
            >
              MEMORY
            </h2>
            <pre 
              className="whitespace-pre-wrap text-sm leading-relaxed"
              style={{ 
                color: '#e0e0e0',
                fontFamily: "'Courier New', 'Consolas', monospace"
              }}
            >
              {longterm}
            </pre>
          </>
        ) : selected ? (
          <>
            <h2 
              className="text-xl font-bold mb-4"
              style={{ 
                color: '#666',
                fontFamily: "'Courier New', 'Consolas', monospace",
                letterSpacing: '0.1em'
              }}
            >
              {selected}
            </h2>
            <pre 
              className="whitespace-pre-wrap text-sm leading-relaxed"
              style={{ 
                color: '#e0e0e0',
                fontFamily: "'Courier New', 'Consolas', monospace"
              }}
            >
              {content}
            </pre>
          </>
        ) : (
          <div 
            className="flex items-center justify-center h-full"
            style={{ color: '#666' }}
          >
            <p 
              style={{ 
                fontFamily: "'Courier New', 'Consolas', monospace",
                letterSpacing: '0.1em'
              }}
            >
              SELECTIONNER UN FICHIER MEMOIRE
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
