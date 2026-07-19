# 💰 Payment Testing Checklist

## ทดสอบ PromptPay QR

### ขั้นตอน
1. เปิดเว็บ https://djmusicmarketplace.fun
2. สมัครสมาชิกหรือ login
3. เลือก track ที่มีราคา (ไม่ใช่ FREE)
4. กด "Add to Cart"
5. กด "Checkout"
6. เลือก "PromptPay QR"
7. สแกน QR ด้วย app ธนาคาร
8. โอนเงินตามจำนวนที่แสดง
9. กดปุ่ม "ฉันได้ชำระเงินแล้ว"
10. ตรวจสอบว่า:
    - [ ] สถานะเปลี่ยนเป็น "Paid"
    - [ ] Track ปลดล็อคให้ download
    - [ ] ได้รับ notification สำเร็จ

---

## ทดสอบ Stripe

### ขั้นตอน
1. เปิดเว็บ https://djmusicmarketplace.fun
2. Login
3. เลือก track ที่มีราคา
4. กด "Add to Cart"
5. กด "Checkout"
6. เลือก "Credit Card (Stripe)"
7. กรอกข้อมูลบัตรเครดิต (ใช้ test card):
   - Card: `4242 4242 4242 4242`
   - Exp: `12/25`
   - CVC: `123`
8. กด "Pay"
9. ตรวจสอบว่า:
    - [ ] Redirect ไปหน้า success
    - [ ] Track ปลดล็อคให้ download
    - [ ] ได้รับ notification สำเร็จ

---

## ทดสอบ Free Track

### ขั้นตอน
1. เปิดเว็บ https://djmusicmarketplace.fun
2. Login
3. เลือก track ที่มีราคา "FREE"
4. กด "Download Free"
5. ตรวจสอบว่า:
    - [ ] ไฟล์ download ได้ทันที
    - [ ] ไม่ต้องจ่ายเงิน
    - [ ] Track ปรากฏในหน้า Downloads

---

## ทดสอบ Download หลังซื้อ

### ขั้นตอน
1. ไปที่หน้า "Downloads" หรือ "Profile"
2. หารายการที่ซื้อแล้ว
3. กด "Download"
4. ตรวจสอบว่า:
    - [ ] ไฟล์ download ได้
    - [ ] ไฟล์เสียงเล่นได้
    - [ ] คุณภาพเสียงถูกต้อง

---

## ถ้ามีปัญหา

| ปัญหา | วิธีแก้ |
|-------|--------|
| QR ไม่แสดง | ตรวจสอบ VITE_PROMPTPAY_ID ใน env |
| Stripe ไม่ทำงาน | ตรวจสอบ STRIPE_SECRET_KEY ใน env |
| Download ไม่ได้ | ตรวจสอบสิทธิ์ purchase ใน Supabase |
| Login ไม่ได้ | ตรวจสอบ JWT_SECRET ใน env |
