# Settings and limits

## Settings

| Setting | Default | Behavior |
| --- | --- | --- |
| List mode | Whitelist | Whitelist permits either list match. Blacklist excludes either list match. |
| User IDs | Empty | Comma-separated author IDs. User matching applies in DMs, group DMs, and servers. |
| Server IDs | Empty | Comma-separated server IDs, matched against the message channel's `guild_id`. |

IDs remain strings, so parsing does not lose numeric precision. Entries must contain 17 to 20 decimal digits. Surrounding spaces and empty entries are ignored. Duplicate entries do not change matching. Validation checks the format, not whether an ID exists.

Both lists use the same list mode. A whitelist match on either list permits the DND exception. A blacklist match on either list prevents the exception.

| Author listed | Server listed | Whitelist bypasses DND | Blacklist bypasses DND |
| --- | --- | --- | --- |
| No | No | No | Yes |
| Yes | No | Yes | No |
| No | Yes | Yes | No |
| Yes | Yes | Yes | No |

DMs have no server match. Empty whitelist lists bypass nothing. Empty blacklist lists bypass DND for every otherwise-eligible message. Missing channels, missing authors, or invalid stored lists do not bypass DND.

Vencord persists the settings through its normal plugin settings mechanism. The plugin adds no network requests and stores no message history. The lists are not a separate Discord account setting, and the plugin does not update your visible status.

## Unchanged behavior

The plugin changes the desktop message eligibility call, not the complete notification system. Discord still controls these checks:

- Channel and server notification rules, including mention-only rules and mute rules.
- Blocked users, ignored users, message requests, and messages sent with notification suppression.
- Streamer mode, restricted hours, required account actions, and other notification restrictions.
- Focus and selected-channel behavior.
- Desktop notification preferences and message sound preferences.
- Notification formatting, click actions, and cleanup.

The plugin does not change calls, reaction notifications, forum-post creation alerts, game-overlay notifications, or mobile notifications. It targets official Discord desktop builds, not Vesktop or browser builds. It does not override operating-system DND, Focus mode, or notification permissions.

## Developer reference

| File | Responsibility |
| --- | --- |
| `index.ts` | Vencord settings, ID validation hooks, the desktop source patch, and channel lookup. |
| `logic.ts` | ID parsing and whitelist or blacklist matching without Discord dependencies. |
| `checks.mjs` | Node tests for validation, matching, and the actual patch expression in `index.ts`. |
| `README.md` | Installation, configuration, updates, troubleshooting, and development commands. |
| `LICENSE` | GPL version 3 license text. Source notices allow version 3 or later. |

### Patch boundary

The patch identifies the module by the string `"NotificationStore"`. It matches the three-argument message predicate call immediately before `getNotifyMessagesInSelectedChannel()`.

The replacement adds the existing fourth argument, `ignoreStatus`, based on `shouldBypass(message, channelId)`. That helper resolves the channel, reads the saved settings, and calls `shouldBypassDnd`.

In the inspected Discord source, `ignoreStatus` skips only the DND clause. The patch does not change the shared predicate, global status getters, or the generic notification suppression function. Other callers retain their original behavior.

The fixture in `checks.mjs` contains the call and adjacent expression from the inspected desktop client. The tests read the matcher and replacement from `index.ts`, expand Vencord's `\i` identifier token, and execute the patched expression with stubbed dependencies. The checks verify argument preservation and a single match on that fixture. They do not prove compatibility with a newer Discord bundle or downstream native notification delivery.

### Verification status

The initial implementation passes these checks on Node.js 24:

- All six tests in `checks.mjs`.
- ESLint for `index.ts`, `logic.ts`, and `checks.mjs`.
- Vencord's `tsc --noEmit` check.
- Vencord's desktop build, with `DndExceptions` present in the renderer bundle.

Live Discord delivery and saved-setting persistence remain unverified. No custom build was injected into Discord during development.

### Manual verification checklist

- In DND with Discord unfocused, a whitelisted author produces one normal notification in an unmuted DM.
- A whitelisted author also qualifies in a group DM and in an otherwise-eligible server channel.
- An unlisted author qualifies in a whitelisted server when Discord's notification rules permit the message.
- An unlisted author in an unlisted server stays suppressed during DND in whitelist mode.
- In blacklist mode, either list match prevents the exception. Check both conflict cases separately.
- Empty lists have the documented behavior in each mode.
- Invalid IDs show an error and do not become active settings.
- Muted conversations, mentions-only rules, blocked users, silent messages, streamer mode, and disabled sounds retain their normal behavior.
- Focused-window and selected-channel behavior match stock Discord.
- Non-DND delivery does not change, and no duplicate popup or sound occurs.
- Settings survive a full Discord restart.
- Disabling the plugin and restarting restores stock DND behavior.

### Discord updates

A changed Discord bundle can invalidate the matcher or change the meaning of `ignoreStatus`. A successful build does not detect either change.

After an update, inspect the current desktop message handler and shared predicate before changing the patch. Update the fixture from the inspected source and rerun automated and manual checks. Preserve the message-specific patch boundary. A patch warning requires investigation, not a broader replacement of every DND check.
