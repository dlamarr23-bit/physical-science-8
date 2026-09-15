# Physical Science 8 — Online Textbook

A self-contained, static website: 6 units, 21 chapters, interactive chapter-review
quizzes, flip-card vocabulary, embedded videos, linked simulations and articles,
and a full glossary. Built with plain HTML/CSS/JS (Poppins font, Chart.js for
graphs) — no build step, no server, no database required.

## Deploying to Cloudflare Pages

**Option A — Drag and drop (easiest, no account setup beyond Cloudflare login):**

1. Log in to the Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Upload assets**.
2. Give the project a name (e.g. `physical-science-8`).
3. Drag this entire folder's *contents* (`index.html`, `glossary.html`, every
   `u#*.html` file, and the `assets` folder) into the upload area — not the
   folder itself, its contents.
4. Click **Deploy site**. Cloudflare will give you a `*.pages.dev` URL in
   under a minute.
5. To use your own domain, go to the project's **Custom domains** tab and
   follow the prompts.

**Option B — Wrangler CLI (good if you'll update it often):**

```bash
npm install -g wrangler
cd this-folder
wrangler pages deploy . --project-name=physical-science-8
```

Run the same command again any time you edit the site to publish an update.

**Option C — Connect a Git repository (best if you'll keep editing this):**
See "Putting this on GitHub" below, then in Cloudflare Pages choose
**Connect to Git** instead of **Upload assets**, pick the repo, leave the
build command blank, and set the output directory to `/` (the project
root) since this is a plain static site with no build step. After that,
every time you push a change to GitHub, Cloudflare redeploys automatically
within a minute or two — no manual re-upload, ever.

## Putting this on GitHub

You don't need to know git commands for this — GitHub's website can do it
for you.

**1. Create a free GitHub account** at github.com if you don't have one.

**2. Create a new repository:**
   - Click the **+** in the top-right corner → **New repository**.
   - Name it something like `physical-science-8`.
   - Leave it **Public** or **Private** (either works with Cloudflare Pages)
     and do **not** check "Add a README" (this project already has one).
   - Click **Create repository**.

**3. Upload the files:**
   - Unzip this download on your computer first.
   - On the new repository's page, click **uploading an existing file**.
   - Drag in everything *inside* the unzipped folder — `index.html`,
     `glossary.html`, every `u#*.html` file, the `assets` folder, and
     `README.md` — not the folder itself.
   - Scroll down and click **Commit changes**.

**4. Connect it to Cloudflare Pages** (see Option C above) so it deploys
   automatically from now on.

**5. Making future edits:** open any file on GitHub (click it, then the
   pencil ✏️ icon), make your change, and click **Commit changes** at the
   bottom. Cloudflare will pick up that commit and redeploy the live site
   within a minute or two — no separate deploy step needed.

**If you're comfortable with a terminal instead**, this is the equivalent
git-command version of steps 2–3:

```bash
cd path/to/unzipped-folder
git init
git add .
git commit -m "Initial commit of Physical Science 8 textbook"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/physical-science-8.git
git push -u origin main
```

(Create the empty repository on GitHub first, exactly as in step 2 above,
copy its URL for the `git remote add` line, then run these from inside the
unzipped folder.) After that, any future edit is just:

```bash
git add .
git commit -m "describe what you changed"
git push
```

## Editing content later

- Page text lives directly in each chapter's `.html` file — open it in any
  text editor and edit the paragraph text, vocabulary terms, or quiz
  questions/answers directly (each quiz's data is a small JSON block near
  the bottom of the file, inside a `<script type="application/json">` tag).
- Shared look-and-feel lives in `assets/style.css`.
- Shared behavior (quiz grading, the mobile menu, vocabulary flip cards)
  lives in `assets/app.js`.
- Chapter icons live in `assets/icons.js`.
- If you'd rather regenerate the whole site from structured data instead of
  hand-editing HTML, ask Claude for the original `unit1.json`–`unit6.json`
  content files and the `build.py` generator script that produced this site.

## What's inside

- `index.html` — home page / unit overview
- `u1.html` … `u6.html` — one landing page per unit
- `u1-t1.html` … `u6-t4.html` — the 21 chapter pages
- `glossary.html` — every vocabulary term from every chapter, searchable
- `assets/` — shared stylesheet, scripts, icon library, and favicon

Every chapter page includes: a "big question" hook, several sections of
kid-friendly explanation (with a data graph in select chapters), a
click-to-flip vocabulary set, an embedded YouTube video, a linked PhET (or
similar) simulation, a linked article, and a 5-question self-grading review
with instant feedback. Student quiz scores and "visited" checkmarks are
saved locally in each student's own browser (`localStorage`) — nothing is
sent to a server, and no login is required.
