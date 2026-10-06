# Privacy Policy

_Last updated: 6 October 2026_

WhyIBlockedX does not collect, transmit, sell or share any personal data.

## What is stored

When you block or mute an account on x.com, the extension saves a record in your browser's local extension storage (`chrome.storage.local`):

- the account's username and display name, and your own active username,
- the action (block or mute) and its date,
- the visible text and link of the related post, if the action started from a post,
- the reason you write.

It also stores your settings and unsaved note drafts. Nothing else is stored.

## What is not collected

- No data leaves your browser. There are no servers, accounts, sync, analytics, ads or remote code.
- To confirm that a block or mute succeeded, the extension reads only the response of that request on x.com. Passwords, cookies, tokens and request headers are never read into storage or sent anywhere.

## Your control

- **Backup → Download backup** exports your records as a JSON file to a place you choose.
- **Backup → Delete all records** erases them. Removing the extension also deletes all stored data.

## Permissions

- `storage` — to keep your records and settings on your device.
- Content scripts on `x.com` and `twitter.com` — to show your notes on profiles and detect block/mute actions.

## Contact

Questions: open an issue at <https://github.com/isolmaz/WhyIBlockedX/issues>.
