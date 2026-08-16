# Wyatt Woodby site — operating & handoff guide

Plain-language guide for running this site. The model: **everything lives under
her GitHub + her Vercel; you (Sean) set it all up for her once.** Vercel's free
tier is single-user, so during setup you log in *as her* (she shares passwords
and changes them afterward — that's safe, see note below). After setup she owns
100% of it and edits content through the cockpit.

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

## One-time setup (you do this once, logged in as her)

**Before you start:** do this in one ~20-minute sitting while she's reachable by
text. If her GitHub/Vercel has two-factor auth, you'll need her to relay the
one-time codes. Check how she signs into Vercel first — if it's "Continue with
GitHub," then her GitHub password covers Vercel too (no separate password).

### 1. Repo on her GitHub + deploy to her Vercel
1. Log into **her GitHub**. Create a repo (e.g. `wyatt-woodby`). Push this code to it.
2. Log into **her Vercel** → **Import Project** from that repo. Framework preset:
   Next.js. Deploy.
3. Add her domain in Vercel → Settings → Domains and point its DNS as Vercel says.

### 2. Turn on the Keystatic GitHub login (the cockpit)
1. Vercel → Settings → Environment Variables, add:
   `KEYSTATIC_REPO = her-username/repo-name`
2. Redeploy, then visit `https://the-site.com/keystatic/setup`.
3. Since you're logged into GitHub **as her**, this creates the GitHub App **under
   her account** and hands you 4 values: `KEYSTATIC_GITHUB_CLIENT_ID`,
   `KEYSTATIC_GITHUB_CLIENT_SECRET`, `KEYSTATIC_SECRET`, `KEYSTATIC_GITHUB_APP_SLUG`.
4. Paste those 4 into Vercel's Environment Variables and redeploy.
5. Now `/keystatic` requires a GitHub login before editing.

### 3. Hand it back
- She **changes her GitHub + Vercel passwords.** This breaks nothing — the cockpit
  login runs off the GitHub App secrets stored in Vercel, not her password.
- Because the repo is hers, she just logs into `https://the-site.com/keystatic`
  with her own GitHub and has full content control. Done.
- If *you* want to keep helping edit later, she adds you as a repo collaborator
  (free on GitHub, anytime).

---

## How she adds content (send her this part)

Go to **the-site.com/keystatic** and log in with GitHub.

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
1. **Photos:** already added and committed (`gagosian_render.jpg`,
   `photo_1_render_crop.jpg`, `photo_two_render.jpg` in `public/media/`). The two
   iPhone HEICs were converted to JPG so browsers can show them.
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
- **Changing passwords after handoff is safe:** the cockpit login uses the GitHub
  App secrets stored in Vercel, not her account password.
