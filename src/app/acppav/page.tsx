"use client";
import { useEffect, useState } from "react";

interface Article {
  id: number;
  title: string;
  status: string;
  slug?: string;
  url?: string;
  word_count?: number;
  keyword?: string;
  volume?: number;
  kd?: number;
  cluster?: string;
  month?: string;
  excerpt?: string;
  featured_image?: string;
  reviewStatus?: string;
  category: string;
  type: string;
  filename?: string;
  modificationCount?: number;
}

type CategoryFilter = 'all' | 'Pharmacie' | 'Petite enfance' | 'Paramédical' | 'Médico-social';
type TypeFilter = 'all' | 'article' | 'formation';

const CATEGORY_MAP: Record<string, { label: string; color: string; textColor: string }> = {
  'Pharmacie': { label: 'PHARMACIE', color: 'bg-emerald-900', textColor: 'text-emerald-100' },
  'Petite enfance': { label: 'PETITE ENFANCE', color: 'bg-pink-900', textColor: 'text-pink-100' },
  'Paramédical': { label: 'PARAMÉDICAL', color: 'bg-blue-900', textColor: 'text-blue-100' },
  'Médico-social': { label: 'MÉDICO-SOCIAL', color: 'bg-purple-900', textColor: 'text-purple-100' }
};

export default function ACPPAVPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [modificationInput, setModificationInput] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await fetch('/api/acppav/articles');
        const data = await response.json();
        setArticles(data);
      } catch (error) {
        console.error('Error fetching articles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  const filteredArticles = articles.filter(article => {
    const matchesCategory = categoryFilter === 'all' || article.category === categoryFilter;
    const matchesType = typeFilter === 'all' || article.type === typeFilter;
    return matchesCategory && matchesType;
  });

  const handleTelegramContact = (article: Article, modification: string) => {
    const message = `🎯 MODIFICATION ACPPAV

📄 Article: "${article.title}"
📁 Fichier: ${article.filename}
🔄 Demande: ${modification}

Utilise l'agent ACPPAV expert pour appliquer cette modification avec tous les garde-fous YMYL.`;

    const telegramUrl = `https://t.me/JarvisAssistantBot?start=modify&text=${encodeURIComponent(message)}`;
    window.open(telegramUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-4">⚡</div>
          <div className="text-gray-400">Chargement des articles ACPPAV...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white" style={{ letterSpacing: '0.2em' }}>
              ACPPAV DASHBOARD
            </h1>
            <div className="text-sm text-gray-400 mt-1">
              Centre de Formation • Modification d'Articles
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">VERSION CLOUD</div>
            <div className="text-xs text-purple-400">🧠 Agent Expert via Telegram</div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Filters */}
        <div className="w-64 border-r border-gray-800 p-6">
          <div className="space-y-6">
            <div>
              <label className="text-xs text-gray-400 mb-3 block" style={{ letterSpacing: '0.1em' }}>
                CATÉGORIE
              </label>
              <select 
                value={categoryFilter} 
                onChange={(e) => setCategoryFilter(e.target.value as CategoryFilter)}
                className="w-full bg-gray-900 text-white border border-gray-600 rounded p-2 text-sm focus:border-purple-400"
              >
                <option value="all">Toutes les catégories</option>
                <option value="Pharmacie">Pharmacie</option>
                <option value="Petite enfance">Petite enfance</option>
                <option value="Paramédical">Paramédical</option>
                <option value="Médico-social">Médico-social</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-3 block" style={{ letterSpacing: '0.1em' }}>
                TYPE
              </label>
              <select 
                value={typeFilter} 
                onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
                className="w-full bg-gray-900 text-white border border-gray-600 rounded p-2 text-sm focus:border-purple-400"
              >
                <option value="all">Tous les types</option>
                <option value="article">Articles</option>
                <option value="formation">Formations</option>
              </select>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg text-gray-300" style={{ letterSpacing: '0.1em' }}>
                ARTICLES ({filteredArticles.length})
              </h2>
              <div className="text-sm text-gray-500">
                💡 Clique sur un article pour le modifier
              </div>
            </div>

            {/* Articles Grid */}
            <div className="grid gap-4">
              {filteredArticles.map((article) => (
                <div 
                  key={article.id}
                  onClick={() => setSelectedArticle(article)}
                  className="bg-gray-900 border border-gray-700 p-4 rounded cursor-pointer hover:border-purple-500 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`px-2 py-1 rounded text-xs font-bold ${CATEGORY_MAP[article.category]?.color || 'bg-gray-800'} ${CATEGORY_MAP[article.category]?.textColor || 'text-gray-300'}`}>
                          {CATEGORY_MAP[article.category]?.label || article.category}
                        </div>
                        {article.type === 'formation' && (
                          <div className="px-2 py-1 bg-orange-900 text-orange-100 rounded text-xs font-bold">
                            FORMATION
                          </div>
                        )}
                      </div>
                      
                      <h3 className="text-white font-medium mb-2 line-clamp-2">
                        {article.title}
                      </h3>
                      
                      {article.keyword && (
                        <div className="text-sm text-gray-400 mb-2">
                          🎯 {article.keyword}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {article.volume && (
                          <span>📊 {article.volume.toLocaleString()}/mois</span>
                        )}
                        {article.filename && (
                          <span>📄 {article.filename}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm text-purple-400">➤</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modification Panel */}
        {selectedArticle && (
          <div className="w-96 border-l border-gray-800 p-6 bg-gray-950">
            <div className="mb-4">
              <button 
                onClick={() => setSelectedArticle(null)}
                className="text-gray-400 hover:text-white mb-3"
              >
                ← Retour
              </button>
              <h3 className="text-white font-medium mb-2">{selectedArticle.title}</h3>
              <div className="text-xs text-gray-400">{selectedArticle.filename}</div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-2 block" style={{ letterSpacing: '0.1em' }}>
                  MODIFICATION DEMANDÉE
                </label>
                <textarea 
                  value={modificationInput}
                  onChange={(e) => setModificationInput(e.target.value)}
                  placeholder="Ex: réécrire l'introduction en plus commercial, ajouter une section débouchés, optimiser pour SEO..."
                  className="w-full bg-gray-900 text-white p-3 border border-gray-600 focus:border-purple-400 resize-none rounded"
                  rows={4}
                />
              </div>

              <div className="bg-purple-900/20 border border-purple-700 rounded p-4">
                <div className="text-sm text-purple-200 mb-3">
                  🧠 <strong>Agent ACPPAV Expert</strong>
                </div>
                <div className="text-xs text-purple-300 mb-3">
                  L'agent spécialisé ACPPAV peut effectuer n'importe quelle modification : réécriture complète, optimisation SEO, changement de tone, restructuration, etc.
                </div>
                <div className="text-xs text-purple-400 mb-4">
                  ✅ Garde-fous YMYL intégrés<br/>
                  ✅ Expertise domaine médico-social<br/>
                  ✅ Respect terminologie ACPPAV
                </div>
                
                <button 
                  onClick={() => handleTelegramContact(selectedArticle, modificationInput)}
                  disabled={!modificationInput.trim()}
                  className="w-full px-4 py-3 bg-purple-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-500 transition-colors rounded"
                  style={{ letterSpacing: '0.1em' }}
                >
                  🧠 CONTACTER L'EXPERT
                </button>
              </div>

              <div className="text-xs text-gray-500 leading-relaxed">
                💡 L'agent expert analysera ta demande, appliquera les modifications en respectant tous les standards ACPPAV et YMYL, puis te confirmera les changements effectués.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}