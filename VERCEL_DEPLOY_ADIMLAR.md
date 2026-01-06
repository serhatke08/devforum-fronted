# 🚀 Vercel Deployment - Adım Adım

## ✅ GitHub Push Tamamlandı!

Repo: https://github.com/serhatke08/devforum-fronted

---

## 📋 Vercel'e Deploy Adımları:

### Adım 1: Vercel'e Giriş
1. https://vercel.com adresine git
2. **Sign Up** (GitHub ile giriş yap)
3. GitHub hesabını bağla

### Adım 2: Proje Import Et
1. **Add New Project** butonuna tıkla
2. GitHub repo'larından **devforum-fronted** seç
3. **Import** butonuna tıkla

### Adım 3: Framework Ayarları
Vercel otomatik algılar:
- **Framework Preset:** Next.js ✅
- **Root Directory:** `./` ✅
- **Build Command:** `npm run build` ✅
- **Output Directory:** `.next` ✅

**Değiştirme gerekmez!**

### Adım 4: Environment Variables Ekle

**Settings** → **Environment Variables** sekmesine git:

1. **NEXT_PUBLIC_SUPABASE_URL**
   - Value: `https://vtjkwzazbvqwaiikzzio.supabase.co`
   - Environment: Production, Preview, Development (hepsini seç)

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0amt3emF6YnZxd2FpaWt6emlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzOTIxMzksImV4cCI6MjA3NDk2ODEzOX0.Z4QQQlmrKF1uI3qSqWdbzc2E2PCWL2-tRMwy8swCPgk`
   - Environment: Production, Preview, Development (hepsini seç)

3. **NEXT_PUBLIC_API_URL**
   - Value: `https://devforum-backend-102j.onrender.com`
   - Environment: Production, Preview, Development (hepsini seç)

4. **Save** butonuna tıkla

### Adım 5: Deploy
1. **Deploy** butonuna tıkla
2. Build süreci başlayacak (~2-3 dakika)
3. Başarılı olunca URL alacaksın:
   ```
   https://devforum-fronted.vercel.app
   ```

---

## 🧪 Test:

### 1. Site Açılıyor mu?
```
https://devforum-fronted.vercel.app
```
- Açılıyor mu?
- Hata var mı?

### 2. SSR Çalışıyor mu?
```bash
curl https://devforum-fronted.vercel.app/ | grep -A 10 "<body>"
```
- Gerçek içerik görünmeli (boş `<div id="root">` değil!)
- HTML'de "DevForum" yazısı olmalı

### 3. Sitemap Var mı?
```
https://devforum-fronted.vercel.app/sitemap.xml
```
- Otomatik oluşturulan sitemap görünmeli

---

## 📋 Domain Bağlama (devforum.xyz):

### Adım 1: Vercel'de Domain Ekle
1. Vercel → Project → **Settings** → **Domains**
2. **Add Domain** butonuna tıkla
3. Domain: `devforum.xyz` yaz
4. **Add** butonuna tıkla

### Adım 2: DNS Kayıtları
Vercel sana DNS kayıtlarını verecek (örnek):
```
Type    Name    Value
A       @       76.76.21.21
CNAME   www     cname.vercel-dns.com
```

### Adım 3: Hostinger DNS Güncelle
1. Hostinger hPanel → **Domains** → **DNS Zone Editor**
2. Mevcut A kaydını sil:
   ```
   A     @     145.223.89.41
   ```
3. Vercel'in verdiği kayıtları ekle:
   ```
   A     @     76.76.21.21
   CNAME www   cname.vercel-dns.com
   ```
4. **Save**

### Adım 4: SSL Bekle
- DNS propagation: 5-30 dakika
- SSL sertifikası: Otomatik (Let's Encrypt)
- Vercel otomatik halleder

### Adım 5: Test
```
https://devforum.xyz
```
- Site açılıyor mu?
- SSL çalışıyor mu? (yeşil kilit)

---

## 🎯 Sonraki Adımlar:

### 1. Google Search Console
1. Yeni sitemap gönder: `https://devforum.xyz/sitemap.xml`
2. URL denetimi yap
3. 24-48 saat bekle
4. "Keşfedilen sayfalar" > 0 olmalı ✅

### 2. Eski Hostinger
- Artık kullanılmaz
- Veya yedek olarak kalabilir

### 3. Backend
- Render'da kalır (değişmez)
- API endpoint'leri aynı

---

## ✅ Başarı Kriterleri:

- ✅ Site açılıyor
- ✅ SSR çalışıyor (gerçek HTML)
- ✅ Sitemap otomatik oluşturuluyor
- ✅ Domain bağlı
- ✅ SSL çalışıyor
- ✅ Google sitemap'i okuyor

---

## 🚨 Sorun Giderme:

### Build Hatası:
- Environment variables kontrol et
- Build log'larına bak

### Domain Bağlanmıyor:
- DNS propagation bekle (5-30 dk)
- DNS kayıtlarını kontrol et

### SSR Çalışmıyor:
- `'use client'` directive kontrol et
- Component'ler client component mi?

---

**Hazır mısın? Vercel'e git ve deploy et!** 🚀

