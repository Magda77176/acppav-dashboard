"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const mainTabs = [
  { href: "/", label: "HOME", icon: "⬡" },
  { href: "/projets", label: "PROJETS", icon: "◈" },
  { href: "/campaigns", label: "CAMPAGNES", icon: "◉" },
  { href: "/agents", label: "AGENTS", icon: "◎" },
];

const moreTabs = [
  { href: "/tasks", label: "TÂCHES" },
  { href: "/pipeline", label: "PIPELINE" },
  { href: "/calendar", label: "CALENDRIER" },
  { href: "/monitoring", label: "MONITORING" },
  { href: "/projects-ia", label: "PROJETS IA ☁️" },
  { href: "/jarvis", label: "JARVIS VOICE" },
  { href: "/office", label: "BUREAU 2D" },
  { href: "/memory", label: "MÉMOIRE" },
  { href: "/docs", label: "DOCUMENTS" },
  { href: "/backups", label: "BACKUPS" },
  { href: "/revenue", label: "REVENUE" },
  { href: "/team", label: "ÉQUIPE" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const isMoreActive = moreTabs.some(t => isActive(t.href));

  return (
    <>
      {/* More menu overlay */}
      {moreOpen && (
        <div className="bottom-nav-overlay" onClick={() => setMoreOpen(false)}>
          <div 
            className="bottom-nav-more-menu"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bottom-nav-more-header">
              <span>MENU</span>
              <button onClick={() => setMoreOpen(false)} style={{ color: '#666' }}>✕</button>
            </div>
            <div className="bottom-nav-more-grid">
              {moreTabs.map(tab => (
                <Link
                  key={tab.href}
                  href={tab.href}
                  onClick={() => setMoreOpen(false)}
                  className={`bottom-nav-more-item ${isActive(tab.href) ? 'active' : ''}`}
                >
                  {tab.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom navigation bar */}
      <nav className="bottom-nav">
        {mainTabs.map(tab => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`bottom-nav-tab ${isActive(tab.href) ? 'active' : ''}`}
          >
            <span className="bottom-nav-icon">{tab.icon}</span>
            <span className="bottom-nav-label">{tab.label}</span>
          </Link>
        ))}
        <button
          onClick={() => setMoreOpen(!moreOpen)}
          className={`bottom-nav-tab ${isMoreActive ? 'active' : ''}`}
        >
          <span className="bottom-nav-icon">≡</span>
          <span className="bottom-nav-label">PLUS</span>
        </button>
      </nav>
    </>
  );
}
