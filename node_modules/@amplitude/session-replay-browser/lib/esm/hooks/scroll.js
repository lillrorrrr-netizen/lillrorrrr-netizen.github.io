import { getViewportHeight, getViewportWidth } from '../utils/rrweb';
import { BeaconTransport } from '../beacon-transport';
import { getGlobalScope } from '@amplitude/analytics-core';
import { getPageUrl } from '../helpers';
/**
 * This is intended to watch and update max scroll activity when loaded for a particular page.
 * A new instance should be created if the page URL changes, since by default it does not reset
 * it's max scroll state. It is intended to send very few and very small events utilizing the
 * Beacon API.
 * @see {@link BeaconTransport} for more details on Beacon API usage.
 */
var ScrollWatcher = /** @class */ (function () {
    function ScrollWatcher(transport, config) {
        var _this = this;
        this.timestamp = Date.now();
        this.hook = function (e) {
            _this.update(e);
        };
        this.send = function (deviceIdFn) { return function (_) {
            var _a, _b, _c, _d;
            var deviceId = deviceIdFn();
            var globalScope = getGlobalScope();
            if (globalScope && deviceId) {
                // Capture the true final scroll position directly from the window.
                // rrweb's scroll observer throttles callbacks to 100ms using setTimeout,
                // so the most recent scroll position may not have been delivered to the hook yet.
                var scrollX_1 = (_a = globalScope.scrollX) !== null && _a !== void 0 ? _a : 0;
                var scrollY_1 = (_b = globalScope.scrollY) !== null && _b !== void 0 ? _b : 0;
                if (scrollX_1 > 0 || scrollY_1 > 0) {
                    // id is required by the scrollPosition type but is not used by update() —
                    // only x and y are read. 1 is the conventional rrweb mirror ID for the document node.
                    _this.update({ id: 1, x: scrollX_1, y: scrollY_1 });
                }
                _this.transport.send(deviceId, {
                    version: 1,
                    events: [
                        {
                            maxScrollX: _this._maxScrollX,
                            maxScrollY: _this._maxScrollY,
                            maxScrollWidth: _this._maxScrollWidth,
                            maxScrollHeight: _this._maxScrollHeight,
                            viewportHeight: getViewportHeight(),
                            viewportWidth: getViewportWidth(),
                            pageUrl: getPageUrl(globalScope.location.href, (_d = (_c = _this.config.interactionConfig) === null || _c === void 0 ? void 0 : _c.ugcFilterRules) !== null && _d !== void 0 ? _d : []),
                            timestamp: _this.timestamp,
                            type: 'scroll',
                        },
                    ],
                });
            }
        }; };
        this._maxScrollX = 0;
        this._maxScrollY = 0;
        this._currentScrollX = 0;
        this._currentScrollY = 0;
        this._maxScrollWidth = getViewportWidth();
        this._maxScrollHeight = getViewportHeight();
        this.config = config;
        this.transport = transport;
    }
    ScrollWatcher.default = function (context, config) {
        return new ScrollWatcher(new BeaconTransport(context, config), config);
    };
    Object.defineProperty(ScrollWatcher.prototype, "maxScrollX", {
        get: function () {
            return this._maxScrollX;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ScrollWatcher.prototype, "maxScrollY", {
        get: function () {
            return this._maxScrollY;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ScrollWatcher.prototype, "maxScrollWidth", {
        get: function () {
            return this._maxScrollWidth;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ScrollWatcher.prototype, "maxScrollHeight", {
        get: function () {
            return this._maxScrollHeight;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ScrollWatcher.prototype, "currentScrollX", {
        get: function () {
            return this._currentScrollX;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ScrollWatcher.prototype, "currentScrollY", {
        get: function () {
            return this._currentScrollY;
        },
        enumerable: false,
        configurable: true
    });
    ScrollWatcher.prototype.update = function (e) {
        var now = Date.now();
        this._currentScrollX = e.x;
        this._currentScrollY = e.y;
        if (e.x > this._maxScrollX) {
            var width = getViewportWidth();
            this._maxScrollX = e.x;
            var maxScrollWidth = e.x + width;
            if (maxScrollWidth > this._maxScrollWidth) {
                this._maxScrollWidth = maxScrollWidth;
            }
            this.timestamp = now;
        }
        if (e.y > this._maxScrollY) {
            var height = getViewportHeight();
            this._maxScrollY = e.y;
            var maxScrollHeight = e.y + height;
            if (maxScrollHeight > this._maxScrollHeight) {
                this._maxScrollHeight = maxScrollHeight;
            }
            this.timestamp = now;
        }
    };
    return ScrollWatcher;
}());
export { ScrollWatcher };
//# sourceMappingURL=scroll.js.map