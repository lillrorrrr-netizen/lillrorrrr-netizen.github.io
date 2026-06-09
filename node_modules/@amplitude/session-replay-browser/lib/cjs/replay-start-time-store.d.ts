import { ILogger } from '@amplitude/analytics-core';
/**
 * TTL beyond which a stored start time is treated as stale and pruned on next init.
 * 24 hours covers the longest realistic single-session duration in Amplitude (default
 * inactivity timeout is 30 minutes; some configs extend sessions across resumes).
 */
export declare const REPLAY_START_TIME_TTL_MS: number;
/**
 * Returns the persisted replay start time for this sessionId if one exists and is fresh,
 * otherwise writes `now` and returns it. Returns undefined only if storage is unavailable
 * — callers should fall back to a transient `Date.now()` in that case.
 */
export declare const getOrInitReplayStartTime: (apiKey: string, sessionId: string | number, now: number, logger?: ILogger) => number | undefined;
export declare const setReplayStartTime: (apiKey: string, sessionId: string | number, startTime: number, logger?: ILogger) => void;
export declare const removeReplayStartTime: (apiKey: string, sessionId: string | number, logger?: ILogger) => void;
/**
 * Drops stored start times older than {@link REPLAY_START_TIME_TTL_MS}. Cheap best-effort
 * sweep called on init — keeps localStorage from accumulating dead entries when sessions
 * end without a clean transition (browser close, crash). Scoped to this API key's keys
 * so multi-tenant pages don't churn through each other's entries.
 */
export declare const pruneStaleReplayStartTimes: (apiKey: string, now: number, logger?: ILogger) => void;
//# sourceMappingURL=replay-start-time-store.d.ts.map