# Secure Access Setup

ระบบนี้ใช้ Google Login ที่หน้า dashboard และใช้ Google Apps Script เป็น backend เพื่อส่งข้อมูลกลับมาเฉพาะแผนกที่อีเมลนั้นมีสิทธิ์

## สิทธิ์ที่ตั้งไว้แล้ว

| email | Sec. |
|---|---|
| akkaraphol.c@gmail.com | PG |
| kaew1475@gmail.com | PG |

## 1. สร้าง Google OAuth Client ID

1. เข้า Google Cloud Console
2. สร้างหรือเลือก project
3. ไปที่ APIs & Services > Credentials
4. กด Create Credentials > OAuth client ID
5. เลือก Application type เป็น Web application
6. ใส่ Authorized JavaScript origins:
   - `https://hrair44-dotcom.github.io`
   - ถ้าทดสอบ local ให้เพิ่ม origin ของ local server ด้วย
7. copy Client ID ที่ได้
8. นำ Client ID ไปแทน `PASTE_GOOGLE_OAUTH_CLIENT_ID_HERE` ใน:
   - `index.html`
   - `apps-script/Code.gs`

## 2. Deploy Apps Script Web App

1. เข้า https://script.google.com
2. New project
3. คัดลอกโค้ดจาก `apps-script/Code.gs` ไปไว้ในไฟล์ `Code.gs`
4. ตั้งค่า manifest โดยเปิด Project Settings > Show appsscript.json แล้วคัดลอกจาก `apps-script/appsscript.json`
5. กด Deploy > New deployment
6. เลือก type เป็น Web app
7. Execute as: Me
8. Who has access: Anyone
9. Authorize ตามขั้นตอนของ Google
10. Copy Web app URL
11. นำ URL ไปแทน `PASTE_APPS_SCRIPT_WEB_APP_URL_HERE` ใน `index.html`

## หมายเหตุสำคัญ

- หลังตั้งค่าเสร็จ ควรปิด public share ของ Google Sheet ไม่ให้ทุกคนที่มีลิงก์เปิดได้
- หน้าเว็บจะใช้โหมด secure ก็ต่อเมื่อใส่ทั้ง OAuth Client ID และ Apps Script Web App URL แล้ว
- ถ้าเพิ่มผู้จัดการแผนกอื่น ให้แก้ `CONFIG.access` ใน `apps-script/Code.gs` แล้ว deploy Apps Script ใหม่
