import { MaskLevel, PrivacyConfig, SessionReplayJoinedConfig, UGCFilterRule } from './config/types';
import { StorageData } from './typings/session-replay';
export { getServerUrl } from './utils/server-url';
/**
 * Returns the effective mask level for a given URL by checking `urlMaskLevels`
 * (first match wins) and falling back to `defaultMaskLevel`.
 */
export declare const getEffectiveMaskLevel: (url: string | undefined, config: PrivacyConfig) => MaskLevel;
/**
 * Checks if the given element set to be masked by rrweb
 *
 * Priority is:
 *  1. [In code] Element/class based masking/unmasking <> [Config based] Selector based masking/unmasking
 *  2. Use app defaults
 */
export declare const isMasked: (elementType: 'input' | 'text', config: PrivacyConfig | undefined, element: HTMLElement | null, currentUrl?: string) => boolean;
export declare const maskFn: (elementType: 'text' | 'input', config?: PrivacyConfig, getCurrentUrl?: () => string) => (text: string, element: HTMLElement | null) => string;
export declare const maskAttributeFn: (config?: PrivacyConfig, getCurrentUrl?: () => string) => (key: string, value: string, element: HTMLElement) => string;
export declare const getCurrentUrl: () => string;
export declare const generateSessionReplayId: (sessionId: string | number, deviceId: string) => string;
export declare const validateUGCFilterRules: (ugcFilterRules: UGCFilterRule[]) => void;
export declare const getPageUrl: (pageUrl: string, ugcFilterRules: UGCFilterRule[]) => string;
export declare const getStorageSize: () => Promise<StorageData>;
export declare const getDebugConfig: (config: SessionReplayJoinedConfig) => SessionReplayJoinedConfig;
//# sourceMappingURL=helpers.d.ts.map