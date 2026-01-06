# 🔧 Vercel Environment Variables - Doğru Format

## ✅ DOĞRU ADLAR (Kopyala-Yapıştır):

### 1. Supabase URL
```
NEXT_PUBLIC_SUPABASE_URL
```

**Value:**
```
https://vtjkwzazbvqwaiikzzio.supabase.co
```

---

### 2. Supabase Anon Key
```
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

**Value:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0amt3emF6YnZxd2FpaWt6emlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzOTIxMzksImV4cCI6MjA3NDk2ODEzOX0.Z4QQQlmrKF1uI3qSqWdbzc2E2PCWL2-tRMwy8swCPgk
```

---

### 3. Backend API URL
```
NEXT_PUBLIC_API_URL
```

**Value:**
```
https://devforum-backend-102j.onrender.com
```

---

## 📋 Vercel'de Ekleme Adımları:

1. **Settings** → **Environment Variables**
2. **Add New** butonuna tıkla
3. **Name** kutusuna **TAM OLARAK** şunu yaz (kopyala-yapıştır):
   ```
   NEXT_PUBLIC_SUPABASE_URL
   ```
4. **Value** kutusuna value'yu yapıştır
5. **Environment** seçeneklerini işaretle:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
6. **Save** butonuna tıkla
7. Diğer 2 variable için tekrarla

---

## ⚠️ YAYGIN HATALAR:

### ❌ YANLIŞ:
- `NEXT_PUBLIC-SUPABASE_URL` (tire var, alt çizgi olmalı)
- `NEXT_PUBLIC SUPABASE_URL` (boşluk var)
- `next_public_supabase_url` (küçük harf, büyük olmalı)
- `NEXT_PUBLIC_SUPABASE_URL ` (sonunda boşluk)
- ` NEXT_PUBLIC_SUPABASE_URL` (başında boşluk)

### ✅ DOĞRU:
- `NEXT_PUBLIC_SUPABASE_URL` (tam olarak bu)

---

## 🔍 Kontrol Listesi:

- [ ] Sadece BÜYÜK HARF
- [ ] Alt çizgi (_) kullanıldı, tire (-) kullanılmadı
- [ ] Başta/sonda boşluk yok
- [ ] Özel karakter yok (!, @, #, $, vb.)
- [ ] Rakamla başlamıyor
- [ ] Tam olarak yukarıdaki gibi

---

## 💡 İPUCU:

**Kopyala-Yapıştır kullan!** Manuel yazma, hata yapma riski var.

1. Yukarıdaki adları kopyala
2. Vercel'e yapıştır
3. Value'ları ekle
4. Save

---

**Hata devam ederse, hangi variable'da hata aldığını söyle!**

