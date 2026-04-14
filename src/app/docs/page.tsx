"use client";
import { useEffect, useState } from "react";

export default function DocsPage() {
  const [docs, setDocs] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");

  useEffect(() => {
    fetch("/api/docs").then(r => r.json()).then(setDocs);
  }, []);

  const filtered = docs.filter(d => {
    if (search && !d.filename.toLowerCase().includes(search.toLowerCase())) return false;
    if (catFilter && d.category !== catFilter) return false;
    return true;
  });

  const categories = [...new Set(docs.map(d => d.category))].sort();

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
        DOCUMENTS ({docs.length})
      </h1>
      <div className="flex gap-3 mb-6">
        <input
          type="text"
          placeholder="RECHERCHER..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-4 py-2 text-sm flex-1"
          style={{ 
            backgroundColor: '#000000',
            border: '1px solid #222',
            color: '#e0e0e0',
            fontFamily: "'Courier New', 'Consolas', monospace"
          }}
          onFocus={(e) => e.currentTarget.style.border = '1px solid #e0e0e0'}
          onBlur={(e) => e.currentTarget.style.border = '1px solid #222'}
        />
        <select
          value={catFilter}
          onChange={e => setCatFilter(e.target.value)}
          className="px-4 py-2 text-sm"
          style={{ 
            backgroundColor: '#000000',
            border: '1px solid #222',
            color: '#e0e0e0',
            fontFamily: "'Courier New', 'Consolas', monospace"
          }}
          onFocus={(e) => e.currentTarget.style.border = '1px solid #e0e0e0'}
          onBlur={(e) => e.currentTarget.style.border = '1px solid #222'}
        >
          <option value="">TOUTES CATEGORIES</option>
          {categories.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
        </select>
      </div>
      <div 
        className="overflow-hidden"
        style={{ 
          backgroundColor: '#000000',
          border: '1px solid #222'
        }}
      >
        <table 
          className="w-full text-sm"
          style={{ fontFamily: "'Courier New', 'Consolas', monospace" }}
        >
          <thead>
            <tr 
              className="text-left"
              style={{ borderBottom: '1px solid #222' }}
            >
              <th 
                className="p-4"
                style={{ 
                  color: '#666',
                  fontFamily: "'Courier New', 'Consolas', monospace",
                  letterSpacing: '0.1em'
                }}
              >
                FICHIER
              </th>
              <th 
                className="p-4"
                style={{ 
                  color: '#666',
                  fontFamily: "'Courier New', 'Consolas', monospace",
                  letterSpacing: '0.1em'
                }}
              >
                CATEGORIE
              </th>
              <th 
                className="p-4"
                style={{ 
                  color: '#666',
                  fontFamily: "'Courier New', 'Consolas', monospace",
                  letterSpacing: '0.1em'
                }}
              >
                TAILLE
              </th>
              <th 
                className="p-4"
                style={{ 
                  color: '#666',
                  fontFamily: "'Courier New', 'Consolas', monospace",
                  letterSpacing: '0.1em'
                }}
              >
                MODIFIE
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d, i) => (
              <tr 
                key={d.filename} 
                style={{ 
                  borderBottom: '1px solid #222',
                  backgroundColor: i % 2 === 0 ? '#000000' : '#0a0a0a'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#111'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = i % 2 === 0 ? '#000000' : '#0a0a0a'}
              >
                <td 
                  className="p-4 text-xs"
                  style={{ 
                    color: '#e0e0e0',
                    fontFamily: "'Courier New', 'Consolas', monospace"
                  }}
                >
                  {d.filename}
                </td>
                <td className="p-4">
                  <span 
                    className="px-2 py-1 text-xs"
                    style={{ 
                      backgroundColor: '#000000',
                      color: '#666',
                      border: '1px solid #222',
                      fontFamily: "'Courier New', 'Consolas', monospace"
                    }}
                  >
                    {d.category.toUpperCase()}
                  </span>
                </td>
                <td 
                  className="p-4"
                  style={{ 
                    color: '#666',
                    fontFamily: "'Courier New', 'Consolas', monospace"
                  }}
                >
                  {(d.size / 1024).toFixed(1)} KB
                </td>
                <td 
                  className="p-4"
                  style={{ 
                    color: '#666',
                    fontFamily: "'Courier New', 'Consolas', monospace"
                  }}
                >
                  {new Date(d.mtime).toLocaleDateString("fr-FR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
