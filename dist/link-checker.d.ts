import type { Link, LinkCheckResult, LinkCheckerOptions } from './types';
/**
 * Extract links from HTML content using Cheerio
 */
export declare function extractLinksFromHtml(html: string, sourceFile: string): Link[];
/**
 * Main function to check all links in the build directory
 */
export declare function checkLinks(buildDir: string, options?: LinkCheckerOptions): Promise<LinkCheckResult>;
