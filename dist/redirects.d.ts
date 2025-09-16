export interface RedirectRule {
    from: string;
    to: string;
    status: number;
}
/**
 * Parse a _redirects file content into RedirectRule objects
 */
export declare function parseRedirects(content: string): RedirectRule[];
/**
 * Load and parse redirects file from build directory or custom path
 */
export declare function loadRedirects(buildDir: string, redirectsFile?: string): Promise<RedirectRule[]>;
/**
 * Find redirect rule for a given path
 * Supports simple wildcards like * and :lang placeholders
 */
export declare function findRedirectRule(path: string, rules: RedirectRule[]): RedirectRule | null;
/**
 * Apply redirect rule to resolve the final destination
 * Handles parameter substitution for patterns with :lang, *, etc.
 */
export declare function applyRedirectRule(path: string, rule: RedirectRule): string;
