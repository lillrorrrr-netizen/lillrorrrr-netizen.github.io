export type ResponseBodyStatus = 'captured' | 'truncated' | 'skipped_binary' | 'error';
export interface NetworkRequestEvent {
    timestamp: number;
    type: 'fetch';
    method: string;
    url: string;
    status?: number;
    duration?: number;
    requestHeaders?: Record<string, string>;
    responseHeaders?: Record<string, string>;
    requestBody?: string;
    responseBody?: string;
    responseBodyStatus?: ResponseBodyStatus;
    error?: {
        name: string;
        message: string;
    };
}
export type NetworkEventCallback = (event: NetworkRequestEvent) => void;
export interface NetworkBodyConfig {
    request?: boolean;
    response?: boolean;
    maxBodySizeBytes?: number;
}
export interface NetworkConfig {
    enabled: boolean;
    body?: NetworkBodyConfig;
}
export declare class NetworkObservers {
    private fetchObserver;
    private eventCallback?;
    private networkConfig?;
    start(eventCallback: NetworkEventCallback, networkConfig?: NetworkConfig): void;
    stop(): void;
    protected notifyEvent(event: NetworkRequestEvent): void;
    private observeFetch;
}
//# sourceMappingURL=observers.d.ts.map