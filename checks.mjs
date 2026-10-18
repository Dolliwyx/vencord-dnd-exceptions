/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";

import { parseIds, shouldBypassDnd, validateIds } from "./logic.ts";

const user = "123456789012345678";
const server = "234567890123456789";
const stranger = "345678901234567890";

// Read the plugin's actual patch so these checks also catch edits to its matcher or replacement.
const source = readFileSync(new URL("./index.ts", import.meta.url), "utf8");
const matchLiteral = source.match(/match: (\/.*\/),/)[1];
const matcher = runInNewContext(matchLiteral);
const canonicalMatcher = new RegExp(matcher.source.replaceAll("\\i", "(?:[A-Za-z_$][\\w$]*)"));
const replacement = JSON.parse(source.match(/replace: (".*")/)[1]);

// Exact eligibility call and adjacent expression from the inspected desktop NotificationStore.
const fixture = "let I=(0,O.lx)(a,l,!ts),g=W.A.getNotifyMessagesInSelectedChannel()&&(0,O.kY)(a,l)";

test("comma-separated IDs preserve precision and ignore spaces, blanks, and duplicates", () => {
    assert.deepEqual(parseIds(` ${user}, ${server}, ${user}, `), [user, server, user]);
    assert.deepEqual(parseIds(" , "), []);
    assert.deepEqual(parseIds("12345678901234567890"), ["12345678901234567890"]);
    for (const value of ["abc", "123", `${user},oops`, "123456789012345678901", "1.2345678901234567e17"]) {
        assert.equal(parseIds(value), null);
        assert.equal(typeof validateIds(value), "string");
    }
    assert.equal(validateIds(` ${user}, ${user}`), true);
});

test("whitelist matches users or servers, including user exceptions in DMs", () => {
    assert.equal(shouldBypassDnd(user, "", "whitelist", user), true);
    assert.equal(shouldBypassDnd(user, "", "whitelist", user, stranger), true);
    assert.equal(shouldBypassDnd("", server, "whitelist", stranger, server), true);
    assert.equal(shouldBypassDnd(user, server, "whitelist", stranger, stranger), false);
    assert.equal(shouldBypassDnd("", "", "whitelist", user, server), false);
    assert.equal(shouldBypassDnd("", server, "whitelist", stranger), false);
});

test("blacklist excludes either match and empty lists allow everyone", () => {
    assert.equal(shouldBypassDnd(user, server, "blacklist", user, stranger), false);
    assert.equal(shouldBypassDnd(user, server, "blacklist", stranger, server), false);
    assert.equal(shouldBypassDnd(user, server, "blacklist", user, server), false);
    assert.equal(shouldBypassDnd(user, server, "blacklist", stranger, stranger), true);
    assert.equal(shouldBypassDnd(user, server, "blacklist", stranger), true);
    assert.equal(shouldBypassDnd("", "", "blacklist", user, server), true);
});

test("invalid stored settings and missing authors never bypass DND", () => {
    for (const mode of ["whitelist", "blacklist"]) {
        assert.equal(shouldBypassDnd("bad", server, mode, user, server), false);
        assert.equal(shouldBypassDnd(user, "bad", mode, user, server), false);
        assert.equal(shouldBypassDnd(user, server, mode, undefined, server), false);
    }
    assert.equal(shouldBypassDnd("", "", "unknown", user, server), false);
});

test("patch matches once and preserves message, channel, focus, and selected-channel arguments", () => {
    assert.equal(Array.from(fixture.matchAll(new RegExp(canonicalMatcher.source, "g"))).length, 1);
    const patched = fixture.replace(canonicalMatcher, replacement.replaceAll("$self", "plugin"));
    const handler = runInNewContext(`(function(a,l,ts,O,W,plugin){${patched};return g;})`);
    const message = { author: { id: user } };
    for (const focused of [true, false]) {
        for (const allowed of [true, false]) {
            const calls = [];
            const O = {
                lx(...args) { calls.push(args); return true; },
                kY(...args) { calls.push(args); return "selected-channel-result"; }
            };
            const W = { A: { getNotifyMessagesInSelectedChannel: () => true } };
            const plugin = { shouldBypass(m, c) {
                assert.equal(m, message);
                assert.equal(c, server);
                return allowed;
            } };
            assert.equal(handler(message, server, focused, O, W, plugin), "selected-channel-result");
            assert.deepEqual(calls, [[message, server, !focused, allowed], [message, server]]);
        }
    }
});

test("patch does not target overlay calls or unrelated DND checks", () => {
    for (const code of [
        "if(!(0,y.lx)(i,e))return!1;",
        "if(!(0,y.lx)(i,e,!0,!0))return!1;",
        "return x.A.getStatus()===tt.clD.DND;"
    ]) assert.equal(canonicalMatcher.test(code), false);
    assert.equal(source.includes('find: \'"NotificationStore"\''), true);
});
