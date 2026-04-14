# 🚀 Déploiement Vercel - ACPPAV Dashboard

## ⚡ Option 1: Script automatique (2 minutes)

```bash
cd /tmp/acppav-dashboard
./deploy-to-vercel.sh
```

Le script fait tout automatiquement !

## 🌐 Option 2: Interface web Vercel (1 minute)

### Étapes :

1. **Va sur** → https://vercel.com
2. **Sign in** → avec GitHub
3. **Add New Project**
4. **Import Git Repository**
5. **Cherche** → `acppav-dashboard`
6. **Import**
7. **Deploy** (auto-détecte Next.js)

### ✅ Résultat automatique :
- **Framework:** Next.js ✅
- **Build Command:** `npm run build` ✅
- **Install Command:** `npm install` ✅
- **Output Directory:** `.next` ✅

## 🎯 URL finale

**https://acppav-dashboard.vercel.app/acppav**

## 🔄 Mises à jour futures

```bash
# Modifier le code, puis :
git add . && git commit -m "update" && git push
```

Vercel redéploie automatiquement !

## 📱 Test

Une fois déployé, teste :
- Navigation entre catégories
- Clic sur un article
- Bouton "CONTACTER L'EXPERT" → ouvre Telegram

---

**Le dashboard est 100% prêt pour la production !** 🎉