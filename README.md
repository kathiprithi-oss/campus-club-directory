# Campus Club Directory

A beginner-friendly full-stack web application for discovering and managing student clubs on a college campus. Students can search and filter clubs, open club details, and find meeting/contact information. An administrator can add, edit, and delete club listings using a server-verified admin token.

## Problem and objectives

Campus club information is often scattered across notices and messages. This directory puts club descriptions, categories, tags, meeting details, and contact emails in one searchable place. The learning objectives are to understand a responsive HTML/CSS/JavaScript frontend, a Node.js/Express REST API, PostgreSQL data storage, server-side validation, environment variables, and Git workflows.

## Users and features

- **Visitors/students:** browse clubs, search by text, filter by category, and open club details. No account is needed to browse.
- **Administrator:** use the Admin dialog and a secret `ADMIN_TOKEN` to create, update, and delete club listings. Admin writes are checked by the Express backend; the token is not stored in browser local storage.
- **Implemented:** responsive directory UI, category filters, search, detail dialog, CRUD endpoints, input validation, duplicate-name constraint, Supabase persistence, rate limiting, security headers, health endpoint, and useful error messages.
- **Not included in this MVP:** student accounts, club membership applications, event scheduling, file uploads, email delivery, or per-club ownership.

## Technology stack

- HTML5, CSS3, vanilla browser JavaScript
- Node.js 20+ and Express 5
- Supabase PostgreSQL via `@supabase/supabase-js`
- `dotenv`, `helmet`, `express-rate-limit`
- Git and GitHub

## Folder structure

```text
campus-club-directory/
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── backend/
│   ├── server.js
│   ├── supabase.js
│   ├── routes/clubs.js
│   ├── middleware/admin.js
│   ├── utils/validation.js
│   ├── package.json
│   ├── .env.example
│   ├── .env                 # create locally; do not commit
│   └── .gitignore
├── database/schema.sql
├── .gitignore
└── README.md
```

## Prerequisites

Install these on Windows (macOS/Linux equivalents are available from the same sites):

