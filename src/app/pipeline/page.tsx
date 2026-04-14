"use client";
import { useEffect, useState } from "react";

interface MedicalData {
  totalAmeli: number;
  totalEmelia: number;
  totalKO: number;
  ameliBySpec: Record<string, number>;
  emeliaBySpec: Record<string, number>;
  ameliTopDepts: Record<string, Record<string, number>>;
  emeliaByDept: Record<string, number>;
}

interface Contact {
  email: string;
  firstName: string;
  lastName: string;
  ville: string;
  specialite: string;
  cabinet: string;
  cp: string;
  dept: string;
}

function fmt(n: number) { return n.toLocaleString("fr-FR"); }

export default function PipelinePage() {
  const [tab, setTab] = useState("medical");
  const [photoData, setPhotoData] = useState<any>(null);
  const [medicalData, setMedicalData] = useState<MedicalData | null>(null);
  const [medicalTab, setMedicalTab] = useState<"overview"|"ameli"|"emelia"|"opportunities"|"contacts">("overview");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSpecialite, setSelectedSpecialite] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [verifyStatus, setVerifyStatus] = useState<any>(null);
  const contactsPerPage = 50;

  useEffect(() => {
    fetch("/api/pipeline/photographes").then(r => r.json()).then(setPhotoData).catch(() => {});
    fetch("/api/leads-medical").then(r => r.json()).then(setMedicalData).catch(() => {});
    fetch("/api/leads-medical?verify-status=true").then(r => r.json()).then(setVerifyStatus).catch(() => {});
    // Refresh verify status every 30s
    const interval = setInterval(() => {
      fetch("/api/leads-medical?verify-status=true").then(r => r.json()).then(setVerifyStatus).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Charger les contacts quand on clique sur l'onglet CONTACTS
  useEffect(() => {
    if (medicalTab === "contacts" && contacts.length === 0) {
      fetch("/api/leads-medical?contacts=true")
        .then(r => r.json())
        .then(setContacts)
        .catch(() => {});
    }
  }, [medicalTab, contacts.length]);

  // Filtrer les contacts
  useEffect(() => {
    let filtered = contacts;

    if (selectedSpecialite) {
      filtered = filtered.filter(c => c.specialite === selectedSpecialite);
    }

    if (selectedDept) {
      filtered = filtered.filter(c => c.dept === selectedDept);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(c => 
        c.firstName.toLowerCase().includes(term) ||
        c.lastName.toLowerCase().includes(term) ||
        c.email.toLowerCase().includes(term) ||
        c.ville.toLowerCase().includes(term)
      );
    }

    setFilteredContacts(filtered);
    setCurrentPage(1);
  }, [contacts, selectedSpecialite, selectedDept, searchTerm]);

  const exportToCSV = () => {
    const dataToExport = filteredContacts.length > 0 ? filteredContacts : contacts;
    const csvContent = "data:text/csv;charset=utf-8," + 
      "email,firstName,lastName,ville,specialite,cabinet,cp,dept\n" +
      dataToExport.map(row => 
        `"${row.email}","${row.firstName}","${row.lastName}","${row.ville}","${row.specialite}","${row.cabinet}","${row.cp}","${row.dept}"`
      ).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `contacts-emelia-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const tabs = [
    { id: "medical", label: "🏥 MÉDICAL" },
    { id: "photographes", label: "📸 PHOTOGRAPHES" },
    { id: "mariages", label: "💒 MARIAGES" },
  ];

  const medicalTabs = [
    { id: "overview" as const, label: "VUE D'ENSEMBLE" },
    { id: "ameli" as const, label: "BASE AMELI" },
    { id: "emelia" as const, label: "EN CAMPAGNE" },
    { id: "opportunities" as const, label: "OPPORTUNITÉS" },
    { id: "contacts" as const, label: "CONTACTS" },
  ];

  const keySpecs = [
    "Chirurgien-dentiste","Médecin généraliste","Cardiologue","Ophtalmologiste",
    "Gynécologue / Obstétricien","Chirurgien orthopédiste et traumatologue",
    "Psychiatre","Anesthésiste réanimateur","Dermatologue et vénérologue",
    "Gastro-entérologue et hépatologue","Pédiatre","Chirurgien urologue",
    "Oto-Rhino-Laryngologue (ORL) et chirurgien cervico-facial"
  ];

  // Obtenir les spécialités uniques pour le filtre
  const uniqueSpecialites = Array.from(new Set(contacts.map(c => c.specialite).filter(Boolean))).sort();
  const uniqueDepts = Array.from(new Set(contacts.map(c => c.dept).filter(Boolean))).sort();

  // Pagination
  const totalPages = Math.ceil(filteredContacts.length / contactsPerPage);
  const startIndex = (currentPage - 1) * contactsPerPage;
  const endIndex = startIndex + contactsPerPage;
  const currentContacts = filteredContacts.slice(startIndex, endIndex);

  return (
    <div className="max-w-7xl mx-auto" style={{ backgroundColor: '#000000', fontFamily: "'Courier New', 'Consolas', monospace" }}>
      <h1 className="text-2xl font-bold mb-6" style={{ color: '#e0e0e0', letterSpacing: '0.1em' }}>PIPELINE</h1>

      <div className="flex gap-2 mb-6 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className="px-4 py-2 text-sm font-medium"
            style={{ backgroundColor: '#000', color: tab === t.id ? '#e0e0e0' : '#666', border: tab === t.id ? '1px solid #e0e0e0' : '1px solid #222', fontFamily: "'Courier New', monospace", letterSpacing: '0.1em' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ============ MEDICAL TAB ============ */}
      {tab === "medical" && medicalData && (() => {
        const potential = medicalData.totalAmeli - medicalData.totalEmelia - medicalData.totalKO;
        const pct = ((medicalData.totalEmelia / medicalData.totalAmeli) * 100).toFixed(1);
        const ameliEntries = Object.entries(medicalData.ameliBySpec).sort((a, b) => b[1] - a[1]);
        const emeliaEntries = Object.entries(medicalData.emeliaBySpec).sort((a, b) => b[1] - a[1]);
        const maxAmeli = ameliEntries[0]?.[1] || 1;

        return (
          <div className="space-y-6">
            {/* Statut Campagne Emelia */}
            <div className="p-4 mb-6" style={{ border: '1px solid #4ade80', backgroundColor: '#0a0a0a', borderRadius: 4 }}>
              <div className="flex items-center gap-3">
                <span style={{ fontSize: 12, color: '#4ade80', fontWeight: 600 }}>🟢 CAMPAGNE EMELIA ACTIVE</span>
                <span style={{ fontSize: 11, color: '#666' }}>—</span>
                <span style={{ fontSize: 11, color: '#e0e0e0' }}>15 943 contacts</span>
                <span style={{ fontSize: 11, color: '#666' }}>—</span>
                <span style={{ fontSize: 11, color: '#e0e0e0' }}>Lancée le 01/04/2026</span>
                <span style={{ fontSize: 11, color: '#666' }}>—</span>
                <span style={{ fontSize: 11, color: '#e0e0e0' }}>6h30-10h30</span>
                <span style={{ fontSize: 11, color: '#666' }}>—</span>
                <span style={{ fontSize: 11, color: '#e0e0e0' }}>16 boîtes × 35/jour</span>
              </div>
            </div>

            {/* Enrichissement Progress */}
            {verifyStatus && verifyStatus.total > 0 && (
              <div className="p-4" style={{ border: `1px solid ${verifyStatus.running ? '#fb923c' : '#4ade80'}`, backgroundColor: '#0a0a0a', borderRadius: 4 }}>
                <div className="flex items-center justify-between mb-2">
                  <span style={{ fontSize: 12, color: verifyStatus.running ? '#fb923c' : '#4ade80', fontWeight: 600 }}>
                    {verifyStatus.running ? '🔄 VÉRIFICATION EMAILS EN COURS' : '✅ VÉRIFICATION TERMINÉE'}
                  </span>
                  <span style={{ fontSize: 11, color: '#e0e0e0' }}>
                    {fmt(verifyStatus.ok)} valides / {fmt(verifyStatus.ko)} invalides — {verifyStatus.hitRate}% hit rate
                  </span>
                </div>
                <div style={{ height: 8, background: '#222', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${verifyStatus.total > 0 ? ((verifyStatus.processed / verifyStatus.total) * 100) : 0}%`, background: verifyStatus.running ? 'linear-gradient(90deg, #fb923c, #f97316)' : 'linear-gradient(90deg, #4ade80, #38bdf8)', borderRadius: 4, transition: 'width 0.5s' }} />
                </div>
                <div className="flex justify-between mt-1">
                  <span style={{ fontSize: 10, color: '#666' }}>{fmt(verifyStatus.processed)} / {fmt(verifyStatus.total)} vérifiés</span>
                  <span style={{ fontSize: 10, color: '#666' }}>Pattern: dr.nom@gmail.com — Libéraux uniquement</span>
                </div>
              </div>
            )}

            {/* Sub tabs */}
            <div className="flex gap-2 overflow-x-auto">
              {medicalTabs.map(t => (
                <button key={t.id} onClick={() => setMedicalTab(t.id)} className="px-3 py-1 text-xs"
                  style={{ background: medicalTab === t.id ? '#1a1a2e' : 'transparent', color: medicalTab === t.id ? '#38bdf8' : '#666', border: medicalTab === t.id ? '1px solid #38bdf8' : '1px solid #333', borderRadius: 4, fontFamily: 'monospace' }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "BASE AMELI", value: fmt(medicalData.totalAmeli), color: "#a78bfa" },
                { label: "AVEC EMAIL", value: fmt(medicalData.totalEmelia), color: "#4ade80" },
                { label: "À ENRICHIR", value: fmt(potential), color: "#fb923c" },
                { label: "EMAILS KO", value: fmt(medicalData.totalKO), color: "#f87171" },
              ].map(k => (
                <div key={k.label} className="p-4" style={{ border: '1px solid #222' }}>
                  <p className="text-2xl font-bold" style={{ color: k.color, fontFamily: 'monospace' }}>{k.value}</p>
                  <p className="text-xs mt-1" style={{ color: '#666', letterSpacing: '0.1em' }}>{k.label}</p>
                </div>
              ))}
            </div>

            {/* Progress */}
            <div className="p-4" style={{ border: '1px solid #222' }}>
              <div className="flex justify-between mb-2">
                <span style={{ fontSize: 11, color: '#666' }}>ENRICHISSEMENT</span>
                <span style={{ fontSize: 11, color: '#e0e0e0', fontWeight: 600 }}>{pct}%</span>
              </div>
              <div style={{ height: 8, background: '#222', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #4ade80, #38bdf8)', borderRadius: 4 }} />
              </div>
            </div>

            {/* CONTACTS TAB */}
            {medicalTab === "contacts" && (
              <div className="space-y-4">
                {/* Filtres et Export */}
                <div className="flex flex-wrap gap-4 items-center p-4" style={{ border: '1px solid #222' }}>
                  <div className="flex-1 min-w-48">
                    <input
                      type="text"
                      placeholder="Rechercher par nom, email, ville..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-3 py-2 text-sm"
                      style={{ backgroundColor: '#111', color: '#e0e0e0', border: '1px solid #333', borderRadius: 4, fontFamily: 'monospace' }}
                    />
                  </div>
                  
                  <div>
                    <select
                      value={selectedSpecialite}
                      onChange={(e) => setSelectedSpecialite(e.target.value)}
                      className="px-3 py-2 text-sm"
                      style={{ backgroundColor: '#111', color: '#e0e0e0', border: '1px solid #333', borderRadius: 4, fontFamily: 'monospace' }}
                    >
                      <option value="">Toutes spécialités</option>
                      {uniqueSpecialites.map(spec => (
                        <option key={spec} value={spec}>{spec}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <select
                      value={selectedDept}
                      onChange={(e) => setSelectedDept(e.target.value)}
                      className="px-3 py-2 text-sm"
                      style={{ backgroundColor: '#111', color: '#e0e0e0', border: '1px solid #333', borderRadius: 4, fontFamily: 'monospace' }}
                    >
                      <option value="">Tous départements</option>
                      {uniqueDepts.map(dept => (
                        <option key={dept} value={dept}>Dept {dept}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={exportToCSV}
                    className="px-4 py-2 text-sm font-medium"
                    style={{ backgroundColor: '#4ade80', color: '#000', border: '1px solid #4ade80', borderRadius: 4, fontFamily: 'monospace' }}
                  >
                    EXPORTER CSV
                  </button>
                </div>

                {/* Résultats */}
                <div className="p-4" style={{ border: '1px solid #222' }}>
                  <div className="flex justify-between items-center mb-4">
                    <h3 style={{ fontSize: 13, color: '#e0e0e0', letterSpacing: '0.1em' }}>
                      CONTACTS EMELIA — {fmt(filteredContacts.length)} / {fmt(contacts.length)}
                    </h3>
                    <div style={{ fontSize: 11, color: '#666' }}>
                      Page {currentPage} / {totalPages}
                    </div>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm" style={{ fontFamily: 'monospace' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #222' }}>
                          <th className="p-2 text-left" style={{ color: '#666', fontSize: 10, letterSpacing: '0.1em' }}>PRÉNOM</th>
                          <th className="p-2 text-left" style={{ color: '#666', fontSize: 10, letterSpacing: '0.1em' }}>NOM</th>
                          <th className="p-2 text-left" style={{ color: '#666', fontSize: 10, letterSpacing: '0.1em' }}>EMAIL</th>
                          <th className="p-2 text-left" style={{ color: '#666', fontSize: 10, letterSpacing: '0.1em' }}>SPÉCIALITÉ</th>
                          <th className="p-2 text-left" style={{ color: '#666', fontSize: 10, letterSpacing: '0.1em' }}>VILLE</th>
                          <th className="p-2 text-left" style={{ color: '#666', fontSize: 10, letterSpacing: '0.1em' }}>CABINET</th>
                          <th className="p-2 text-left" style={{ color: '#666', fontSize: 10, letterSpacing: '0.1em' }}>DEPT</th>
                          <th className="p-2 text-left" style={{ color: '#666', fontSize: 10, letterSpacing: '0.1em' }}>STATUS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentContacts.map((contact: any, i: number) => (
                          <tr key={i} style={{ borderBottom: '1px solid #111', backgroundColor: i % 2 === 0 ? '#000' : '#0a0a0a' }}>
                            <td className="p-2" style={{ color: '#e0e0e0' }}>{contact.firstName}</td>
                            <td className="p-2" style={{ color: '#e0e0e0' }}>{contact.lastName}</td>
                            <td className="p-2" style={{ color: '#38bdf8', fontSize: 11 }}>{contact.email}</td>
                            <td className="p-2" style={{ color: '#666', fontSize: 11 }}>{contact.specialite || '—'}</td>
                            <td className="p-2" style={{ color: '#666', fontSize: 11 }}>{contact.ville || '—'}</td>
                            <td className="p-2" style={{ color: '#666', fontSize: 11 }}>{contact.cabinet || '—'}</td>
                            <td className="p-2" style={{ color: '#666', fontSize: 11 }}>{contact.dept || '—'}</td>
                            <td className="p-2">
                              <span style={{ padding: '1px 6px', borderRadius: 3, fontSize: 9, fontWeight: 600, background: contact.source === 'emelia' ? '#065f46' : '#1e3a5f', color: contact.source === 'emelia' ? '#4ade80' : '#38bdf8' }}>
                                {contact.source === 'emelia' ? 'EN CAMPAGNE' : 'VÉRIFIÉ ✓'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-4">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 text-xs"
                        style={{ 
                          backgroundColor: currentPage === 1 ? '#111' : '#222', 
                          color: currentPage === 1 ? '#444' : '#e0e0e0', 
                          border: '1px solid #333', 
                          borderRadius: 4,
                          cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                        }}
                      >
                        ‹ Précédent
                      </button>
                      
                      {[...Array(Math.min(5, totalPages))].map((_, i) => {
                        const pageNum = Math.max(1, currentPage - 2) + i;
                        if (pageNum > totalPages) return null;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className="px-3 py-1 text-xs"
                            style={{ 
                              backgroundColor: currentPage === pageNum ? '#38bdf8' : '#222', 
                              color: currentPage === pageNum ? '#000' : '#e0e0e0', 
                              border: '1px solid #333', 
                              borderRadius: 4 
                            }}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 text-xs"
                        style={{ 
                          backgroundColor: currentPage === totalPages ? '#111' : '#222', 
                          color: currentPage === totalPages ? '#444' : '#e0e0e0', 
                          border: '1px solid #333', 
                          borderRadius: 4,
                          cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                        }}
                      >
                        Suivant ›
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* OVERVIEW */}
            {medicalTab === "overview" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="p-4" style={{ border: '1px solid #222' }}>
                  <h3 className="mb-3" style={{ fontSize: 13, color: '#e0e0e0', letterSpacing: '0.1em' }}>🩺 TOP SPÉCIALITÉS (AMELI)</h3>
                  {ameliEntries.slice(0, 12).map(([spec, count]) => (
                    <div key={spec} className="flex items-center gap-2 mb-1">
                      <span style={{ fontSize: 10, color: '#888', width: 180, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{spec}</span>
                      <div style={{ flex: 1, height: 5, background: '#222', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(count / maxAmeli * 100)}%`, background: '#38bdf8', borderRadius: 2 }} />
                      </div>
                      <span style={{ fontSize: 10, color: '#e0e0e0', fontFamily: 'monospace', width: 55, textAlign: 'right' }}>{fmt(count)}</span>
                    </div>
                  ))}
                </div>
                <div className="p-4" style={{ border: '1px solid #222' }}>
                  <h3 className="mb-3" style={{ fontSize: 13, color: '#e0e0e0', letterSpacing: '0.1em' }}>📧 EN CAMPAGNE (EMELIA)</h3>
                  {emeliaEntries.map(([spec, count]) => (
                    <div key={spec} className="flex justify-between items-center py-1" style={{ borderBottom: '1px solid #111' }}>
                      <span style={{ fontSize: 11, color: '#888' }}>{spec}</span>
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: 11, color: '#e0e0e0', fontFamily: 'monospace' }}>{fmt(count)}</span>
                        <span style={{ padding: '1px 5px', borderRadius: 3, fontSize: 8, fontWeight: 600, background: spec === 'Non renseigné' ? '#78350f' : '#065f46', color: spec === 'Non renseigné' ? '#fbbf24' : '#4ade80' }}>
                          {spec === 'Non renseigné' ? '?' : 'ACTIF'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AMELI */}
            {medicalTab === "ameli" && (
              <div className="p-4" style={{ border: '1px solid #222' }}>
                <h3 className="mb-3" style={{ fontSize: 13, color: '#e0e0e0', letterSpacing: '0.1em' }}>BASE AMELI — {fmt(medicalData.totalAmeli)} PROFESSIONNELS</h3>
                <table className="w-full text-sm" style={{ fontFamily: 'monospace' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #222' }}>
                      <th className="p-2 text-left" style={{ color: '#666', fontSize: 10, letterSpacing: '0.1em' }}>SPÉCIALITÉ</th>
                      <th className="p-2 text-right" style={{ color: '#666', fontSize: 10 }}>TOTAL</th>
                      <th className="p-2" style={{ color: '#666', fontSize: 10, width: '35%' }}>VOLUME</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ameliEntries.map(([spec, count]) => (
                      <tr key={spec} style={{ borderBottom: '1px solid #111' }}>
                        <td className="p-2" style={{ fontSize: 11, color: '#ccc' }}>{spec}</td>
                        <td className="p-2 text-right" style={{ fontSize: 11, color: '#e0e0e0' }}>{fmt(count)}</td>
                        <td className="p-2">
                          <div style={{ height: 5, background: '#222', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${(count / maxAmeli * 100)}%`, background: '#a78bfa', borderRadius: 2 }} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* EMELIA */}
            {medicalTab === "emelia" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="p-4" style={{ border: '1px solid #222' }}>
                  <h3 className="mb-3" style={{ fontSize: 13, color: '#e0e0e0', letterSpacing: '0.1em' }}>PAR SPÉCIALITÉ</h3>
                  {emeliaEntries.map(([spec, count]) => (
                    <div key={spec} className="flex justify-between py-1" style={{ borderBottom: '1px solid #111' }}>
                      <span style={{ fontSize: 11, color: '#ccc' }}>{spec}</span>
                      <span style={{ fontSize: 11, color: '#4ade80', fontFamily: 'monospace', fontWeight: 600 }}>{fmt(count)}</span>
                    </div>
                  ))}
                </div>
                <div className="p-4" style={{ border: '1px solid #222' }}>
                  <h3 className="mb-3" style={{ fontSize: 13, color: '#e0e0e0', letterSpacing: '0.1em' }}>📍 PAR DÉPARTEMENT</h3>
                  {Object.entries(medicalData.emeliaByDept).map(([dept, count]) => (
                    <div key={dept} className="flex items-center gap-2 mb-1">
                      <span style={{ fontSize: 10, color: '#888', width: 45 }}>Dept {dept}</span>
                      <div style={{ flex: 1, height: 5, background: '#222', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(count / Object.values(medicalData.emeliaByDept)[0] * 100)}%`, background: '#38bdf8', borderRadius: 2 }} />
                      </div>
                      <span style={{ fontSize: 10, color: '#e0e0e0', fontFamily: 'monospace', width: 35, textAlign: 'right' }}>{fmt(count)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* OPPORTUNITIES */}
            {medicalTab === "opportunities" && (
              <div className="p-4" style={{ border: '1px solid #222' }}>
                <h3 className="mb-3" style={{ fontSize: 13, color: '#e0e0e0', letterSpacing: '0.1em' }}>🎯 OPPORTUNITÉS D'ENRICHISSEMENT</h3>
                <table className="w-full text-sm" style={{ fontFamily: 'monospace' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #222' }}>
                      <th className="p-2 text-left" style={{ color: '#666', fontSize: 10 }}>SPÉCIALITÉ</th>
                      <th className="p-2 text-right" style={{ color: '#666', fontSize: 10 }}>AMELI</th>
                      <th className="p-2 text-right" style={{ color: '#666', fontSize: 10 }}>ENRICHI</th>
                      <th className="p-2 text-right" style={{ color: '#666', fontSize: 10 }}>RESTANT</th>
                      <th className="p-2" style={{ color: '#666', fontSize: 10, width: '20%' }}>COUVERTURE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {keySpecs.map(spec => {
                      const ameli = medicalData.ameliBySpec[spec] || 0;
                      const enriched = medicalData.emeliaBySpec[spec] || 0;
                      const reste = ameli - enriched;
                      const cov = ameli > 0 ? ((enriched / ameli) * 100).toFixed(1) : "0";
                      if (ameli === 0) return null;
                      return (
                        <tr key={spec} style={{ borderBottom: '1px solid #111' }}>
                          <td className="p-2" style={{ fontSize: 11, color: '#ccc' }}>{spec}</td>
                          <td className="p-2 text-right" style={{ fontSize: 11, color: '#a78bfa' }}>{fmt(ameli)}</td>
                          <td className="p-2 text-right" style={{ fontSize: 11, color: '#4ade80' }}>{fmt(enriched)}</td>
                          <td className="p-2 text-right" style={{ fontSize: 11, color: '#fb923c', fontWeight: 600 }}>{fmt(reste)}</td>
                          <td className="p-2">
                            <div className="flex items-center gap-1">
                              <div style={{ flex: 1, height: 5, background: '#222', borderRadius: 2, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${cov}%`, background: parseFloat(cov) > 20 ? '#4ade80' : '#fb923c', borderRadius: 2 }} />
                              </div>
                              <span style={{ fontSize: 9, color: '#888', width: 30 }}>{cov}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })()}

      {tab === "medical" && !medicalData && (
        <div className="p-6" style={{ border: '1px solid #222' }}>
          <p style={{ color: '#666', fontFamily: 'monospace', letterSpacing: '0.1em' }}>CHARGEMENT DONNÉES MÉDICALES...</p>
        </div>
      )}

      {/* ============ PHOTOGRAPHES TAB ============ */}
      {tab === "photographes" && photoData && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "TOTAL", value: photoData.total },
              { label: "AVEC EMAIL", value: photoData.withEmail },
              { label: "SANS EMAIL", value: photoData.withoutEmail },
              { label: "AVEC TEL", value: photoData.withPhone },
            ].map(s => (
              <div key={s.label} className="p-4" style={{ border: '1px solid #222' }}>
                <p className="text-2xl font-bold" style={{ color: '#e0e0e0', fontFamily: 'monospace' }}>{s.value}</p>
                <p className="text-xs mt-1" style={{ color: '#666', letterSpacing: '0.1em' }}>{s.label}</p>
              </div>
            ))}
          </div>
          <div className="overflow-x-auto" style={{ border: '1px solid #222' }}>
            <table className="w-full text-sm" style={{ fontFamily: 'monospace' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #222' }}>
                  {["NOM","VILLE","SITE","EMAIL","TELEPHONE"].map(h => (
                    <th key={h} className="p-3 text-left" style={{ color: '#666', fontSize: 10, letterSpacing: '0.1em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {photoData.rows.map((r: any, i: number) => (
                  <tr key={i} style={{ borderBottom: '1px solid #111', backgroundColor: i % 2 === 0 ? '#000' : '#0a0a0a' }}>
                    <td className="p-3" style={{ color: '#e0e0e0' }}>{r.Nom}</td>
                    <td className="p-3" style={{ color: '#666' }}>{r.Ville}</td>
                    <td className="p-3">{r.Site ? <a href={`https://${r.Site}`} target="_blank" style={{ color: '#e0e0e0', fontSize: 11 }}>{r.Site}</a> : <span style={{ color: '#333' }}>—</span>}</td>
                    <td className="p-3 text-xs" style={{ color: '#666' }}>{r.Email || <span style={{ color: '#333' }}>—</span>}</td>
                    <td className="p-3 text-xs" style={{ color: '#666' }}>{r.Telephone || <span style={{ color: '#333' }}>—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============ MARIAGES TAB ============ */}
      {tab === "mariages" && (
        <div className="p-6" style={{ border: '1px solid #222' }}>
          <p style={{ color: '#666', fontFamily: 'monospace', letterSpacing: '0.1em' }}>PIPELINE EN CONSTRUCTION — PROSPECTION DOMAINE MARIAGE EN COURS</p>
        </div>
      )}
    </div>
  );
}