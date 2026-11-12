<p align="center">
  <img src="icons/128.png" width="88" height="88" alt="WhyIBlockedX">
</p>

<h1 align="center">WhyIBlockedX</h1>

<p align="center">
  <strong>Remember why you blocked or muted someone on X.</strong><br>
  Saves your reason and the related post, and shows them on the profile next time you visit.
</p>

<p align="center">
  <img alt="Version" src="https://img.shields.io/badge/version-0.6.0-1d9bf0?style=flat-square">
  <img alt="Manifest V3" src="https://img.shields.io/badge/manifest-v3-4a4a4a?style=flat-square">
  <img alt="Chrome and Edge 127+" src="https://img.shields.io/badge/chrome%20%7C%20edge-127%2B-4a4a4a?style=flat-square">
  <img alt="Local only" src="https://img.shields.io/badge/data-local%20only-00ba7c?style=flat-square">
  <a href="https://github.com/isolmaz/WhyIBlockedX/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/isolmaz/WhyIBlockedX/actions/workflows/ci.yml/badge.svg?branch=main"></a>
  <a href="LICENSE"><img alt="MIT License" src="https://img.shields.io/badge/license-MIT-4a4a4a?style=flat-square"></a>
</p>

---

## How it works

### 1. Block in one click, write the reason in place

Use **Engelle** (Block) next to the profile's menu. X's confirmation is handled for you, and a panel opens under the profile. Write your reason and press **Ctrl+Enter**.

<p align="center"><img src="docs/media/block.gif" width="720" alt="Blocking from a profile and adding a reason"></p>

### 2. Block from a post — the post is saved too

Block or mute from a post's **⋯** menu and the post's text and link are kept as context.

<p align="center"><img src="docs/media/post-menu.gif" width="720" alt="Blocking from a post menu saves the post"></p>

### 3. Everything in one popup

Search and filter your records, edit reasons, change settings and back up your data.

<p align="center"><img src="docs/media/popup.gif" width="380" alt="Records, settings and backup in the popup"></p>

> The recordings use a simulated X page with the real extension loaded.

### 4. Block everyone who liked a post

Open the popup, choose **Bulk block**, paste a post link and press **Open likes page**. On the likes page a compact **Block likers** panel loads the full liker list through X's own session, shows the exact count and asks for confirmation. It then blocks them in parallel through X's own block request, so a large list does not wait on one-by-one UI clicks. If the full list cannot be loaded, the panel shows and confirms only the accounts visible on the page. If the fast path is unavailable, it falls back to the one-by-one UI and blocks only visible accounts from the set you confirmed.

**Stop** stops scheduling new blocks; requests already in flight may finish. Your own account is always skipped. The one-by-one UI also skips accounts that already show an unblock control; the fast path may send a block request for an account you already block, but no duplicate record is created. Each blocked account gets a normal record with the post link and an empty note. X's rate limits or interface changes can pause the run.

## Features

- **Reasons on profiles** — your note and the related post appear under the profile and in hover cards.
- **One-click actions** — block, mute and undo from profiles, hover cards, post menus and account lists.
- **Bulk blocking** — load the exact liker count, confirm once, then block in parallel with a one-by-one fallback; stop whenever you want.
- **History kept** — unblocking marks a record as ended instead of deleting it; reuse an earlier reason in one click.
- **Drafts** — unfinished notes survive reloads and browser restarts.
- **Native look** — follows X's theme, accent colour and font.
- **Backup** — export and import JSON.

## Privacy

Everything stays in your browser's local storage. No servers, accounts, sync or analytics; the only permission is `storage`. See the [privacy policy](PRIVACY.md).

> [!WARNING]
> Removing the extension deletes your records. Download a backup first: **Backup → Download backup**.

## Install

**Chrome Web Store:** [WhyIBlockedX](https://chromewebstore.google.com/detail/enmdpnmbnmmlnfchlbolggldjnmbappb), then reload open X tabs. Store installs update automatically.

**From source:**

1. `git clone https://github.com/isolmaz/WhyIBlockedX.git`
2. Open `chrome://extensions` (or `edge://extensions`) and turn on **Developer mode**.
3. **Load unpacked** → select the cloned folder, then reload open X tabs.

To update, run `git pull` and click **Reload** on the extensions page; your records are kept.

The store and source installs keep separate records. To move from one to the other, use **Backup → Download backup** in the old one and **Restore from backup** in the new one.

## Notes

- Interface in English and Turkish. It follows the browser language; change it in **Settings → Appearance → Language**. Works with X in either language.
- Desktop web only. If X changes its interface some detection may stop working; unrecognised confirmations are never auto-approved.
- Accounts are matched by username, so handle changes are not tracked.

## Project

```
manifest.json     Extension manifest (root)
src/background.js Service worker; serialises storage writes
src/shared.js     Defaults, themes, URL validation
src/i18n.js       English and Turkish interface strings
_locales/         Localized extension description (en, tr)
src/content/      Scripts injected into X
src/popup/        Records, settings and backup UI
docs/             User guide and release process (Turkish), README media
```

No build step, no dependencies. [Changelog](CHANGELOG.md) · [Guide](docs/KURULUM.md)

## Checks

CI ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs on every pull request and, through [`release.yml`](.github/workflows/release.yml), on every push to `main`. It needs Node.js and runs three checks; run the same ones locally from the repository root:

```
find src -name '*.js' -print0 | xargs -0 -n1 node --check   # JS syntax
node .github/ci/check-manifest.js                      # manifest references and locale JSON
node --test tests/*.test.mjs                           # URL helpers, i18n parity, markup and bulk-block flow
```

There are no browser end-to-end tests in CI.

**Releases:** a version bump on `main` is sent to the Chrome Web Store only after it is approved in GitHub Actions. See [docs/YAYINLAMA.md](docs/YAYINLAMA.md) (Turkish).

## License

[MIT](LICENSE). Not affiliated with X Corp.
