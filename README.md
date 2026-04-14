# ACPPAV Dashboard Cloud

Dashboard de consultation et modification des articles ACPPAV déployé sur Vercel.

## 🚀 Fonctionnalités

- **📊 Consultation** des articles ACPPAV par catégorie
- **🧠 Modification via Agent Expert** - redirige vers Telegram pour l'agent ACPPAV spécialisé
- **⚡ Interface optimisée** pour mobile et desktop
- **🔒 Sécurisé** - pas d'accès direct aux fichiers, tout passe par l'agent expert

## 🛠 Architecture

**Mode Cloud (Vercel):**
- Interface de consultation read-only
- Données syncées depuis le serveur local
- Modifications via agent Telegram (sécurisé + garde-fous YMYL)

**Mode Local:**
- Interface complète avec modifications directes
- Auto-sync des données
- API complète

## 📝 Modifications

**Simples :** "remplacer X par Y", "ajouter texte", "supprimer phrase"
**Complexes :** Réécriture, optimisation SEO, changement de tone, restructuration

Toutes les modifications passent par l'**Agent ACPPAV Expert** avec :
- ✅ Garde-fous YMYL intégrés
- ✅ Expertise domaine médico-social
- ✅ Respect terminologie ACPPAV

## 🔄 Synchronisation

```bash
# Sync articles depuis le serveur local
node scripts/sync-articles.js

# Puis commit + push pour mettre à jour le cloud
git add . && git commit -m "sync: update articles data" && git push
```

## 🌐 URLs

- **Local:** http://localhost:3333/acppav
- **Cloud:** https://acppav.vercel.app/acppav

## 🔧 Déploiement

1. Push sur GitHub
2. Connecter à Vercel
3. Auto-deploy à chaque push sur master

---

*Système de modification d'articles ACPPAV avec intelligence artificielle et garde-fous YMYL.*