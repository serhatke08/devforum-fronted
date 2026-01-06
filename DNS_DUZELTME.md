# 🔧 DNS Düzeltme - Root Domain Vercel'e Yönlendirme

## ❌ SORUN:

**Mevcut DNS Kayıtları:**
- ✅ `www` → Vercel'e yönlendiriyor (`c373b37a8ae57f0b.vercel-dns-017.com`)
- ❌ `@` (root) → Hala Hostinger'a yönlendiriyor (`216.198.79.1`)

**Sonuç:** `devforum.xyz` Hostinger'a gidiyor, `www.devforum.xyz` Vercel'e gidiyor.

---

## ✅ ÇÖZÜM:

### Adım 1: Vercel'den DNS Kayıtlarını Al

1. Vercel Dashboard → Project → **Settings** → **Domains**
2. `devforum.xyz` domain'ine tıkla
3. **DNS Configuration** sekmesine git
4. Vercel sana şunu verecek:

**Root Domain için:**
```
Type: A
Name: @
Value: 76.76.21.21 (veya Vercel'in verdiği IP)
```

VEYA

```
Type: ALIAS
Name: @
Value: cname.vercel-dns.com
```

---

### Adım 2: Hostinger DNS Güncelle

**Hostinger hPanel → Domains → DNS Zone Editor**

#### Mevcut (YANLIŞ):
```
A     @     216.198.79.1    (Hostinger IP - SİL!)
```

#### Yeni (DOĞRU):
```
A     @     76.76.21.21     (Vercel IP - EKLE!)
```

VEYA (Eğer Vercel ALIAS öneriyorsa):
```
ALIAS @     cname.vercel-dns.com
```

**Not:** Bazı DNS sağlayıcıları root domain için CNAME desteklemez, o yüzden A kaydı kullan.

---

### Adım 3: www Kaydı (Zaten Doğru)

```
CNAME www  c373b37a8ae57f0b.vercel-dns-017.com
```

Bu zaten doğru, değiştirme!

---

## 📋 Adım Adım:

### 1. Vercel'den IP/ALIAS Al

Vercel Dashboard:
- Settings → Domains → devforum.xyz
- DNS Configuration
- Root domain için ne diyor? (A kaydı mı ALIAS mı?)

### 2. Hostinger'da Güncelle

**Eski A kaydını sil:**
```
A     @     216.198.79.1    → SİL
```

**Yeni A kaydını ekle:**
```
A     @     76.76.21.21     → EKLE (Vercel'in verdiği IP)
```

### 3. Bekle (DNS Propagation)

- **5-30 dakika** bekle
- DNS cache temizlenmesi gerekir
- Farklı lokasyonlarda farklı süreler olabilir

### 4. Test Et

```bash
# DNS kontrol
nslookup devforum.xyz

# Vercel IP'si görünmeli (76.76.21.21)
```

**Browser'da test:**
```
https://devforum.xyz
```
- Vercel'den sunuluyor mu?
- SSL çalışıyor mu?

---

## 🔍 Vercel DNS Kayıtları (Örnek):

Vercel genellikle şunu verir:

```
Type    Name    Value
A       @       76.76.21.21
CNAME   www     cname.vercel-dns.com
```

VEYA

```
Type    Name    Value
ALIAS   @       cname.vercel-dns.com
CNAME   www     cname.vercel-dns.com
```

---

## ⚠️ ÖNEMLİ NOTLAR:

1. **A kaydı kullan** (ALIAS her DNS sağlayıcısında yok)
2. **Eski A kaydını sil** (Hostinger IP'si)
3. **www kaydını değiştirme** (zaten doğru)
4. **DNS propagation bekle** (5-30 dk)
5. **SSL otomatik** (Vercel halleder)

---

## 🚨 Sorun Devam Ederse:

### 1. DNS Cache Temizle

**Browser:**
- Hard refresh: Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)

**DNS Cache:**
```bash
# Mac
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder

# Windows
ipconfig /flushdns
```

### 2. Farklı DNS Server Kullan

- Google DNS: `8.8.8.8`
- Cloudflare DNS: `1.1.1.1`

### 3. Vercel Domain Ayarları Kontrol

- Domain verified mi?
- SSL aktif mi?
- Redirect ayarları doğru mu?

---

## ✅ Başarı Kriterleri:

- ✅ `devforum.xyz` → Vercel'den açılıyor
- ✅ `www.devforum.xyz` → Vercel'den açılıyor
- ✅ SSL çalışıyor (yeşil kilit)
- ✅ Hostinger'a yönlenmiyor

---

**Vercel'den root domain için IP/ALIAS'ı al ve Hostinger'da A kaydını güncelle!**

