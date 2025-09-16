import type { AstroIntegration } from 'astro';
import type { LinkCheckerOptions } from './types';
/**
 * Creates the Astro Link Checker integration
 */
export default function astroLinkChecker(options?: LinkCheckerOptions): AstroIntegration;
export type { LinkCheckerOptions, Link, BrokenLink, LinkCheckResult } from './types';
export { checkLinks, extractLinksFromHtml } from './link-checker.js';
