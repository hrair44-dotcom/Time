# Attendance Dashboard

Static attendance dashboard for GitHub Pages with Supabase row-level access.

## Current Status

- GitHub repo: `https://github.com/hrair44-dotcom/Time.git`
- Dashboard URL after GitHub Pages is enabled: `https://hrair44-dotcom.github.io/Time/`
- Main dashboard file: `index.html`
- Local Desktop copy: `C:\Users\BD\Desktop\attendance_dashboard (2)\attendance_dashboard (2).html`
- Supabase project URL: `https://cllnjdbkpsaffqrjhkcs.supabase.co`
- Latest synced data: Rawdata `599` rows, employee master `89` employees

## Data Access

The dashboard is configured to use Supabase when `SUPABASE_ACCESS` is set in `index.html`.
Supabase Row Level Security controls which departments each signed-in email can read.

Configured access:

| Email | Sec. |
|---|---|
| `akkaraphol.c@gmail.com` | `PG` |
| `kaew1475@gmail.com` | `PG` |

## Important Security Note

Never commit or paste the Supabase `service_role` / `secret` key into `index.html` or any public file.
Use it only as an environment variable when syncing data.

## Key Files

- `index.html`: dashboard app
- `supabase/schema.sql`: Supabase tables, indexes, and RLS policies
- `tools/sync-google-sheet-to-supabase.mjs`: Google Sheet to Supabase sync script
- `SUPABASE_SETUP.md`: Supabase setup instructions
- `SECURE_ACCESS_SETUP.md`: older Apps Script secure-access option, kept for reference
- `PROJECT_STATE.md`: current implementation notes and handoff summary
