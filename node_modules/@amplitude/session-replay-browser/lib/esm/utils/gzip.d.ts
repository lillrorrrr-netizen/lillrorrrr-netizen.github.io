/**
 * Gzip-compresses a JSON string using the CompressionStream API.
 * The `scope` parameter must be the global object (window or self) that
 * owns the CompressionStream constructor. The caller is responsible for
 * verifying that CompressionStream exists on that scope before calling.
 * Returns null if compression fails for any reason.
 */
export declare function gzipJson(jsonStr: string, scope: any): Promise<Uint8Array | null>;
//# sourceMappingURL=gzip.d.ts.map