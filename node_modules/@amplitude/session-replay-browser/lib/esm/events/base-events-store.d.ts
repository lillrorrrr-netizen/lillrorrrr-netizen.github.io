import { ILogger } from '@amplitude/analytics-core';
import { Events, EventsStore, SendingSequencesReturn } from '../typings/session-replay';
export type InstanceArgs = {
    loggerProvider: ILogger;
    minInterval?: number;
    maxInterval?: number;
    maxPersistedEventsSize?: number;
};
export declare abstract class BaseEventsStore<KeyType> implements EventsStore<KeyType> {
    protected readonly loggerProvider: ILogger;
    private minInterval;
    private maxInterval;
    private maxPersistedEventsSize;
    private interval;
    private _timeAtLastSplit;
    get timeAtLastSplit(): number;
    constructor(args: InstanceArgs);
    abstract addEventToCurrentSequence(sessionId: string | number, event: string): Promise<SendingSequencesReturn<KeyType> | undefined>;
    abstract getSequencesToSend(): Promise<SendingSequencesReturn<KeyType>[] | undefined>;
    abstract storeCurrentSequence(sessionId: number): Promise<SendingSequencesReturn<KeyType> | undefined>;
    abstract storeSendingEvents(sessionId: string | number, events: Events): Promise<KeyType | undefined>;
    abstract cleanUpSessionEventsStore(sessionId: number, sequenceId: KeyType): Promise<void>;
    /**
     * Returns the UTF-8 byte size of a string without buffer allocation, matching the
     * actual wire byte count for non-ASCII content (Base64 image data, emoji, etc.).
     */
    private getStringSize;
    /**
     * Calculates the total UTF-8 byte size of events array
     * Accounts for JSON serialization overhead when sent to backend
     */
    private getEventsArraySize;
    /**
     * Determines whether to send the events list to the backend and start a new
     * empty events list, based on the size of the list as well as the last time sent
     * @param nextEventString
     * @returns boolean
     */
    shouldSplitEventsList: (events: Events, nextEventString: string) => boolean;
}
//# sourceMappingURL=base-events-store.d.ts.map