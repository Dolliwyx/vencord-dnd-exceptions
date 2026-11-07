/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import definePlugin, { OptionType } from "@utils/types";
import { ChannelStore } from "@webpack/common";

import { shouldBypassDnd, validateIds } from "./logic";

const settings = definePluginSettings({
    listMode: {
        type: OptionType.SELECT,
        description: "Whitelist allows listed users OR servers through DND. Blacklist allows everyone EXCEPT listed users or servers; empty lists allow everyone.",
        options: [
            { label: "Whitelist", value: "whitelist" as const, default: true },
            { label: "Blacklist", value: "blacklist" as const }
        ]
    },
    userIds: {
        type: OptionType.STRING,
        description: "Comma-separated user IDs. Applies to their messages in DMs, group DMs, and servers.",
        default: "",
        isValid: validateIds
    },
    allDms: {
        type: OptionType.BOOLEAN,
        description: "Treat every DM and group DM as listed (an exception in whitelist mode, excluded in blacklist mode).",
        default: false
    },
    serverIds: {
        type: OptionType.STRING,
        description: "Comma-separated server IDs. Only DND is bypassed; mute, mention-only, and sound settings still apply.",
        default: "",
        isValid: validateIds
    }
});

export default definePlugin({
    name: "DndExceptions",
    description: "Allow selected message notifications through Do Not Disturb without changing your status.",
    authors: [{ name: "Local", id: 0n }],
    tags: ["Notifications"],
    settings,

    patches: [{
        find: '"NotificationStore"',
        replacement: {
            // Only change desktop message eligibility, not the shared predicate or other notification types.
            match: /(let \i=\(0,\i\.\i\)\((\i),(\i),!\i)(\))(?=,\i=\i\.\i\.getNotifyMessagesInSelectedChannel\(\))/,
            replace: "$1,$self.shouldBypass($2,$3)$4"
        }
    }],

    shouldBypass(message: { author?: { id?: string; }; }, channelId: string) {
        const channel = ChannelStore.getChannel(channelId);
        if (!channel) return false;

        const { userIds, serverIds, listMode, allDms } = settings.store;
        return shouldBypassDnd(userIds, serverIds, listMode, message.author?.id, channel.guild_id, allDms);
    }
});
