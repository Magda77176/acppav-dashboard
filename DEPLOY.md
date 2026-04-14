# 🚀 Déploiement ACPPAV Dashboard

## ✅ GitHub - FAIT !

Le code est déjà poussé sur GitHub : https://github.com/Magda77176/acppav-dashboard

## 🌐 Vercel - Étapes finales

### 1. Connecter à Vercel (2 minutes)

1. Va sur **vercel.com**
2. **Sign in with GitHub** (utilise le compte Magda77176)
3. **Add New → Project**
4. **Import Git Repository**
5. Cherche `acppav-dashboard`
6. **Import**

### 2. Configuration automatique

Vercel détectera automatiquement :
- ✅ **Framework:** Next.js
- ✅ **Build Command:** `npm run build`
- ✅ **Install Command:** `npm install`
- ✅ **Output Directory:** `.next`

### 3. Deploy

Clique **Deploy** et attendre 2-3 minutes.

## 🎯 URL finale

Une fois déployé : **https://acppav-dashboard.vercel.app/acppav**

## 🔄 Synchronisation des données

Pour mettre à jour les articles depuis ton serveur local :

```bash
cd /tmp/acppav-dashboard
node scripts/sync-articles.js
git add . && git commit -m "sync: update articles" && git push
```

Vercel redéploiera automatiquement.

## ✨ Fonctionnalités

- **📊 Consultation** : Tous tes articles ACPPAV par catégorie
- **🧠 Modification** : Bouton direct vers Telegram + agent expert
- **📱 Responsive** : Interface optimisée mobile/desktop
- **🔒 Sécurisé** : Pas d'accès direct aux fichiers, tout via agent

---

**Le dashboard est prêt ! Il suffit de connecter à Vercel.** 🎉