import type { eventWithTime } from '@amplitude/rrweb-types';
import { SessionReplayJoinedConfig } from '../config/types';
import { SessionReplayEventsManager } from '../typings/session-replay';
interface TaskQueue {
    event: eventWithTime;
    sessionId: string | number;
}
export declare class EventCompressor {
    taskQueue: TaskQueue[];
    pendingQueue: TaskQueue[];
    isProcessing: boolean;
    eventsManager?: SessionReplayEventsManager<'replay' | 'interaction', string>;
    config: SessionReplayJoinedConfig;
    deviceId: string | undefined;
    canUseIdleCallback: boolean | undefined;
    timeout: number;
    worker?: Worker;
    onFullSnapshotProcessed?: () => void;
    constructor(eventsManager: SessionReplayEventsManager<'replay' | 'interaction', string>, config: SessionReplayJoinedConfig, deviceId: string | undefined, workerScript?: string, onFullSnapshotProcessed?: () => void);
    scheduleIdleProcessing(): void;
    enqueueEvent(event: eventWithTime, sessionId: string | number): void;
    processQueue(idleDeadline: IdleDeadline): void;
    compressEvent: (event: eventWithTime) => string;
    private addCompressedEventToManager;
    addCompressedEvent: (event: eventWithTime, sessionId: string | number) => void;
    /**
     * Synchronously drain all queued events. Called during page unload to prevent
     * data loss from events waiting in the requestIdleCallback queue.
     */
    flushQueue: () => void;
    private mergeMutationTasks;
    terminate: () => void;
}
export {};
//# sourceMappingURL=event-compressor.d.ts.map