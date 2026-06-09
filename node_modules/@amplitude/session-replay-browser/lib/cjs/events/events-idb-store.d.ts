import { DBSchema, IDBPDatabase } from 'idb';
import { EventType, Events, SendingSequencesReturn } from '../typings/session-replay';
import { BaseEventsStore, InstanceArgs as BaseInstanceArgs } from './base-events-store';
export declare function generateUUID(): string;
export declare const currentSequenceKey = "sessionCurrentSequence";
export declare const sequencesToSendKey = "sequencesToSend";
export declare const remoteConfigKey = "remoteConfig";
export declare const OPEN_DB_TIMEOUT_MS = 2000;
export declare const TX_DONE_TIMEOUT_MS = 5000;
/**
 * Race a promise against a timeout.  Resolves/rejects with the original
 * promise's value when it settles first; rejects with a timeout error if
 * `ms` elapses first.  Either way the timer is cleared so we don't leak
 * pending setTimeouts.
 */
export declare function withTimeout<T>(promise: Promise<T>, ms: number, message?: string): Promise<T>;
export interface SessionReplayDB extends DBSchema {
    sessionCurrentSequence: {
        key: number;
        value: Omit<SendingSequencesReturn<number>, 'sequenceId'> & {
            tabId?: string;
        };
    };
    sequencesToSend: {
        key: number;
        value: Omit<SendingSequencesReturn<number>, 'sequenceId'> & {
            tabId?: string;
        };
        indexes: {
            sessionId: string | number;
        };
    };
}
export declare const defineObjectStores: (db: IDBPDatabase<SessionReplayDB>) => {
    sequencesStore: import("idb").IDBPObjectStore<SessionReplayDB, ArrayLike<"sessionCurrentSequence" | "sequencesToSend">, "sequencesToSend", "versionchange"> | undefined;
    currentSequenceStore: import("idb").IDBPObjectStore<SessionReplayDB, ArrayLike<"sessionCurrentSequence" | "sequencesToSend">, "sessionCurrentSequence", "versionchange"> | undefined;
};
export declare const createStore: (dbName: string) => Promise<IDBPDatabase<SessionReplayDB>>;
type InstanceArgs = {
    apiKey: string;
    db: IDBPDatabase<SessionReplayDB>;
    tabId: string;
    onPersistentFailure?: () => void;
    consecutiveFailureThreshold?: number;
} & BaseInstanceArgs;
export declare class SessionReplayEventsIDBStore extends BaseEventsStore<number> {
    private readonly db;
    private readonly tabId;
    private readonly onPersistentFailure?;
    private readonly consecutiveFailureThreshold;
    private consecutiveFailures;
    private hasTriggeredFallback;
    private emptyFilteredCount;
    private maybeLogEmptyFiltered;
    constructor(args: InstanceArgs);
    private recordFailure;
    private recordSuccess;
    static new(type: EventType, args: Omit<InstanceArgs, 'db' | 'tabId'> & {
        tabId?: string;
    }): Promise<SessionReplayEventsIDBStore | undefined>;
    getCurrentSequenceEvents(sessionId?: number): Promise<{
        events: Events;
        sessionId: string | number;
    }[] | undefined>;
    getSequencesToSend: () => Promise<SendingSequencesReturn<number>[] | undefined>;
    storeCurrentSequence: (sessionId: number) => Promise<{
        sessionId: number;
        sequenceId: number;
        events: Events;
    } | undefined>;
    addEventToCurrentSequence: (sessionId: number, event: string) => Promise<{
        events: Events;
        sessionId: number;
        sequenceId: number;
    } | undefined>;
    storeSendingEvents: (sessionId: number, events: Events) => Promise<number | undefined>;
    cleanUpSessionEventsStore: (_sessionId: number, sequenceId?: number) => Promise<void>;
}
export {};
//# sourceMappingURL=events-idb-store.d.ts.map