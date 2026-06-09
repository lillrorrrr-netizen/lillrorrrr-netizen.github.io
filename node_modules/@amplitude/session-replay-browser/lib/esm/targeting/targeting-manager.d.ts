import { TargetingConfig } from '../config/types';
import { Logger } from '@amplitude/analytics-types';
import { SessionReplayTargetingInput } from '../typings/session-replay';
export declare const evaluateTargetingAndStore: ({ sessionId, targetingConfig, loggerProvider, apiKey, targetingParams, urlChange, }: {
    sessionId: string | number;
    targetingConfig: TargetingConfig;
    loggerProvider: Logger;
    apiKey: string;
    targetingParams?: SessionReplayTargetingInput | undefined;
    urlChange?: boolean | undefined;
}) => Promise<boolean>;
//# sourceMappingURL=targeting-manager.d.ts.map