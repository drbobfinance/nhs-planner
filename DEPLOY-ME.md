# Getting NHS Finance Tool live — step by step

This site is plain HTML, CSS and JavaScript — no build step, no npm, nothing to install. That means the GitHub → Cloudflare Pages process is the simple version, same as cookiefree.co.uk.

## 1. Put the files on GitHub

1. Go to github.com and create a new repository — call it `nhsfinancetool` (or anything you like), set it to **Private** if you'd rather nobody browsed the code, though it doesn't matter either way since it's just a static site.
2. Upload every file and folder in this project to that repository, keeping the same folder structure (the `take-home-pay-calculator`, `pension-annual-allowance-calculator` etc. folders need to stay exactly as they are — the folder name IS the web address).
3. The easiest way if you're not comfortable with git commands: use GitHub's web uploader (drag and drop the whole folder onto the "Add file → Upload files" screen), or ask me and I'll talk you through GitHub Desktop.

## 2. Connect Cloudflare Pages

1. In your Cloudflare dashboard, go to **Workers & Pages → Create → Pages → Connect to Git**.
2. Pick the `nhsfinancetool` repository you just created.
3. Build settings: leave **Build command** blank, and set **Build output directory** to `/` (just a forward slash — because there's no build step, the files are already ready to serve as-is).
4. Click **Save and Deploy**. Cloudflare will give you a temporary `.pages.dev` address — open it in an **incognito window** and click through every page to check everything works before connecting your real domain.

## 3. Connect nhsfinancetool.co.uk

1. In the Pages project, go to **Custom domains → Set up a custom domain**.
2. Add `nhsfinancetool.co.uk` and `www.nhsfinancetool.co.uk`.
3. If your domain's DNS is already on Cloudflare, this is close to automatic. If it's registered elsewhere, Cloudflare will show you a CNAME record to add at your registrar.
4. Do the same for `nhsfinancetool.com` once you decide what to do with it (see note below).

## What to do with nhsfinancetool.com

You don't need to build a second copy of the site. The simple approach: point `nhsfinancetool.com` at the same Cloudflare Pages project as an additional custom domain, then set up a redirect so `.com` visitors land on `.co.uk` (Cloudflare Pages supports this via a `_redirects` file — say the word and I'll add one). This avoids Google seeing two identical sites at two different addresses, which can dilute rather than help you.

## Testing checklist before you go live

- [ ] Open the `.pages.dev` link in **incognito** and check all three calculators produce sensible numbers
- [ ] Click through to the Privacy/Disclaimer page and back
- [ ] Check the disclaimer splash screen and cookie notice appear on first visit, and don't reappear after accepting
- [ ] Try it on your phone — the layout should adjust automatically
- [ ] After connecting the domain, purge the Cloudflare cache (Caching → Configuration → Purge Everything) so you're not looking at a stale cached version

## What's already handled

- Every calculator page has its own indexable URL, title and meta description (the SEO fix we talked about)
- `sitemap.xml` and `robots.txt` are included and pre-filled with the nhsfinancetool.co.uk URLs
- The disclaimer is shown before anyone can use a calculator, and repeated at the bottom of every tool
- No cookies, no tracking, no data leaves the browser — matches what the disclaimer promises

## What's NOT set up yet (by your choice, for now)

- No payment/paywall — everything is free, as agreed
- No Google Search Console verification tag yet — once the site is live, let me know and I'll talk you through adding one (same as we did for cookiefree and uk-debt.info)
- No affiliate links yet — cookiefree's pages show what these look like when you're ready to add them here too
