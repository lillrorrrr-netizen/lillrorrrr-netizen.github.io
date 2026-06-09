import { __values } from "tslib";
import { getGlobalScope } from '@amplitude/analytics-core';
/**
 * Persists the wall-clock time at which a session's replay first began capturing,
 * keyed by sessionId. The persisted value drives the `min_session_duration_ms` gate:
 * we measure elapsed *replay* time, not just current page-load time, so a session that
 * is paused and resumed (or that crosses a page navigation) is still gated correctly.
 *
 * All storage access is wrapped in try/catch — when localStorage is unavailable (Safari
 * private mode, quota exceeded, sandboxed iframe) callers fall back to `Date.now()` so
 * the gate degrades gracefully instead of throwing.
 */
var KEY_PREFIX = 'AMP_SR_START_';
var APIKEY_FINGERPRINT_LEN = 10;
/**
 * TTL beyond which a stored start time is treated as stale and pruned on next init.
 * 24 hours covers the longest realistic single-session duration in Amplitude (default
 * inactivity timeout is 30 minutes; some configs extend sessions across resumes).
 */
export var REPLAY_START_TIME_TTL_MS = 24 * 60 * 60 * 1000;
var buildKeyPrefix = function (apiKey) { return "".concat(KEY_PREFIX).concat(apiKey.substring(0, APIKEY_FINGERPRINT_LEN), "_"); };
var buildKey = function (apiKey, sessionId) { return "".concat(buildKeyPrefix(apiKey)).concat(sessionId); };
var getLocalStorage = function () {
    try {
        var scope = getGlobalScope();
        return scope === null || scope === void 0 ? void 0 : scope.localStorage;
    }
    catch (_a) {
        // Accessing localStorage can throw in some sandboxed contexts.
        return undefined;
    }
};
/**
 * Returns the persisted replay start time for this sessionId if one exists and is fresh,
 * otherwise writes `now` and returns it. Returns undefined only if storage is unavailable
 * — callers should fall back to a transient `Date.now()` in that case.
 */
export var getOrInitReplayStartTime = function (apiKey, sessionId, now, logger) {
    var storage = getLocalStorage();
    if (!storage)
        return undefined;
    var key = buildKey(apiKey, sessionId);
    try {
        var raw = storage.getItem(key);
        if (raw !== null) {
            var parsed = Number(raw);
            // Treat NaN, non-finite, future-dated, and stale entries as missing.
            if (Number.isFinite(parsed) && parsed > 0 && parsed <= now && now - parsed < REPLAY_START_TIME_TTL_MS) {
                return parsed;
            }
        }
        storage.setItem(key, String(now));
        return now;
    }
    catch (e) {
        logger === null || logger === void 0 ? void 0 : logger.debug("Failed to read/write replay start time from storage: ".concat(String(e)));
        return undefined;
    }
};
export var setReplayStartTime = function (apiKey, sessionId, startTime, logger) {
    var storage = getLocalStorage();
    if (!storage)
        return;
    try {
        storage.setItem(buildKey(apiKey, sessionId), String(startTime));
    }
    catch (e) {
        logger === null || logger === void 0 ? void 0 : logger.debug("Failed to write replay start time to storage: ".concat(String(e)));
    }
};
export var removeReplayStartTime = function (apiKey, sessionId, logger) {
    var storage = getLocalStorage();
    if (!storage)
        return;
    try {
        storage.removeItem(buildKey(apiKey, sessionId));
    }
    catch (e) {
        logger === null || logger === void 0 ? void 0 : logger.debug("Failed to remove replay start time from storage: ".concat(String(e)));
    }
};
/**
 * Drops stored start times older than {@link REPLAY_START_TIME_TTL_MS}. Cheap best-effort
 * sweep called on init — keeps localStorage from accumulating dead entries when sessions
 * end without a clean transition (browser close, crash). Scoped to this API key's keys
 * so multi-tenant pages don't churn through each other's entries.
 */
export var pruneStaleReplayStartTimes = function (apiKey, now, logger) {
    var e_1, _a;
    var storage = getLocalStorage();
    if (!storage)
        return;
    var prefix = buildKeyPrefix(apiKey);
    try {
        // Collect first; localStorage indices shift as we remove.
        var stale = [];
        for (var i = 0; i < storage.length; i++) {
            var key = storage.key(i);
            if (!key || !key.startsWith(prefix))
                continue;
            var raw = storage.getItem(key);
            if (raw === null)
                continue;
            var parsed = Number(raw);
            if (!Number.isFinite(parsed) || parsed <= 0 || now - parsed >= REPLAY_START_TIME_TTL_MS) {
                stale.push(key);
            }
        }
        try {
            for (var stale_1 = __values(stale), stale_1_1 = stale_1.next(); !stale_1_1.done; stale_1_1 = stale_1.next()) {
                var key = stale_1_1.value;
                storage.removeItem(key);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (stale_1_1 && !stale_1_1.done && (_a = stale_1.return)) _a.call(stale_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
    }
    catch (e) {
        logger === null || logger === void 0 ? void 0 : logger.debug("Failed to prune stale replay start times: ".concat(String(e)));
    }
};
//# sourceMappingURL=replay-start-time-store.js.map