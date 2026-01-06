# 🚨 Vercel Site Ulaşılamıyor - Sorun Giderme

## ✅ Deploy Başarılı Ama Site Açılmıyor

### 🔍 Olası Nedenler:

1. **Environment Variables Eksik/Yanlış**
2. **Runtime Hatası (Build başarılı ama çalışmıyor)**
3. **Component Render Hatası**
4. **API Bağlantı Sorunu**
5. **CORS Sorunu**

---

## 🔧 Hızlı Çözümler:

### 1. Vercel Log'larını Kontrol Et

1. Vercel Dashboard → Project → **Deployments**
2. Son deployment'a tıkla
3. **Functions** sekmesine git
4. **Runtime Logs** kontrol et
5. Hata mesajını gör

### 2. Environment Variables Kontrol

Vercel → Settings → Environment Variables:

**Kontrol et:**
- ✅ `NEXT_PUBLIC_SUPABASE_URL` var mı?
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` var mı?
- ✅ `NEXT_PUBLIC_API_URL` var mı?
- ✅ Value'lar doğru mu?
- ✅ Environment: Production, Preview, Development (hepsini seç)

### 3. Build Log'larını Kontrol

1. Vercel → Deployments → Son deployment
2. **Build Logs** sekmesine git
3. Hata var mı kontrol et

### 4. Runtime Hatası Kontrol

**Olası hatalar:**
- Component render hatası
- API çağrısı hatası
- Environment variable undefined

**Çözüm:**
- Browser console'u aç (F12)
- Network tab'ı kontrol et
- Console'da hata var mı?

---

## 🛠️ Acil Düzeltmeler:

### Düzeltme 1: Basitleştirilmiş Ana Sayfa

Ana sayfa çok karmaşık olabilir. Basitleştirilmiş versiyon oluşturuldu.

### Düzeltme 2: Environment Variables Kontrol

```bash
# Vercel'de kontrol et:
NEXT_PUBLIC_SUPABASE_URL=https://vtjkwzazbvqwaiikzzio.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_API_URL=https://devforum-backend-102j.onrender.com
```

### Düzeltme 3: Error Boundary Ekle

Runtime hatalarını yakalamak için error boundary ekle.

---

## 📋 Kontrol Listesi:

- [ ] Vercel log'larını kontrol ettin mi?
- [ ] Environment variables var mı?
- [ ] Build log'larında hata var mı?
- [ ] Browser console'da hata var mı?
- [ ] Network tab'ında failed request var mı?
- [ ] Domain doğru mu? (vercel.app URL'i mi kullanıyorsun?)

---

## 🔍 Hangi Hata Alıyorsun?

### "500 Internal Server Error"
- Runtime hatası
- Log'lara bak

### "404 Not Found"
- Route yanlış
- Domain yanlış

### "Blank Page"
- JavaScript hatası
- Console'a bak

### "Loading..."
- API timeout
- Backend kontrol et

---

## 💡 Hızlı Test:

### 1. Vercel URL'i Test Et
```
https://devforum-fronted.vercel.app
```

### 2. curl ile Test
```bash
curl https://devforum-fronted.vercel.app
```
- HTML dönüyor mu?
- Hata mesajı var mı?

### 3. Browser Console
- F12 → Console
- Hata var mı?

---

## 🚨 En Olası Sorun:

**Environment Variables eksik veya yanlış!**

**Kontrol et:**
1. Vercel → Settings → Environment Variables
2. 3 variable var mı?
3. Value'lar doğru mu?
4. Environment: Production seçili mi?

**Düzelt:**
1. Variable'ları sil
2. Tekrar ekle (kopyala-yapıştır)
3. Redeploy yap

---

**Hangi hata mesajını alıyorsun? Vercel log'larında ne yazıyor?**

