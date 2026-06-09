"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getServerUrl = void 0;
var constants_1 = require("../constants");
function getServerUrl(serverZone, trackServerUrl) {
    if (trackServerUrl)
        return trackServerUrl;
    if (serverZone === 'STAGING')
        return constants_1.SESSION_REPLAY_STAGING_URL;
    if (serverZone === 'EU')
        return constants_1.SESSION_REPLAY_EU_URL;
    return constants_1.SESSION_REPLAY_SERVER_URL;
}
exports.getServerUrl = getServerUrl;
//# sourceMappingURL=server-url.js.map