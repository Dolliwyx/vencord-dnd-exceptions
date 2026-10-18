# DndExceptions for Vencord

Receive selected message notifications while your Discord status stays on Do Not Disturb. Configure comma-separated user IDs and server IDs with a whitelist or blacklist.

This custom plugin targets the official Discord desktop app. You must build Vencord from source. You cannot install it by dropping a file into the standard Vencord installer.

**Verification status:** The desktop build, TypeScript check, ESLint check, and six automated tests pass. Live popup delivery, sound playback, and settings persistence still need a test in Discord. Do not rely on this plugin for urgent messages until you test your setup.

## Install the plugin

Custom client modifications carry account risk and violate Discord's terms. This plugin is not an official Discord or Vencord plugin.

1. Install Git, Node.js, and pnpm. Use the versions required by your Vencord checkout. The checkout used to develop this plugin requires Node.js 22 or newer and specifies pnpm 11.9.0.
2. If you do not have a Vencord source checkout, clone it:

   ```sh
   git clone https://github.com/Vendicated/Vencord.git
   cd Vencord
   ```

   If you already build Vencord from source, open a terminal in that checkout instead.

3. From the Vencord root, clone this plugin into the exact directory below:

   ```sh
   git clone https://github.com/Dolliwyx/vencord-dnd-exceptions.git src/userplugins/dndExceptions.discordDesktop
   ```

   Confirm that `src/userplugins/dndExceptions.discordDesktop/index.ts` exists. Do not add another nested directory. The `.discordDesktop` suffix limits the plugin to official desktop builds.

4. Install Vencord's dependencies and build the desktop client:

   ```sh
   pnpm install --frozen-lockfile
   pnpm build
   ```

5. Install your custom build:

   ```sh
   pnpm inject
   ```

   In the installer, select your Discord installation and apply the patch.

6. Fully quit Discord, including its tray process, and reopen it.
7. Open **User Settings > Vencord > Plugins**. Find **DndExceptions** and enable it.
8. Restart Discord when prompted. Open the plugin's settings to configure the lists.

For platform-specific setup, use Vencord's [installation from source guide](https://docs.vencord.dev/installing/) and [custom plugin guide](https://docs.vencord.dev/installing/custom-plugins/).

## Configure your exceptions

1. Open **User Settings > Advanced** and enable **Developer Mode**.
2. Right-click a person and select **Copy User ID**. For a server, select **Copy Server ID** from its context menu.
3. Open **DndExceptions** settings.
4. Paste user IDs into **User IDs** and server IDs into **Server IDs**. Separate multiple IDs with commas:

   ```text
   123456789012345678, 234567890123456789
   ```

   Replace these example IDs with real IDs. The plugin accepts surrounding spaces and duplicate IDs. Invalid IDs show an error.

5. Select **Whitelist** or **Blacklist** and save the settings.

Whitelist allows a message through DND when either its author or its server is listed. Empty lists allow nothing through DND.

**Blacklist allows everyone through DND except listed users or servers. Empty blacklist lists allow everyone's otherwise-eligible message notifications.** A listed user stays excluded even in an unlisted server.

A user exception applies in DMs, group DMs, and servers. The plugin bypasses only Discord's DND check. Mute rules, mention-only rules, blocked users, silent messages, streamer mode, and disabled sounds still affect delivery.

See [settings and limits](docs/reference.md) for the full behavior.

## Test your setup

1. Select **Whitelist** and add a trusted person's user ID.
2. Set your Discord status to **Do Not Disturb**.
3. Move focus to another application and ask that person to send a normal DM.
4. Confirm that you receive one normal desktop notification. Check the sound if you have message sounds enabled.
5. Ask an unlisted person to send a DM. Confirm that DND still suppresses that notification.
6. Remove the exception and save. Confirm that DND suppresses that person's next DM.

If these checks fail, keep using your normal notification setup and follow the troubleshooting steps below.

## Update the plugin

From the Vencord root, run:

```sh
git -C src/userplugins/dndExceptions.discordDesktop pull --ff-only
pnpm build
```

Fully quit and reopen Discord. If your Discord installation no longer loads the custom build, run `pnpm inject` again.

If you also update Vencord, run `pnpm install --frozen-lockfile` before the build. Avoid the normal prebuilt Vencord updater for this setup. A prebuilt bundle does not include custom plugins.

## Disable the plugin

Turn off **DndExceptions** in the Plugins tab and restart Discord. Source patches remain active until restart.

To remove its source, first disable the plugin and restart. Then move `src/userplugins/dndExceptions.discordDesktop` out of the Vencord checkout and rebuild.

## Troubleshoot notifications

- If the plugin is missing, check the clone directory and confirm that you built and injected the same Vencord checkout. Fully quit Discord before reopening it.
- If notifications stay silent, check the user and server IDs, the list mode, mute rules, sound settings, and your operating system's notification permissions.
- If Discord has focus, compare delivery with Discord's normal focused-window behavior. This plugin does not force popups for a conversation you are reading.
- If the console reports a `DndExceptions` patch failure, disable the plugin and restart. Discord may have changed its notification code. Rebuilding alone does not repair an outdated patch.
- If you use operating-system Do Not Disturb or Focus mode, disable that mode for the test. This plugin cannot override it.

## Work on the plugin

Use the installation steps above to create a development checkout. This repository depends on Vencord's build system and TypeScript aliases. It is not a standalone npm package.

1. From the Vencord root, run the plugin's dependency-free tests with Node.js 22.18 or newer:

   ```sh
   node --test src/userplugins/dndExceptions.discordDesktop/checks.mjs
   ```

   If your terminal is in this plugin repository, run `node --test checks.mjs` instead.

2. From the Vencord root, check the changed files and types:

   ```sh
   pnpm exec eslint src/userplugins/dndExceptions.discordDesktop/index.ts src/userplugins/dndExceptions.discordDesktop/logic.ts src/userplugins/dndExceptions.discordDesktop/checks.mjs
   pnpm testTsc
   pnpm build
   ```

3. After code changes, rebuild and restart Discord. For automatic rebuilds, run `pnpm watch` from the Vencord root. A rebuild does not apply source patches to an already-running Discord session.
4. Run the [manual verification checklist](docs/reference.md#manual-verification-checklist) before claiming that delivery works.

Commit plugin changes from `src/userplugins/dndExceptions.discordDesktop`, not from the Vencord root. Vencord ignores `src/userplugins`, so the nested clone keeps the plugin in its own repository.

See the [file map and patch reference](docs/reference.md#developer-reference) before changing the matcher. Do not copy this build's numeric Discord module IDs into the plugin.

## License

[GPL-3.0-or-later](LICENSE), consistent with Vencord. Keep the source-file copyright and license notices when you redistribute the plugin.
