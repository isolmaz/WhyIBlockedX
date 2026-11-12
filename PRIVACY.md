# Privacy Policy

_Last updated: 12 November 2026_

WhyIBlockedX does not collect, transmit, sell or share any personal data.

## What is stored

When you block or mute an account on x.com, the extension saves a record in your browser's local extension storage (`chrome.storage.local`):

- the account's username and display name, and your own active username,
- the action (block or mute) and its date,
- the visible text and link of the related post, if the action started from a post,
- the reason you write.

**Bulk block** on a post's reposts or likes page creates the same kind of record for each account it blocks: username, display name if X returns it, the block action, the post link and an empty reason. No reason is invented. The reposter or liker list and the requests made on x.com are not stored.

For the fast bulk path, the extension copies X's own list/block request template and its authorization headers into memory when x.com loads a reposts or likes list or you block an account, keeps it until you navigate to another page, and sends those requests only back to x.com. They are never written to extension storage, logs, analytics or any other server.

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
