"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gzipJson = void 0;
var tslib_1 = require("tslib");
/**
 * Gzip-compresses a JSON string using the CompressionStream API.
 * The `scope` parameter must be the global object (window or self) that
 * owns the CompressionStream constructor. The caller is responsible for
 * verifying that CompressionStream exists on that scope before calling.
 * Returns null if compression fails for any reason.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function gzipJson(jsonStr, scope) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var CS, stream, writer, reader_1, chunks_2, readPromise, totalLength, result, offset, chunks_1, chunks_1_1, chunk, _a;
        var e_1, _b;
        var _this = this;
        return tslib_1.__generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 4, , 5]);
                    CS = scope.CompressionStream;
                    stream = new CS('gzip');
                    writer = stream.writable.getWriter();
                    reader_1 = stream.readable.getReader();
                    chunks_2 = [];
                    readPromise = (function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                        var _a, done, value;
                        return tslib_1.__generator(this, function (_b) {
                            switch (_b.label) {
                                case 0: return [4 /*yield*/, reader_1.read()];
                                case 1:
                                    _a = _b.sent(), done = _a.done, value = _a.value;
                                    if (done)
                                        return [3 /*break*/, 3];
                                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                                    chunks_2.push(value);
                                    _b.label = 2;
                                case 2: return [3 /*break*/, 0];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); })();
                    return [4 /*yield*/, writer.write(new TextEncoder().encode(jsonStr))];
                case 1:
                    _c.sent();
                    return [4 /*yield*/, writer.close()];
                case 2:
                    _c.sent();
                    return [4 /*yield*/, readPromise];
                case 3:
                    _c.sent();
                    totalLength = chunks_2.reduce(function (sum, c) { return sum + c.length; }, 0);
                    result = new Uint8Array(totalLength);
                    offset = 0;
                    try {
                        for (chunks_1 = tslib_1.__values(chunks_2), chunks_1_1 = chunks_1.next(); !chunks_1_1.done; chunks_1_1 = chunks_1.next()) {
                            chunk = chunks_1_1.value;
                            result.set(chunk, offset);
                            offset += chunk.length;
                        }
                    }
                    catch (e_1_1) { e_1 = { error: e_1_1 }; }
                    finally {
                        try {
                            if (chunks_1_1 && !chunks_1_1.done && (_b = chunks_1.return)) _b.call(chunks_1);
                        }
                        finally { if (e_1) throw e_1.error; }
                    }
                    return [2 /*return*/, result];
                case 4:
                    _a = _c.sent();
                    return [2 /*return*/, null];
                case 5: return [2 /*return*/];
            }
        });
    });
}
exports.gzipJson = gzipJson;
//# sourceMappingURL=gzip.js.map