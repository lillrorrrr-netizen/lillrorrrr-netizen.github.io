import { __read, __spreadArray, __values } from "tslib";
import { getGlobalScope } from '@amplitude/analytics-core';
import { EventType as RRWebEventType } from '@amplitude/rrweb-types';
import { MAX_SINGLE_EVENT_SIZE } from '../constants';
import { mergeMutationEvents } from './merge-mutation-events';
var DEFAULT_TIMEOUT = 2000;
var EventCompressor = /** @class */ (function () {
    function EventCompressor(eventsManager, config, deviceId, workerScript, onFullSnapshotProcessed) {
        var _this = this;
        var _a;
        this.taskQueue = [];
        this.pendingQueue = [];
        this.isProcessing = false;
        this.compressEvent = function (event) {
            // Serialize with type+timestamp first for streaming parser compatibility.
            // JS engines serialize non-integer string keys in insertion order (ES2015 spec,
            // reliable across V8/SpiderMonkey/JSC), so explicit construction controls key order.
            // `delay` is an rrweb player field: an optional ms offset applied on top of
            // `timestamp` during replay to smooth out batched/throttled events. Preserve
            // it when present so playback timing is accurate.
            var _a = event, type = _a.type, timestamp = _a.timestamp, delay = _a.delay, data = _a.data;
            return delay != null ? JSON.stringify({ type: type, timestamp: timestamp, delay: delay, data: data }) : JSON.stringify({ type: type, timestamp: timestamp, data: data });
        };
        this.addCompressedEventToManager = function (compressedEvent, sessionId) {
            // UTF-8 byte size, not JS char count: a 9 M-char string of CJK/emoji can be 18–27 MB
            // on the wire and would otherwise slip past a char-count guard.
            var eventSizeBytes = new Blob([compressedEvent]).size;
            if (eventSizeBytes > MAX_SINGLE_EVENT_SIZE) {
                _this.config.loggerProvider.warn("Session replay event dropped: serialized size ".concat(Math.round(eventSizeBytes / 1024), " KB exceeds maximum allowed event size. If this recurs, please open a GitHub issue at https://github.com/amplitude/Amplitude-TypeScript/issues or contact Amplitude support."));
                return;
            }
            if (_this.eventsManager && _this.deviceId) {
                _this.eventsManager.addEvent({
                    event: { type: 'replay', data: compressedEvent },
                    sessionId: sessionId,
                    deviceId: _this.deviceId,
                });
            }
        };
        this.addCompressedEvent = function (event, sessionId) {
            if (_this.worker) {
                // This indirectly compresses the event.
                try {
                    _this.worker.postMessage({ event: event, sessionId: sessionId });
                }
                catch (err) {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    if (err.name === 'DataCloneError') {
                        // fallback: serialize
                        _this.worker.postMessage(JSON.stringify({ event: event, sessionId: sessionId }));
                    }
                    else {
                        _this.config.loggerProvider.warn('Unexpected error while posting message to worker:', err);
                    }
                }
            }
            else {
                var compressedEvent = _this.compressEvent(event);
                _this.addCompressedEventToManager(compressedEvent, sessionId);
            }
        };
        /**
         * Synchronously drain all queued events. Called during page unload to prevent
         * data loss from events waiting in the requestIdleCallback queue.
         */
        this.flushQueue = function () {
            var _a;
            // Merge any events still in pendingQueue into taskQueue first.
            // Events land in pendingQueue when the idle callback hasn't fired yet;
            // without this step they would be silently lost on page unload.
            if (_this.pendingQueue.length > 0) {
                (_a = _this.taskQueue).push.apply(_a, __spreadArray([], __read(_this.mergeMutationTasks(_this.pendingQueue.splice(0))), false));
            }
            while (_this.taskQueue.length > 0) {
                var task = _this.taskQueue.shift();
                if (task) {
                    var event_1 = task.event, sessionId = task.sessionId;
                    // Bypass the web worker: compress synchronously on the main thread and
                    // write directly to the manager. postMessage is async — during page
                    // unload the worker response would never arrive and events would be
                    // silently dropped. This mirrors the pattern used for full snapshots in
                    // enqueueEvent().
                    var compressed = _this.compressEvent(event_1);
                    _this.addCompressedEventToManager(compressed, sessionId);
                }
            }
            _this.isProcessing = false;
        };
        this.terminate = function () {
            var _a;
            (_a = _this.worker) === null || _a === void 0 ? void 0 : _a.terminate();
        };
        var globalScope = getGlobalScope();
        this.canUseIdleCallback = globalScope && 'requestIdleCallback' in globalScope;
        this.eventsManager = eventsManager;
        this.config = config;
        this.deviceId = deviceId;
        this.timeout = ((_a = config.performanceConfig) === null || _a === void 0 ? void 0 : _a.timeout) || DEFAULT_TIMEOUT;
        this.onFullSnapshotProcessed = onFullSnapshotProcessed;
        if (workerScript) {
            config.loggerProvider.log('Enabling web worker for compression');
            try {
                var blob = new Blob([workerScript], { type: 'application/javascript' });
                var blobUrl = URL.createObjectURL(blob);
                var worker_1 = new Worker(blobUrl);
                worker_1.onerror = function (e) {
                    e.preventDefault();
                    config.loggerProvider.error("Worker failed, falling back to non-worker compression: ".concat(e.message, " (").concat(e.filename, ":").concat(e.lineno, ")"));
                    worker_1.terminate();
                    _this.worker = undefined;
                };
                worker_1.onmessage = function (e) {
                    var _a = e.data, compressedEvent = _a.compressedEvent, sessionId = _a.sessionId;
                    _this.addCompressedEventToManager(compressedEvent, sessionId);
                };
                this.worker = worker_1;
            }
            catch (error) {
                config.loggerProvider.error('Failed to create worker, falling back to non-worker compression:', error);
            }
        }
    }
    // Schedule processing during idle time
    EventCompressor.prototype.scheduleIdleProcessing = function () {
        var _this = this;
        if (!this.isProcessing) {
            this.isProcessing = true;
            requestIdleCallback(function (idleDeadline) {
                _this.processQueue(idleDeadline);
            }, { timeout: this.timeout });
        }
    };
    // Add an event to the task queue if idle callback is supported or compress the event directly
    EventCompressor.prototype.enqueueEvent = function (event, sessionId) {
        var e_1, _a;
        var _b, _c;
        // Full snapshot (type 2) is the most critical event — a replay cannot be played without it.
        // Process and flush immediately rather than waiting for the idle scheduler or web worker,
        // maximising the chance it is delivered before the user exits the page.
        if (event.type === RRWebEventType.FullSnapshot) {
            this.config.loggerProvider.debug('Processing full snapshot immediately.');
            // Drain any events still pending in the idle-callback queue first.
            // Those events reference the pre-snapshot DOM and must be sent before
            // the full snapshot; if we let them be processed later they'd arrive at
            // the server after the snapshot and cause "node not found" replay errors.
            if (this.taskQueue.length > 0 || this.pendingQueue.length > 0) {
                var allTasks = __spreadArray(__spreadArray([], __read(this.taskQueue.splice(0)), false), __read(this.mergeMutationTasks(this.pendingQueue.splice(0))), false);
                try {
                    for (var allTasks_1 = __values(allTasks), allTasks_1_1 = allTasks_1.next(); !allTasks_1_1.done; allTasks_1_1 = allTasks_1.next()) {
                        var task = allTasks_1_1.value;
                        var compressed = this.compressEvent(task.event);
                        this.addCompressedEventToManager(compressed, task.sessionId);
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (allTasks_1_1 && !allTasks_1_1.done && (_a = allTasks_1.return)) _a.call(allTasks_1);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
                this.isProcessing = false;
            }
            var compressedEvent = this.compressEvent(event);
            this.addCompressedEventToManager(compressedEvent, sessionId);
            (_b = this.onFullSnapshotProcessed) === null || _b === void 0 ? void 0 : _b.call(this);
            return;
        }
        if (this.canUseIdleCallback && ((_c = this.config.performanceConfig) === null || _c === void 0 ? void 0 : _c.enabled)) {
            this.config.loggerProvider.debug('Enqueuing event for processing during idle time.');
            this.pendingQueue.push({ event: event, sessionId: sessionId });
            this.scheduleIdleProcessing();
        }
        else {
            this.config.loggerProvider.debug('Processing event without idle callback.');
            this.addCompressedEvent(event, sessionId);
        }
    };
    // Process the task queue during idle time
    EventCompressor.prototype.processQueue = function (idleDeadline) {
        var _a;
        var _this = this;
        // Merge newly-arrived pending events and append to the already-merged taskQueue.
        // Keeping them separate prevents re-merging already-merged tasks on subsequent calls,
        // which would corrupt move semantics for nodes that appear in multiple merge passes.
        if (this.pendingQueue.length > 0) {
            (_a = this.taskQueue).push.apply(_a, __spreadArray([], __read(this.mergeMutationTasks(this.pendingQueue.splice(0))), false));
        }
        // Process tasks while there's idle time or until the max number of tasks is reached
        while (this.taskQueue.length > 0 && (idleDeadline.timeRemaining() > 0 || idleDeadline.didTimeout)) {
            var task = this.taskQueue.shift();
            if (task) {
                var event_2 = task.event, sessionId = task.sessionId;
                this.addCompressedEvent(event_2, sessionId);
            }
        }
        // If there are still tasks in the queue, schedule the next idle callback
        if (this.taskQueue.length > 0 || this.pendingQueue.length > 0) {
            requestIdleCallback(function (idleDeadline) {
                _this.processQueue(idleDeadline);
            }, { timeout: this.timeout });
        }
        else {
            this.isProcessing = false;
        }
    };
    // Merge consecutive mutation tasks with the same sessionId before processing,
    // reducing the number of events serialized and stored without changing replay semantics.
    // Only runs when performanceConfig.mergeMutations is explicitly enabled.
    EventCompressor.prototype.mergeMutationTasks = function (tasks) {
        var e_2, _a;
        var _b;
        if (!((_b = this.config.performanceConfig) === null || _b === void 0 ? void 0 : _b.mergeMutations))
            return tasks;
        if (tasks.length <= 1)
            return tasks;
        var result = [];
        var i = 0;
        while (i < tasks.length) {
            var sessionId = tasks[i].sessionId;
            // Find the end of the current session run
            var j = i + 1;
            while (j < tasks.length && tasks[j].sessionId === sessionId) {
                j++;
            }
            // Merge consecutive mutations within this session run; non-mutations pass through unchanged
            var merged = mergeMutationEvents(tasks.slice(i, j).map(function (t) { return t.event; }));
            try {
                for (var merged_1 = (e_2 = void 0, __values(merged)), merged_1_1 = merged_1.next(); !merged_1_1.done; merged_1_1 = merged_1.next()) {
                    var event_3 = merged_1_1.value;
                    result.push({ event: event_3, sessionId: sessionId });
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (merged_1_1 && !merged_1_1.done && (_a = merged_1.return)) _a.call(merged_1);
                }
                finally { if (e_2) throw e_2.error; }
            }
            i = j;
        }
        return result;
    };
    return EventCompressor;
}());
export { EventCompressor };
//# sourceMappingURL=event-compressor.js.map