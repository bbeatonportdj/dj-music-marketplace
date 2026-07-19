# 🔒 Security Checklist - DJ Music Marketplace

## สิ่งที่ต้องทำทันที

### 1. หมุน Secrets ทั้งหมด

#### Supabase
1. ไปที่ https://supabase.com/dashboard
2. เลือกโปรเจคของคุณ
3. ไปที่ **Settings** → **API**
4. กด **Regenerate** ที่ service_role key
5. คัดลอก key ใหม่
6. ไปที่ Vercel → Settings → Environment Variables
7. แก้ `SUPABASE_SERVICE_ROLE_KEY` เป็นค่าใหม่

#### JWT Secret
1. ไปที่ Supabase Dashboard → **Settings** → **JWT Keys**
2. คลิกแท็บ **Legacy JWT Secret**
3. คัดลอก key
4. แก้ `JWT_SECRET` ใน Vercel env

#### Stripe
1. ไปที่ https://dashboard.stripe.com
2. **Developers** → **API keys**
3. Reveal test key → คัดลอก
4. แก้ `STRIPE_SECRET_KEY` ใน Vercel env

#### Omise (ถ้ายังใช้อยู่)
1. ไปที่ https://dashboard.omise.co
2. **Developers** → **Keys**
3. คัดลอก Live Secret Key (`skey_live_...`)
4. แก้ `OMISE_SKEY` ใน Vercel env

---

### 2. ลบ .env จาก Git History

รันคำสั่งนี้ใน terminal:

```bash
# ดาวน์โหลด BFG Repo-Cleaner
brew install bfg

# ลบ .env จาก history
bfg --delete-files .env

# Force push
git push origin main --force
```

หรือใช้วิธี manual:

```bash
# ลบ .env จาก commit ล่าสุด
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch .env' \
  --prune-empty --tag-name-filter cat -- --all

# Force push
git push origin main --force
```

---

### 3. ตั้ง ALLOWED_ORIGINS

ใน Vercel env เพิ่ม:

```
ALLOWED_ORIGINS=https://djmusicmarketplace.fun,https://www.djmusicmarketplace.fun
```

---

### 4. ตรวจสอบว่าทำเสร็จแล้ว

- [ ] Supabase service_role key ใหม่
- [ ] JWT Secret ใหม่
- [ ] Stripe key ใหม่
- [ ] Omise key ใหม่ (ถ้ายังใช้)
- [ ] .env ลบจาก git history แล้ว
- [ ] ALLOWED_ORIGINS ตั้งค่าแล้ว
- [ ] ทดสอบ login ได้
- [ ] ทดสอบซื้อ track ได้
