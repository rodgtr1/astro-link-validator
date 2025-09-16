import type { AstroIntegration } from 'astro';
import type { LinkValidatorOptions } from './types';
/**
 * Creates the Astro Link Validator integration
 */
export default function linkValidator(options?: LinkValidatorOptions): AstroIntegration;
export type { LinkValidatorOptions, Link, BrokenLink, LinkCheckResult } from './types';
export { checkLinks, extractLinksFromHtml } from './link-checker.js';
