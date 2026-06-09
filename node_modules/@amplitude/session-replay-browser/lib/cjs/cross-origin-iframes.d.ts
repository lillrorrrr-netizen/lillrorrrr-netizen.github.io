export declare function isInIframe(): boolean;
/**
 * Manages the parent side of cross-origin iframe recording coordination.
 *
 * When the parent starts recording, it sends a start signal to all current child
 * iframes and watches for dynamically added iframes via MutationObserver. When the
 * parent stops, it sends a stop signal.
 */
export declare class CrossOriginIframeCoordinator {
    private mutationObserver;
    private pendingLoadListeners;
    start(): void;
    stop(): void;
    private sendToIframeAfterLoad;
    private sendToAllIframes;
    private sendToIframe;
}
/**
 * Listens for start/stop signals from the parent page and invokes the provided
 * callbacks. Only messages from `window.parent` are accepted.
 *
 * Returns a cleanup function that removes the message listener.
 */
export declare function listenForParentSignals(callbacks: {
    onStart: () => void;
    onStop: () => void;
}): () => void;
//# sourceMappingURL=cross-origin-iframes.d.ts.map