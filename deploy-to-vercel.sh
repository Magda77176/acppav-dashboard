#!/bin/bash
# Script de déploiement Vercel pour ACPPAV Dashboard

echo "🚀 DÉPLOIEMENT VERCEL - ACPPAV DASHBOARD"
echo "========================================"

# Vérifier si Vercel CLI est installé
if ! command -v vercel &> /dev/null; then
    echo "📦 Installation Vercel CLI..."
    npm install -g vercel
fi

# Aller dans le répertoire du projet
cd "$(dirname "$0")"

echo "📁 Répertoire: $(pwd)"
echo "📊 Fichiers du projet:"
ls -la | head -10

# Synchroniser les articles depuis le serveur local (optionnel)
if [ -f "scripts/sync-articles.js" ]; then
    echo "🔄 Synchronisation des articles..."
    node scripts/sync-articles.js || echo "⚠️ Sync échoué, utilisation des données par défaut"
fi

echo ""
echo "🌐 Déploiement sur Vercel..."
echo "Suis les instructions à l'écran :"
echo ""
echo "1. Choose scope: ton compte Vercel"
echo "2. Link to existing project? N (nouveau projet)"
echo "3. Project name: acppav-dashboard"
echo "4. Directory: ./ (répertoire actuel)"
echo ""

# Lancer le déploiement
vercel --prod

echo ""
echo "✅ DÉPLOIEMENT TERMINÉ !"
echo ""
echo "📋 URL finale:"
echo "https://acppav-dashboard.vercel.app/acppav"
echo ""
echo "💡 Pour les prochaines mises à jour:"
echo "git commit -m 'update' && git push  # Auto-deploy"