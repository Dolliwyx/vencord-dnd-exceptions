/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export function parseIds(value: string): string[] | null {
    const ids = value.split(",").map(id => id.trim()).filter(Boolean);
    return ids.every(id => /^\d{17,20}$/.test(id)) ? ids : null;
}

export function validateIds(value: string): boolean | string {
    return parseIds(value) !== null || "Enter Discord IDs (17–20 digits), separated by commas.";
}

export function shouldBypassDnd(
    userIds: string,
    serverIds: string,
    mode: "whitelist" | "blacklist",
    authorId?: string,
    guildId?: string,
    allDms = false
): boolean {
    const users = parseIds(userIds);
    const servers = parseIds(serverIds);
    if (!authorId || users === null || servers === null) return false;

    const listed = users.includes(authorId) || (guildId != null && servers.includes(guildId)) || (allDms && guildId == null);
    return mode === "whitelist" ? listed : mode === "blacklist" && !listed;
}
