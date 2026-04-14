"use client";
import { useEffect, useState } from "react";

interface Backup {
  id: string;
  date: string;
  timestamp: string;
  size: number;
  hasArchive: boolean;
  path: string;
}

export default function BackupsPage() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    try {
      const response = await fetch('/api/backups');
      const data = await response.json();
      
      if (data.success) {
        setBackups(data.backups);
      } else {
        setError('Failed to load backups');
      }
    } catch (error) {
      console.error('Error loading backups:', error);
      setError('Error loading backups');
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async () => {
    setCreating(true);
    setError(null);
    
    try {
      const response = await fetch('/api/backups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        await loadBackups(); // Reload the list
        alert('Backup créé avec succès !');
      } else {
        setError(data.error || 'Failed to create backup');
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      setError('Error creating backup');
    } finally {
      setCreating(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateStr: string) => {
    // Format: YYYY-MM-DD-HHMMSS
    if (dateStr.length === 15) {
      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(5, 7);
      const day = dateStr.substring(8, 10);
      const hour = dateStr.substring(11, 13);
      const min = dateStr.substring(13, 15);
      
      return `${day}/${month}/${year} à ${hour}:${min}`;
    }
    return dateStr;
  };

  const downloadBackup = (backup: Backup) => {
    const link = document.createElement('a');
    link.href = `/api/backups/${backup.id}/download`;
    link.download = `openclaw-backup-${backup.id}.tar.gz`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const restoreBackup = (backup: Backup) => {
    const confirmed = confirm(
      `Êtes-vous sûr de vouloir restaurer le backup du ${formatDate(backup.date)} ?\n\n` +
      `Cette action remplacera les fichiers actuels et ne peut pas être annulée.\n\n` +
      `Fichiers concernés:\n` +
      `- SOUL.md, AGENTS.md, RULES.md, USER.md, TOOLS.md, HEARTBEAT.md\n` +
      `- agents/ (dossier complet)\n` +
      `- mission-control/data/ (tous les JSON)\n` +
      `- openclaw.json (configuration)`
    );
    
    if (confirmed) {
      alert('Fonctionnalité de restauration en cours de développement.\n\nPour l\'instant, téléchargez le backup et restaurez manuellement.');
    }
  };

  if (loading) {
    return (
      <div 
        className="flex items-center justify-center h-96"
        style={{ 
          backgroundColor: '#000000',
          fontFamily: "'Courier New', 'Consolas', monospace"
        }}
      >
        <div 
          className="animate-spin w-8 h-8"
          style={{ 
            border: '2px solid #222',
            borderTop: '2px solid #e0e0e0',
            borderRadius: '50%'
          }}
        />
      </div>
    );
  }

  return (
    <div 
      className="max-w-7xl mx-auto space-y-6"
      style={{ 
        backgroundColor: '#000000',
        fontFamily: "'Courier New', 'Consolas', monospace"
      }}
    >
      {/* Header */}
      <div 
        className="p-6"
        style={{ 
          backgroundColor: '#000000',
          border: '1px solid #222'
        }}
      >
        <h1 
          className="text-2xl font-bold mb-2"
          style={{ 
            color: '#e0e0e0',
            fontFamily: "'Courier New', 'Consolas', monospace",
            letterSpacing: '0.1em'
          }}
        >
          BACKUPS
        </h1>
        <p 
          className="text-sm"
          style={{ 
            color: '#666',
            fontFamily: "'Courier New', 'Consolas', monospace",
            letterSpacing: '0.1em'
          }}
        >
          SAUVEGARDE ET RESTAURATION FICHIERS CRITIQUES · CONFIGURATION · AGENTS · DONNEES
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div 
          className="p-4"
          style={{ 
            backgroundColor: '#000000',
            border: '1px solid #ff3333'
          }}
        >
          <p 
            className="font-medium"
            style={{ 
              color: '#ff3333',
              fontFamily: "'Courier New', 'Consolas', monospace",
              letterSpacing: '0.1em'
            }}
          >
            ERREUR:
          </p>
          <p 
            className="text-sm"
            style={{ 
              color: '#ff3333',
              fontFamily: "'Courier New', 'Consolas', monospace"
            }}
          >
            {error}
          </p>
        </div>
      )}

      {/* Create Backup */}
      <div 
        className="p-6"
        style={{ 
          backgroundColor: '#000000',
          border: '1px solid #222'
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 
              className="text-lg font-semibold mb-2"
              style={{ 
                color: '#666',
                fontFamily: "'Courier New', 'Consolas', monospace",
                letterSpacing: '0.1em'
              }}
            >
              CREER NOUVEAU BACKUP
            </h2>
            <p 
              className="text-sm"
              style={{ 
                color: '#666',
                fontFamily: "'Courier New', 'Consolas', monospace"
              }}
            >
              SAUVEGARDE AUTOMATIQUE FICHIERS CRITIQUES : CONFIGURATION, AGENTS, DONNEES
            </p>
            <div className="mt-3 text-xs">
              <p 
                className="font-medium mb-1"
                style={{ 
                  color: '#666',
                  fontFamily: "'Courier New', 'Consolas', monospace",
                  letterSpacing: '0.1em'
                }}
              >
                FICHIERS INCLUS:
              </p>
              <ul 
                className="space-y-0.5 ml-2"
                style={{ 
                  color: '#666',
                  fontFamily: "'Courier New', 'Consolas', monospace"
                }}
              >
                <li>• CONFIG : SOUL.MD, AGENTS.MD, RULES.MD, USER.MD, TOOLS.MD, HEARTBEAT.MD, MEMORY.MD</li>
                <li>• AGENTS/ : TOUS LES SUB-AGENTS (AGENT.MD + SKILLS)</li>
                <li>• MEMORY/ : TOUS LES DAILY LOGS</li>
                <li>• TOOLS/ : SCRIPTS CUSTOM (SCHEDULER, RAG, EMAIL, SCRAPERS)</li>
                <li>• TWITTER-API/ : SCRIPTS TWITTER</li>
                <li>• MISSION-CONTROL/ : CODE SOURCE + DATA + ASSETS (MODELES 3D)</li>
                <li>• QDRANT : EXPORT COMPLET BASE VECTORIELLE RAG (~1700 MEMOIRES)</li>
                <li>• CONFIG SYSTEME : OPENCLAW.JSON, PM2, CADDY, CRONTAB</li>
              </ul>
            </div>
          </div>
          <button
            onClick={createBackup}
            disabled={creating}
            className="px-6 py-3 font-medium flex items-center gap-2"
            style={{ 
              backgroundColor: '#000000',
              color: creating ? '#666' : '#33ff33',
              border: creating ? '1px solid #666' : '1px solid #33ff33',
              fontFamily: "'Courier New', 'Consolas', monospace",
              opacity: creating ? 0.5 : 1
            }}
            onMouseEnter={(e) => {
              if (!creating) {
                e.currentTarget.style.border = '1px solid #e0e0e0';
                e.currentTarget.style.color = '#e0e0e0';
              }
            }}
            onMouseLeave={(e) => {
              if (!creating) {
                e.currentTarget.style.border = '1px solid #33ff33';
                e.currentTarget.style.color = '#33ff33';
              }
            }}
          >
            {creating ? (
              <>
                <div 
                  className="animate-spin w-4 h-4"
                  style={{ 
                    border: '2px solid #333',
                    borderTop: '2px solid #666',
                    borderRadius: '50%'
                  }}
                />
                CREATION...
              </>
            ) : (
              <>
                CREER BACKUP
              </>
            )}
          </button>
        </div>
      </div>

      {/* Backups List */}
      <div 
        className="p-6"
        style={{ 
          backgroundColor: '#000000',
          border: '1px solid #222'
        }}
      >
        <h2 
          className="text-lg font-semibold mb-4"
          style={{ 
            color: '#666',
            fontFamily: "'Courier New', 'Consolas', monospace",
            letterSpacing: '0.1em'
          }}
        >
          BACKUPS EXISTANTS ({backups.length})
        </h2>
        
        {backups.length === 0 ? (
          <div className="text-center py-8">
            <div 
              className="text-6xl mb-4"
              style={{ 
                color: '#333',
                fontFamily: "'Courier New', 'Consolas', monospace"
              }}
            >
              ■
            </div>
            <p 
              className="font-medium"
              style={{ 
                color: '#666',
                fontFamily: "'Courier New', 'Consolas', monospace",
                letterSpacing: '0.1em'
              }}
            >
              AUCUN BACKUP TROUVE
            </p>
            <p 
              className="text-sm mt-1"
              style={{ 
                color: '#333',
                fontFamily: "'Courier New', 'Consolas', monospace"
              }}
            >
              CREEZ VOTRE PREMIER BACKUP POUR COMMENCER
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {backups.map((backup) => (
              <div 
                key={backup.id} 
                className="flex items-center justify-between p-4"
                style={{ 
                  border: '1px solid #222',
                  backgroundColor: '#000000'
                }}
                onMouseEnter={(e) => e.currentTarget.style.border = '1px solid #666'}
                onMouseLeave={(e) => e.currentTarget.style.border = '1px solid #222'}
              >
                <div className="flex items-center gap-4">
                  <div 
                    className="w-10 h-10 flex items-center justify-center"
                    style={{ 
                      backgroundColor: '#0a0a0a',
                      border: '1px solid #222'
                    }}
                  >
                    <span 
                      className="text-lg"
                      style={{ 
                        color: '#666',
                        fontFamily: "'Courier New', 'Consolas', monospace"
                      }}
                    >
                      ■
                    </span>
                  </div>
                  <div>
                    <p 
                      className="font-medium"
                      style={{ 
                        color: '#e0e0e0',
                        fontFamily: "'Courier New', 'Consolas', monospace"
                      }}
                    >
                      BACKUP {formatDate(backup.date)}
                    </p>
                    <div className="flex items-center gap-4 text-sm mt-1">
                      <span 
                        style={{ 
                          color: '#666',
                          fontFamily: "'Courier New', 'Consolas', monospace"
                        }}
                      >
                        {formatSize(backup.size)}
                      </span>
                      <span 
                        style={{ 
                          color: '#666',
                          fontFamily: "'Courier New', 'Consolas', monospace"
                        }}
                      >
                        {backup.hasArchive ? 'ARCHIVE CREEE' : 'ARCHIVE MANQUANTE'}
                      </span>
                      <span 
                        style={{ 
                          color: '#333',
                          fontFamily: "'Courier New', 'Consolas', monospace"
                        }}
                      >
                        {backup.id}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {backup.hasArchive && (
                    <button
                      onClick={() => downloadBackup(backup)}
                      className="px-4 py-2 text-sm font-medium"
                      style={{ 
                        backgroundColor: '#000000',
                        color: '#33ff33',
                        border: '1px solid #33ff33',
                        fontFamily: "'Courier New', 'Consolas', monospace"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.border = '1px solid #e0e0e0';
                        e.currentTarget.style.color = '#e0e0e0';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.border = '1px solid #33ff33';
                        e.currentTarget.style.color = '#33ff33';
                      }}
                    >
                      TELECHARGER
                    </button>
                  )}
                  <button
                    onClick={() => restoreBackup(backup)}
                    className="px-4 py-2 text-sm font-medium"
                    style={{ 
                      backgroundColor: '#000000',
                      color: '#666',
                      border: '1px solid #666',
                      fontFamily: "'Courier New', 'Consolas', monospace"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.border = '1px solid #e0e0e0';
                      e.currentTarget.style.color = '#e0e0e0';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.border = '1px solid #666';
                      e.currentTarget.style.color = '#666';
                    }}
                  >
                    RESTAURER
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Auto-backup Info */}
      <div 
        className="p-6"
        style={{ 
          backgroundColor: '#000000',
          border: '1px solid #222'
        }}
      >
        <h2 
          className="text-lg font-semibold mb-3"
          style={{ 
            color: '#666',
            fontFamily: "'Courier New', 'Consolas', monospace",
            letterSpacing: '0.1em'
          }}
        >
          BACKUP AUTOMATIQUE
        </h2>
        <div 
          className="p-4"
          style={{ 
            backgroundColor: '#0a0a0a',
            border: '1px solid #222'
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <span 
              className="w-3 h-3 animate-pulse"
              style={{ 
                backgroundColor: '#ff3333',
                display: 'inline-block'
              }}
            >
              ●
            </span>
            <span 
              className="font-medium"
              style={{ 
                color: '#ff3333',
                fontFamily: "'Courier New', 'Consolas', monospace",
                letterSpacing: '0.1em'
              }}
            >
              EN COURS DE CONFIGURATION
            </span>
          </div>
          <p 
            className="text-sm"
            style={{ 
              color: '#666',
              fontFamily: "'Courier New', 'Consolas', monospace"
            }}
          >
            LE SCRIPT AUTO-BACKUP QUOTIDIEN SERA CREE DANS{' '}
            <code 
              style={{ 
                backgroundColor: '#000000',
                color: '#e0e0e0',
                padding: '0 4px',
                border: '1px solid #222',
                fontFamily: "'Courier New', 'Consolas', monospace"
              }}
            >
              /root/openclaw/tools/auto-backup.sh
            </code>
          </p>
          <p 
            className="text-xs mt-2"
            style={{ 
              color: '#333',
              fontFamily: "'Courier New', 'Consolas', monospace"
            }}
          >
            PREVU : BACKUP AUTOMATIQUE TOUS LES JOURS A 03:00 AVEC RETENTION DE 30 JOURS
          </p>
        </div>
      </div>
    </div>
  );
}