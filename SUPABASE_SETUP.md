# Supabase Setup

วิธีนี้ใช้ Supabase Auth แบบ Magic Link/OTP ทางอีเมล และใช้ Row Level Security (RLS) เพื่อให้แต่ละอีเมลอ่านได้เฉพาะแผนกที่กำหนด

## สิทธิ์ที่ตั้งไว้แล้ว

| email | Sec. |
|---|---|
| akkaraphol.c@gmail.com | PG |
| kaew1475@gmail.com | PG |

## 1. สร้าง Supabase project

1. เข้า https://supabase.com
2. Create new project
3. เลือก Free plan
4. ตั้งรหัส database แล้วรอ project สร้างเสร็จ

Free plan ที่ Supabase ระบุไว้มี 2 active projects, 500 MB database, 50,000 monthly active users, 5 GB egress และ project อาจถูก pause หลังไม่ใช้งาน 1 สัปดาห์

## 2. สร้างตารางและ RLS

1. เข้า Supabase Dashboard
2. ไปที่ SQL Editor
3. วาง SQL จาก `supabase/schema.sql`
4. กด Run

## 3. ตั้งค่า Auth

1. ไปที่ Authentication > Providers
2. เปิด Email provider
3. ใช้ Magic Link/OTP ได้เลย ไม่ต้องทำ Google OAuth
4. ไปที่ Authentication > URL Configuration
5. เพิ่ม Site URL เป็น URL dashboard เช่น `https://hrair44-dotcom.github.io/Time/`
6. เพิ่ม Redirect URLs เช่น:
   - `https://hrair44-dotcom.github.io/Time/`
   - URL local ที่ใช้ทดสอบ ถ้ามี

## 4. ใส่ค่า Supabase ใน dashboard

ไปที่ `index.html` แล้วแทนค่า:

```js
const SUPABASE_ACCESS = {
  url: 'PASTE_SUPABASE_PROJECT_URL_HERE',
  anonKey: 'PASTE_SUPABASE_ANON_KEY_HERE'
};
```

หาค่าได้จาก Supabase Dashboard > Project Settings > API:

- Project URL
- anon public key

## 5. Sync ข้อมูล Google Sheet เข้า Supabase

ใช้ service role key เฉพาะตอน sync เท่านั้น ห้ามใส่ service role key ลงใน `index.html`

PowerShell:

```powershell
$env:SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY"
node tools/sync-google-sheet-to-supabase.mjs
```

หลัง sync แล้ว ผู้ใช้ที่ล็อกอินด้วยอีเมลที่มีสิทธิ์ `PG` จะ query ได้เฉพาะ row ที่ `sec = PG`

## 6. เพิ่มสิทธิ์ผู้จัดการแผนกอื่น

เพิ่ม row ในตาราง `user_access` เช่น:

```sql
insert into public.user_access (email, sec)
values ('manager-af@example.com', 'AF')
on conflict (email, sec) do nothing;
```

ถ้าต้องการให้บางอีเมลเห็นทุกแผนก ให้ใช้ `ALL`:

```sql
insert into public.user_access (email, sec)
values ('admin@example.com', 'ALL')
on conflict (email, sec) do nothing;
```
