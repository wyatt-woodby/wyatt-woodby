# Wyatt Woodby site — operating & handoff guide

Plain-language guide for running this site. The model: **you own the
infrastructure (GitHub + Vercel), she edits the content.** She never needs a
Vercel account or to own the repo.

---

## How the site is built (30-second version)

- It's a **Next.js app**, not hand-edited HTML. It has to be *built* to go live —
  that's what Vercel does automatically.
- **Content** (which videos/images show, and in what order) lives as small data
  files in the repo under `content/`. You never edit these by hand — the
  **Keystatic cockpit** at `/keystatic` does it for you.
- **Videos** are Vimeo embeds — just a link, no file. **Images (stills)** are real
  files committed into the repo under `public/media/`.
- Every time content is saved in the cockpit, it **commits to GitHub**, which
  **triggers a Vercel rebuild**. The site updates itself a minute or two later.

---

## One-time setup (you do this once)

### 1. Put the repo on your GitHub + deploy to your Vercel
1. Push this branch and merge to `master` (or set Vercel to deploy this branch).
2. In Vercel, **Import Project** from your GitHub repo. Framework preset: Next.js.
3. Add your domain in Vercel → Settings → Domains, and point the domain's DNS as
   Vercel instructs.

### 2. Turn on the Keystatic GitHub login (the cockpit)
1. In Vercel → Settings → Environment Variables, add:
   `KEYSTATIC_REPO = your-username/your-repo-name`
2. Redeploy, then visit `https://your-site.com/keystatic/setup`.
3. It **walks you through creating a GitHub App** and hands you 4 values:
   `KEYSTATIC_GITHUB_CLIENT_ID`, `KEYSTATIC_GITHUB_CLIENT_SECRET`,
   `KEYSTATIC_SECRET`, `KEYSTATIC_GITHUB_APP_SLUG`.
4. Paste those 4 into Vercel's Environment Variables and redeploy.
5. Now `/keystatic` asks people to log in with GitHub before editing.

### 3. Give her access
- GitHub repo → **Settings → Collaborators → Add** her GitHub username (write
  access). She accepts the email invite.
- Send her the link `https://your-site.com/keystatic`. She logs in with her own
  GitHub account and can edit everything. Done — she has full content control,
  you keep the keys to the infrastructure.

---

## How she adds content (send her this part)

Go to **your-site.com/keystatic** and log in with GitHub.

**Add a video**
1. Media → **Create**.
2. Give it a Title. (The "slug" fills in automatically — ignore it.)
3. Type = **Vimeo video**. Paste the Vimeo link or the whole embed code. Either
   works — it figures out the rest, including the shape (wide, tall, or square).
4. **Save.**

**Add a photo**
1. Media → **Create**. Title it. Type = **Image**. Upload the file. **Save.**

**Reorder the feed**
1. Open **Feed order**. Drag items into the order you want. **Save.**
   (New items must be added here to appear on the site.)

After any Save, the site updates itself in a minute or two.

---

## Getting the current site fully live

Right now the feed has: 1 real Vimeo clip, 3 photo slots, and 8 clips waiting for
Vimeo links (they show a grey "add media" placeholder until a link is added).

To finish:
1. **Photos:** drop the 3 real JPGs into `public/media/` with these names, commit:
   `photo_two_render.jpg`, `photo_1_render_crop.jpg`, `gagosian_render.jpg`.
   (Or re-upload them through the cockpit — either works now that images ship.)
2. **Videos:** paste each Vimeo link into its item in the cockpit as they come in.
   Any item still without a link just stays a placeholder — no broken embeds.

---

## Handy facts

- **Video playback:** clips autoplay muted and loop. Hovering shows a play button;
  clicking it unmutes with full controls.
- **"The repo looks empty on my computer":** the video files are intentionally
  *not* in git (they live on Vimeo). Only code + stills are tracked. That's normal.
- **Local editing for you:** run `npm run dev` and open `localhost:3000/keystatic`
  — in dev it writes straight to files on your disk, no GitHub login needed.
- **Moving everything to her accounts later** (if you ever want fully out): transfer
  the GitHub repo to her, she imports it into her own Vercel, and re-run
  `/keystatic/setup` under her account. Not needed for launch.