1. [Visual Studio Code](https://code.visualstudio.com/)
2. [Node.js LTS](https://nodejs.org/) (npm is included; use Node 20 or newer)
3. [Git](https://git-scm.com/downloads)
4. A free [Supabase](https://supabase.com/) account
5. A [GitHub](https://github.com/) account if you want to publish the source

Verify in a new VS Code terminal:

```powershell
node --version
npm --version
git --version
```

## Setup from a new folder

1. Download/extract the project ZIP, then open the `campus-club-directory` folder in VS Code.
2. Open **Terminal → New Terminal**. Run the following from the project root:

   ```powershell
   cd backend
   npm install
   ```

3. Create a Supabase project from the dashboard. In **Project Settings → API** (labels may change), copy the Project URL and the server-side service-role/secret key. Keep this key private; never put it in frontend files or GitHub.
4. In Supabase, open **SQL Editor → New query**, paste the full contents of `database/schema.sql`, and click **Run**. Confirm that `public.clubs` appears in **Table Editor**. Optional demo inserts are commented out; uncomment them only if you want demo data.
5. Copy `backend/.env.example` to `backend/.env`. Fill it in like this, using your actual values:

   ```dotenv
   PORT=3000
   NODE_ENV=development
   SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=YOUR_REAL_SERVER_SIDE_KEY
   ADMIN_TOKEN=PASTE_A_LONG_RANDOM_SECRET_HERE
   ```

   `SUPABASE_URL` identifies the project. `SUPABASE_SERVICE_ROLE_KEY` is a privileged server-only credential. `ADMIN_TOKEN` protects the admin write endpoints. `.env.example` contains placeholders and is safe to commit; `.env` contains secrets and must never be committed.
6. Generate a random admin token from the `backend` directory:

   ```powershell
   node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
   ```

   Copy the output into `ADMIN_TOKEN` in `backend/.env`. Do not share it. If it leaks, replace it.
7. Start the server from the `backend` directory:

   ```powershell
   npm start
   ```

   Expected terminal output: `Campus Club Directory running at http://localhost:3000`
8. Open [http://localhost:3000](http://localhost:3000) in your browser. Do not open `index.html` directly from File Explorer; the app needs the Express API.
9. Visit [http://localhost:3000/api/health](http://localhost:3000/api/health). A healthy server returns JSON similar to `{"status":"ok","service":"campus-club-directory-api"}`.
10. To manage listings, select **Admin**, enter the token from `.env`, then create, edit, or delete a club. Browse/search/filter changes should appear in the directory.

To stop the server, focus the terminal and press `Ctrl+C`. For development auto-restart, run `npm run dev` from `backend`.

## Environment variables

| Variable | Purpose |
|---|---|
| `PORT` | Local HTTP port (defaults to 3000) |
| `NODE_ENV` | Environment label, e.g. `development` or `production` |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Privileged key used only by the backend |
| `ADMIN_TOKEN` | Random secret required for create/update/delete actions |

The application does not have user accounts. Public read requests go through Express. The service-role key bypasses normal RLS checks, so the backend must remain trusted and enforce admin authorization for every write endpoint. RLS is enabled and no anonymous policies are created; do not use the service-role key in the browser. For a production multi-admin application, replace the shared token with Supabase Auth and per-user authorization.

## Architecture

```text
Browser (HTML/CSS/vanilla JS)
        | fetch('/api/...')
        v
Node.js + Express API (validation, rate limit, admin-token checks)
        | server-only Supabase client
        v
Supabase PostgreSQL (public.clubs, constraints, indexes, updated_at trigger)
```

## REST API

All successful JSON responses use a `data` property for records unless noted. The admin token is sent in the `x-admin-token` header for write operations. `GET /api/clubs` is public; all write endpoints require the token.

| Method | Path | Purpose | Request | Access / common errors |
|---|---|---|---|---|
| GET | `/api/health` | Health check | None | Public; 200 |
| GET | `/api/clubs` | List clubs sorted by name | None | Public; 503 if DB config missing |
| GET | `/api/clubs/:id` | Get one club | UUID in path | Public; 404 if missing |
| POST | `/api/clubs` | Create club | JSON fields below | Admin; 400 invalid, 401 token missing/invalid, 409 duplicate |
| PUT | `/api/clubs/:id` | Replace editable club fields | JSON fields below | Admin; 400 invalid, 401 unauthorized, 404 missing, 409 duplicate |
| DELETE | `/api/clubs/:id` | Delete a club | UUID in path | Admin; 401 unauthorized, 404 missing |

Create/update JSON body:

```json
{
  "name": "Coding Club",
  "category": "Technology",
  "description": "A community for students to learn programming and build projects.",
  "meeting_details": "Friday, 3:00 PM",
  "contact_email": "coding@example.edu",
  "tags": ["coding", "projects"]
}
```

Allowed categories: `Technology`, `Arts & Culture`, `Social Impact`, `Sports`, `Academic`, `Entrepreneurship`, `Other`. `meeting_details` and `contact_email` can be empty; tags are optional. Names must be unique.

## Database

`database/schema.sql` creates `public.clubs`, validation constraints, indexes, an `updated_at` trigger, and enables RLS. Optional demo inserts are commented out. To add your own records, use the Admin form or Supabase Table Editor. Do not put real student personal information in demo data.

## Testing checklist

1. **Health:** open `/api/health`; expect HTTP 200 and `status: ok`.
2. **Database connection:** open `/api/clubs`; expect HTTP 200 with `{ "data": [] }` if no records exist, or a list of clubs.
3. **Create:** enter the valid admin token and a valid club; expect it in the directory and Supabase table.
4. **Validation:** try a one-character name or too-short description; expect a validation message and no row created.
5. **Authorization:** submit a write request without a token or with a wrong token; expect HTTP 401.
6. **Duplicate:** add the same club name twice; expect HTTP 409 and no duplicate row.
7. **Edit:** update a club; verify the changed fields and `updated_at` in Supabase.
8. **Delete:** delete a test club after confirmation; verify it is gone from the directory and table.
9. **Search/filter:** search a known club name/tag and select a category; expect only matching records.
10. **Empty state:** use a query with no match; expect a helpful empty-state message.
11. **Responsive layout:** inspect at desktop and mobile widths using browser developer tools.
12. **Health/config errors:** stop the server or temporarily use invalid Supabase credentials; expect an error message, not a stack trace.

Run syntax checks from `backend`:

```powershell
npm run check
```

These checks validate JavaScript syntax only; they do not verify your remote Supabase connection. A real database test requires your own project credentials and schema.

## Troubleshooting

- **`node` or `npm` not recognized:** reinstall Node.js LTS and restart VS Code so PATH updates.
- **Port already in use:** set `PORT=3001` in `.env` and open `http://localhost:3001`.
- **Database not configured:** confirm `backend/.env` exists and has the exact variable names; restart the server after edits.
- **Supabase permission or relation error:** run `database/schema.sql` in the correct Supabase project and check that `public.clubs` exists.
- **Admin token rejected:** make sure the token entered in the Admin dialog exactly matches `ADMIN_TOKEN` in `.env`, then restart the server if it changed.
- **No clubs visible:** an empty table is normal. Add a club through Admin or uncomment the sample inserts and run those statements.
- **Invalid JSON:** ensure the request body is valid JSON and the client sends `Content-Type: application/json`.
- **Changes do not appear:** refresh the page and check the browser Console and the server terminal.

## Git and GitHub

1. Create a new empty repository on GitHub. Do not add a README there if your local project already has one.
2. From the project root, run:

   ```bash
   git init
   git status
   git add .
   git status
   git commit -m "Build Campus Club Directory"
   git branch -M main
   git remote add origin YOUR_GITHUB_REPOSITORY_URL
   git push -u origin main
   ```

3. Replace `YOUR_GITHUB_REPOSITORY_URL` with the URL copied from your own GitHub repository.
4. Before `git add .`, confirm `backend/.env` and `node_modules/` are ignored and `.env.example` is included. `git status` must not list real secrets.
5. Open the GitHub repository in your browser and confirm the folders and README are visible.

A `.gitignore` does not remove secrets already committed. If you accidentally publish a key or token, rotate/revoke it immediately, then remove it from Git history as needed.

## Security notes

- Never commit `backend/.env`, service-role keys, database passwords, or admin tokens.
- The Supabase service-role key is used only by Node.js. It must never be added to browser JavaScript.
- Public read endpoints expose the club directory. Write endpoints require the admin token and server-side validation.
- The frontend escapes values before inserting them into HTML. Do not remove this protection.
- For deployment, use HTTPS, a secure secret manager, stricter rate limits, and a proper identity-based admin login. The shared-token admin design is intended for a classroom MVP, not a high-risk production service.

## Possible future improvements

- Supabase Auth with named administrator accounts
- Club membership requests and event listings
- Club images and campus map links
- Pagination and more advanced search
- Audit history for admin changes

## License

Educational student project. Add a license if you plan to distribute or reuse it publicly.
