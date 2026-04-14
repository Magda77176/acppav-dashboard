"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const navSections = [
  {
    title: "OVERVIEW",
    items: [
      { href: "/", label: "DASHBOARD" },
      { href: "/projets", label: "PROJETS" },
      { href: "/tasks", label: "TÂCHES" },
    ]
  },
  {
    title: "OPERATIONS",
    items: [
      { href: "/campaigns", label: "CAMPAGNES" },
      { href: "/pipeline", label: "PIPELINE" },
      { href: "/leads-medical", label: "🏥 LEADS MÉDICAUX" },
      { href: "/candidatures", label: "CANDIDATURES" },
      { href: "/calendar", label: "CALENDRIER" },
      { href: "/acppav", label: "🎓 ACPPAV" },
    ]
  },
  {
    title: "INTELLIGENCE",
    items: [
      { href: "/agents", label: "AGENTS" },
      { href: "/activity", label: "ACTIVITY FEED" },
      { href: "/monitoring", label: "MONITORING" },
      { href: "/gcp", label: "GCP OBSERVABILITÉ ☁️" },
      { href: "/projects-ia", label: "PROJETS IA" },
      { href: "/jarvis", label: "JARVIS VOICE" },
      { href: "/office", label: "BUREAU 3D" },
      { href: "/orgchart", label: "ORGANIGRAMME" },
    ]
  },
  {
    title: "SYSTEM",
    items: [
      { href: "/memory", label: "MÉMOIRE" },
      { href: "/docs", label: "DOCUMENTS" },
      { href: "/backups", label: "BACKUPS" },
    ]
  },
  {
    title: "BUSINESS",
    items: [
      { href: "/revenue", label: "REVENUE" },
      { href: "/team", label: "ÉQUIPE" },
    ]
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile sidebar open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);
  
  return (
    <>
      {/* Mobile hamburger button — only visible on mobile */}
      {!mobileOpen && (
        <button
          onClick={() => setMobileOpen(true)}
          className="sidebar-hamburger"
          aria-label="Menu"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#e0e0e0" strokeWidth="1.5">
            <line x1="3" y1="5" x2="17" y2="5" />
            <line x1="3" y1="10" x2="17" y2="10" />
            <line x1="3" y1="15" x2="17" y2="15" />
          </svg>
        </button>
      )}

      {/* Mobile overlay */}
      {mobileOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar — desktop: always visible fixed, mobile: hidden unless mobileOpen */}
      <aside 
        className={`sidebar-aside ${mobileOpen ? 'sidebar-mobile-open' : ''}`}
      >
        {/* Header */}
        <div className="p-4" style={{ borderBottom: '1px solid #222' }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="neural-label text-white text-sm font-mono">JARVIS</span>
                <span className="status-dot status-online status-pulse"></span>
              </div>
              <p className="neural-label text-xs" style={{color: '#666', fontSize: '10px'}}>MISSION CONTROL</p>
            </div>
            {/* Mobile close button */}
            <button
              onClick={() => setMobileOpen(false)}
              className="sidebar-close-btn"
              aria-label="Fermer"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="4" y1="4" x2="14" y2="14" />
                <line x1="14" y1="4" x2="4" y2="14" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {navSections.map((section, sectionIndex) => (
            <div key={section.title}>
              {sectionIndex > 0 && (
                <div className="neural-separator mx-4 mb-4" style={{borderTopColor: '#222'}}></div>
              )}
              <div className="px-4 mb-2">
                <h3 className="neural-label" style={{fontSize: '10px', color: '#666'}}>{section.title}</h3>
              </div>
              <div className="space-y-0.5 mb-4">
                {section.items.map((item) => {
                  const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`
                        block px-4 py-1.5 text-xs font-mono transition-colors duration-150
                        ${active 
                          ? 'text-white border-l-2 border-white pl-3' 
                          : 'text-gray-500 hover:text-gray-400 pl-4'
                        }
                      `}
                      style={{
                        letterSpacing: '0.05em',
                        fontSize: '11px',
                        color: active ? '#e0e0e0' : '#666'
                      }}
                      onMouseEnter={(e) => {
                        if (!active) e.currentTarget.style.color = '#999';
                      }}
                      onMouseLeave={(e) => {
                        if (!active) e.currentTarget.style.color = '#666';
                      }}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        
        {/* Footer */}
        <div className="p-4" style={{ borderTop: '1px solid #222' }}>
          <p className="text-xs font-mono" style={{color: '#444', fontSize: '10px'}}>v2.0 · OPUS 4.6</p>
        </div>
      </aside>
    </>
  );
}
