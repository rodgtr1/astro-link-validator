import { promises as fs } from 'node:fs';
import { join } from 'node:path';

export interface RedirectRule {
  from: string;
  to: string;
  status: number;
}

/**
 * Parse a _redirects file content into RedirectRule objects
 */
export function parseRedirects(content: string): RedirectRule[] {
  const rules: RedirectRule[] = [];
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    
    // Parse redirect rule: source destination [status_code]
    const parts = trimmed.split(/\s+/);
    if (parts.length >= 2) {
      const from = parts[0];
      const to = parts[1];
      const status = parts.length > 2 ? parseInt(parts[2], 10) : 301;
      
      rules.push({ from, to, status });
    }
  }
  
  return rules;
}

/**
 * Load and parse redirects file from build directory or custom path
 */
export async function loadRedirects(buildDir: string, redirectsFile?: string): Promise<RedirectRule[]> {
  if (!redirectsFile) {
    return []; // No redirects file specified, return empty array
  }
  
  // Determine the full path to the redirects file
  let redirectsPath: string;
  if (redirectsFile.startsWith('/')) {
    // Absolute path
    redirectsPath = redirectsFile;
  } else {
    // Relative path from build directory
    redirectsPath = join(buildDir, redirectsFile);
  }
  
  try {
    const content = await fs.readFile(redirectsPath, 'utf-8');
    return parseRedirects(content);
  } catch (error) {
    // Redirects file doesn't exist or can't be read
    console.warn(`Warning: Could not read redirects file at ${redirectsPath}:`, error instanceof Error ? error.message : error);
    return [];
  }
}

/**
 * Find redirect rule for a given path
 * Supports simple wildcards like * and :lang placeholders
 */
export function findRedirectRule(path: string, rules: RedirectRule[]): RedirectRule | null {
  for (const rule of rules) {
    if (matchesPattern(path, rule.from)) {
      return rule;
    }
  }
  
  return null;
}

/**
 * Check if a path matches a redirect pattern
 * Supports basic wildcards (*) and named parameters (:param)
 */
function matchesPattern(path: string, pattern: string): boolean {
  // Direct match
  if (path === pattern) {
    return true;
  }
  
  // Convert pattern to regex
  const regexPattern = pattern
    // Escape special regex characters except * and :
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    // Handle named parameters like :lang
    .replace(/:[\w]+/g, '([^/]+)')
    // Handle wildcards
    .replace(/\*/g, '(.*)');
    
  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(path);
}

/**
 * Apply redirect rule to resolve the final destination
 * Handles parameter substitution for patterns with :lang, *, etc.
 */
export function applyRedirectRule(path: string, rule: RedirectRule): string {
  // If no wildcards or parameters, return destination as-is
  if (!rule.from.includes('*') && !rule.from.includes(':')) {
    return rule.to;
  }
  
  // Extract matches from the source pattern
  const regexPattern = rule.from
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/:[\w]+/g, '([^/]+)')
    .replace(/\*/g, '(.*)');
    
  const regex = new RegExp(`^${regexPattern}$`);
  const matches = path.match(regex);
  
  if (!matches) {
    return rule.to;
  }
  
  // Replace placeholders in destination
  let destination = rule.to;
  const captures = matches.slice(1); // Remove the full match
  
  // Replace :param patterns
  const paramPattern = /:[\w]+/g;
  let paramIndex = 0;
  destination = destination.replace(paramPattern, () => {
    return captures[paramIndex++] || '';
  });
  
  // Replace * patterns
  const wildcardPattern = /\*/g;
  destination = destination.replace(wildcardPattern, () => {
    return captures[paramIndex++] || '';
  });
  
  // Handle :splat placeholder (common in Netlify redirects)
  if (destination.includes(':splat')) {
    const lastCapture = captures[captures.length - 1] || '';
    destination = destination.replace(':splat', lastCapture);
  }
  
  return destination;
}