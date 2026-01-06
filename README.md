# 🚀 DevForum Frontend (Next.js)

## Türkiye'nin En Büyük Yazılım ve Teknoloji Forumu - Frontend

Bu repo **sadece frontend** kodlarını içerir. Backend ayrı bir repoda (`devforum-backend`).

---

## 📦 Tech Stack

- **Framework:** Next.js 16.1.1 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **UI Components:** Lucide React
- **State Management:** React Context API
- **Auth & Database:** Supabase
- **Backend API:** Express.js (Render'da host ediliyor)
- **Deployment:** Vercel

---

## 🏗️ Proje Yapısı

```
devforum-nextjs/
├── src/
│   ├── app/              # Next.js App Router (Routes)
│   │   ├── page.tsx      # Ana sayfa
│   │   ├── layout.tsx    # Root layout
│   │   ├── tools/        # Araçlar sayfaları
│   │   ├── about/        # Hakkımızda
│   │   └── ...
│   ├── components/       # React Component'ler
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── TopicCard.tsx
│   │   └── tools/        # Tool component'leri
│   ├── contexts/         # React Context'ler
│   │   └── AuthContext.tsx
│   ├── lib/              # Utility fonksiyonları
│   │   ├── supabase.ts   # Supabase client
│   │   └── api.ts        # Backend API client
│   └── utils/            # Helper fonksiyonlar
├── public/               # Statik dosyalar
└── next.config.ts        # Next.js konfigürasyonu
```

---

## 🔧 Environment Variables

`.env.local` dosyası oluşturun:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Backend API (Render)
NEXT_PUBLIC_API_URL=https://devforum-backend-102j.onrender.com
```

---

## 🚀 Development

```bash
# Dependencies yükle
npm install

# Development server başlat
npm run dev

# Build al
npm run build

# Production server başlat
npm start
```

**Local URL:** http://localhost:3000

---

## 📡 Backend Connection

Frontend, backend API'sine şu şekilde bağlanır:

```typescript
// src/lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL;

// API çağrısı
const response = await api.get('/api/endpoint');
```

**Backend Repo:** `devforum-backend` (Render'da deploy)

---

## 🌐 Deployment (Vercel)

### Otomatik Deploy:
1. GitHub'a push yap
2. Vercel otomatik detect eder
3. Environment variables ekle
4. Deploy başlar

### Manuel Deploy:
```bash
# Vercel CLI yükle
npm i -g vercel

# Deploy et
vercel

# Production'a deploy
vercel --prod
```

---

## 🔐 Environment Variables (Vercel)

Vercel Dashboard → Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_API_URL=https://devforum-backend-102j.onrender.com
```

---

## 📋 Features

- ✅ Server-Side Rendering (SSR)
- ✅ SEO Optimized (Meta tags, Sitemap, robots.txt)
- ✅ Responsive Design
- ✅ Dark Mode Support
- ✅ Real-time Updates (Supabase)
- ✅ User Authentication
- ✅ Credit System
- ✅ Banner System
- ✅ Tools (CV Creator, Video Downloader, etc.)
- ✅ Topic Management
- ✅ Messaging System

---

## 🔗 Links

- **Live Site:** https://devforum.xyz
- **Backend:** https://devforum-backend-102j.onrender.com
- **Frontend Repo:** https://github.com/serhatke08/devforum-fronted
- **Backend Repo:** https://github.com/serhatke08/devforum-backend

---

## 📝 Notes

- Frontend ve backend **tamamen ayrı** repolar
- Backend Render'da host ediliyor (değişmedi)
- Frontend Vercel'de host ediliyor (yeni)
- Database Supabase'de (değişmedi)

---

## 🐛 Troubleshooting

### Build hatası alıyorum:
```bash
# Cache temizle
rm -rf .next
npm run build
```

### API bağlantısı çalışmıyor:
- `.env.local` dosyasını kontrol et
- `NEXT_PUBLIC_API_URL` doğru mu?
- Backend Render'da çalışıyor mu?

### Vercel deploy hatası:
- Environment variables eklenmiş mi?
- Build command doğru mu? (`npm run build`)
- Framework "Next.js" seçilmiş mi?

---

## 👨‍💻 Geliştirici

**DevForum Team**

---

## 📜 License

Proprietary - All rights reserved
