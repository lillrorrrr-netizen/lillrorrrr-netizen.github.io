import type { eventWithTime } from '@amplitude/rrweb-types';
/**
 * Merges consecutive IncrementalSnapshot mutation events into a single event,
 * reducing overall event count without changing replay semantics.
 *
 * isAttachIframe events are never merged — they carry a full iframe document
 * tree and must remain isolated.
 */
export declare function mergeMutationEvents(events: eventWithTime[]): eventWithTime[];
//# sourceMappingURL=merge-mutation-events.d.ts.map