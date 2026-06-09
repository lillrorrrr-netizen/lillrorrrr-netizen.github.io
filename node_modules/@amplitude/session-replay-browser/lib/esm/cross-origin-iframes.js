import { __values } from "tslib";
import { getGlobalScope } from '@amplitude/analytics-core';
import { CROSS_ORIGIN_IFRAME_MESSAGE_TYPE } from './constants';
export function isInIframe() {
    try {
        var globalScope = getGlobalScope();
        if (!globalScope) {
            return false;
        }
        return globalScope.parent !== globalScope;
    }
    catch (_a) {
        // SecurityError accessing window.parent in some sandboxed environments
        return true;
    }
}
/**
 * Manages the parent side of cross-origin iframe recording coordination.
 *
 * When the parent starts recording, it sends a start signal to all current child
 * iframes and watches for dynamically added iframes via MutationObserver. When the
 * parent stops, it sends a stop signal.
 */
var CrossOriginIframeCoordinator = /** @class */ (function () {
    function CrossOriginIframeCoordinator() {
        // Tracks pending load listeners for dynamically added iframes so stop() can cancel them.
        this.pendingLoadListeners = new Map();
    }
    CrossOriginIframeCoordinator.prototype.start = function () {
        var _this = this;
        var _a;
        (_a = this.mutationObserver) === null || _a === void 0 ? void 0 : _a.disconnect(); // guard against double-start
        var globalScope = getGlobalScope();
        if (!globalScope) {
            return;
        }
        this.sendToAllIframes({ type: CROSS_ORIGIN_IFRAME_MESSAGE_TYPE, action: 'start' });
        this.mutationObserver = new MutationObserver(function (mutations) {
            var e_1, _a, e_2, _b, e_3, _c;
            try {
                for (var mutations_1 = __values(mutations), mutations_1_1 = mutations_1.next(); !mutations_1_1.done; mutations_1_1 = mutations_1.next()) {
                    var mutation = mutations_1_1.value;
                    try {
                        for (var _d = (e_2 = void 0, __values(Array.from(mutation.addedNodes))), _e = _d.next(); !_e.done; _e = _d.next()) {
                            var node = _e.value;
                            if (node instanceof HTMLIFrameElement) {
                                // Send the start signal after the child page has loaded, not at insertion
                                // time. At insertion the contentWindow is still about:blank; the message
                                // sent there is discarded when the iframe navigates to its src, and the
                                // child SDK never receives it.
                                _this.sendToIframeAfterLoad(node);
                            }
                            else if (node instanceof Element) {
                                // A container element (e.g. a React-rendered div) may already have
                                // iframe descendants when it is inserted. These iframes do NOT appear
                                // in addedNodes — only the container does. Query the subtree so we
                                // don't miss them.
                                node.querySelectorAll('iframe').forEach(function (iframe) {
                                    _this.sendToIframeAfterLoad(iframe);
                                });
                            }
                        }
                    }
                    catch (e_2_1) { e_2 = { error: e_2_1 }; }
                    finally {
                        try {
                            if (_e && !_e.done && (_b = _d.return)) _b.call(_d);
                        }
                        finally { if (e_2) throw e_2.error; }
                    }
                    try {
                        for (var _f = (e_3 = void 0, __values(Array.from(mutation.removedNodes))), _g = _f.next(); !_g.done; _g = _f.next()) {
                            var node = _g.value;
                            if (node instanceof HTMLIFrameElement) {
                                var listener = _this.pendingLoadListeners.get(node);
                                if (listener) {
                                    node.removeEventListener('load', listener);
                                    _this.pendingLoadListeners.delete(node);
                                }
                            }
                        }
                    }
                    catch (e_3_1) { e_3 = { error: e_3_1 }; }
                    finally {
                        try {
                            if (_g && !_g.done && (_c = _f.return)) _c.call(_f);
                        }
                        finally { if (e_3) throw e_3.error; }
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (mutations_1_1 && !mutations_1_1.done && (_a = mutations_1.return)) _a.call(mutations_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
        });
        this.mutationObserver.observe(document.documentElement, { childList: true, subtree: true });
    };
    CrossOriginIframeCoordinator.prototype.stop = function () {
        var _a;
        (_a = this.mutationObserver) === null || _a === void 0 ? void 0 : _a.disconnect();
        this.mutationObserver = undefined;
        // Cancel any start signals that were waiting for a pending iframe load.
        this.pendingLoadListeners.forEach(function (listener, iframe) {
            iframe.removeEventListener('load', listener);
        });
        this.pendingLoadListeners.clear();
        this.sendToAllIframes({ type: CROSS_ORIGIN_IFRAME_MESSAGE_TYPE, action: 'stop' });
    };
    CrossOriginIframeCoordinator.prototype.sendToIframeAfterLoad = function (iframe) {
        var _this = this;
        var sendStart = function () {
            _this.pendingLoadListeners.delete(iframe);
            _this.sendToIframe(iframe, { type: CROSS_ORIGIN_IFRAME_MESSAGE_TYPE, action: 'start' });
        };
        this.pendingLoadListeners.set(iframe, sendStart);
        iframe.addEventListener('load', sendStart, { once: true });
    };
    CrossOriginIframeCoordinator.prototype.sendToAllIframes = function (message) {
        var _this = this;
        var iframes = document.querySelectorAll('iframe');
        iframes.forEach(function (iframe) { return _this.sendToIframe(iframe, message); });
    };
    CrossOriginIframeCoordinator.prototype.sendToIframe = function (iframe, message) {
        var _a;
        try {
            (_a = iframe.contentWindow) === null || _a === void 0 ? void 0 : _a.postMessage(message, '*');
        }
        catch (_b) {
            // Cross-origin postMessage can throw in some sandboxed environments; ignore.
        }
    };
    return CrossOriginIframeCoordinator;
}());
export { CrossOriginIframeCoordinator };
/**
 * Listens for start/stop signals from the parent page and invokes the provided
 * callbacks. Only messages from `window.parent` are accepted.
 *
 * Returns a cleanup function that removes the message listener.
 */
export function listenForParentSignals(callbacks) {
    var globalScope = getGlobalScope();
    if (!globalScope) {
        return function () { return undefined; };
    }
    var parentFrame = globalScope.parent;
    function handler(event) {
        // Only accept messages from the direct parent frame.
        if (event.source !== parentFrame) {
            return;
        }
        var data = event.data;
        if ((data === null || data === void 0 ? void 0 : data.type) !== CROSS_ORIGIN_IFRAME_MESSAGE_TYPE) {
            return;
        }
        if (data.action === 'start') {
            callbacks.onStart();
        }
        else if (data.action === 'stop') {
            callbacks.onStop();
        }
    }
    globalScope.addEventListener('message', handler);
    return function () { return globalScope.removeEventListener('message', handler); };
}
//# sourceMappingURL=cross-origin-iframes.js.map