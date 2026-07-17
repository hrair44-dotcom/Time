# Project State

Last updated: 2026-07-17

## Repository

- GitHub repo: `https://github.com/hrair44-dotcom/Time.git`
- Local repo: `C:\Users\BD\Documents\Air4\Time-github`
- Desktop dashboard copy: `C:\Users\BD\Desktop\attendance_dashboard (2)\attendance_dashboard (2).html`
- Active branches pushed: `main`, `gh-pages`
- Latest completed commit at time of note: `e5cf556` (`Fix Supabase project URL`)

## Dashboard Behavior

- `index.html` is the production dashboard.
- The old embedded data arrays are empty:
  - `const DATA = [];`
  - `const EMP = [];`
- The upload button and upload input were removed.
- The KPI "พนักงานทั้งหมด" no longer falls back to Rawdata.
- In Supabase mode, employee count comes from `employee_master` through RLS.

## Original Google Sheet Source

- Spreadsheet ID: `1rzdFlQujYzNLtatBlc2TXNnAGkbZDgmS4zzToSeF3zg`
- Rawdata gid: `750856257`
- Employee master sheet `Y` gid: `2031942902`

## Supabase

- Supabase project URL: `https://cllnjdbkpsaffqrjhkcs.supabase.co`
- Frontend key in `index.html`: publishable key only
- Secret/service key: not stored in repo and must never be committed
- SQL schema and RLS: `supabase/schema.sql`
- Sync script: `tools/sync-google-sheet-to-supabase.mjs`

## Access Rules

Configured in `public.user_access`:

| Email | Sec. |
|---|---|
| `akkaraphol.c@gmail.com` | `ALL` |
| `kaew1475@gmail.com` | `PG` |

RLS policies allow authenticated users to read rows only when their email has access to the row's `sec`.
Use `ALL` in `user_access.sec` for an admin-style all-department account.

## Supabase Tables

- `rawdata`: attendance/leave/late records
- `employee_master`: employee master for KPI count
- `user_access`: email-to-department access map

The previous `full` column name was changed to `full_name` because `full` conflicts with PostgreSQL syntax.

## Last Sync Result

The latest successful sync inserted/upserted:

```text
Parsed rawdata rows: 599
Parsed employees: 89
Upserted rawdata: 500/599
Upserted rawdata: 599/599
Upserted employee_master: 89/89
Sync complete
```

## How To Sync Again

Run from `C:\Users\BD\Documents\Air4\Time-github`:

```powershell
$env:SUPABASE_URL="https://cllnjdbkpsaffqrjhkcs.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_OR_SECRET_KEY"
node tools\sync-google-sheet-to-supabase.mjs
Remove-Item Env:\SUPABASE_SERVICE_ROLE_KEY
Remove-Item Env:\SUPABASE_URL
```

Dry-run without uploading:

```powershell
$env:DRY_RUN="1"
node tools\sync-google-sheet-to-supabase.mjs
Remove-Item Env:\DRY_RUN
```

## Supabase Auth Settings Required

In Supabase dashboard:

- `Authentication` -> `URL Configuration`
- Site URL: `https://hrair44-dotcom.github.io/Time/`
- Redirect URL: `https://hrair44-dotcom.github.io/Time/`

## GitHub Pages

If the site is still 404, the repo owner/admin must enable GitHub Pages:

- Settings -> Pages
- Source: `Deploy from a branch`
- Branch: `main`
- Folder: `/ (root)`

Expected URL:

`https://hrair44-dotcom.github.io/Time/`
