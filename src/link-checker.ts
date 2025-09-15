import { promises as fs, existsSync } from 'node:fs';
import { join, resolve, dirname, relative, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';
import type { CheerioAPI } from 'cheerio';
import type { Link, BrokenLink, LinkCheckResult, LinkCheckerOptions } from './types';
import { loadRedirects, findRedirectRule, applyRedirectRule, type RedirectRule } from './redirects.js';

/**
 * Extract links from HTML content using Cheerio
 */
export function extractLinksFromHtml(html: string, sourceFile: string): Link[] {
  const $: CheerioAPI = load(html);
  const links: Link[] = [];

  // Extract href links (a, link tags)
  $('a[href], link[href]').each((_, element) => {
    const href = $(element).attr('href');
    const text = $(element).text().trim() || $(element).attr('title') || href || '';
    
    if (href && !href.startsWith('javascript:') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
      links.push({
        href,
        text,
        sourceFile,
        type: categorizeLink(href),
      });
    }
  });

  // Extract src links (img, script, iframe, source, etc.)
  $('img[src], script[src], iframe[src], source[src], video[src], audio[src]').each((_, element) => {
    const src = $(element).attr('src');
    const alt = $(element).attr('alt') || $(element).attr('title') || src || '';
    
    if (src && !src.startsWith('data:') && !src.startsWith('blob:')) {
      links.push({
        href: src,
        text: alt,
        sourceFile,
        type: 'asset',
      });
    }
  });

  // Extract srcset links
  $('img[srcset], source[srcset]').each((_, element) => {
    const srcset = $(element).attr('srcset');
    if (srcset) {
      const srcs = parseSrcset(srcset);
      srcs.forEach(src => {
        if (!src.startsWith('data:') && !src.startsWith('blob:')) {
          links.push({
            href: src,
            text: $(element).attr('alt') || src,
            sourceFile,
            type: 'asset',
          });
        }
      });
    }
  });

  return links;
}

/**
 * Categorize a link based on its href
 */
function categorizeLink(href: string): 'internal' | 'external' | 'asset' | 'anchor' {
  // Anchor links
  if (href.startsWith('#')) {
    return 'anchor';
  }
  
  // External links
  if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//')) {
    return 'external';
  }
  
  // Check if it's an asset based on file extension
  const ext = extname(href.split('?')[0].split('#')[0]).toLowerCase();
  const assetExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.avif', 
                          '.css', '.js', '.json', '.pdf', '.zip', '.mp4', '.webm', 
                          '.mp3', '.wav', '.woff', '.woff2', '.ttf', '.eot', '.ico'];
  
  if (assetExtensions.includes(ext)) {
    return 'asset';
  }
  
  return 'internal';
}

/**
 * Parse srcset attribute to extract individual URLs
 */
function parseSrcset(srcset: string): string[] {
  return srcset
    .split(',')
    .map(s => s.trim().split(/\s+/)[0])
    .filter(Boolean);
}

/**
 * Resolve a relative URL against a base path
 */
function resolveUrl(href: string, basePath: string, baseUrl?: string): string {
  // Handle absolute URLs
  if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//')) {
    return href;
  }
  
  // Handle protocol-relative URLs
  if (href.startsWith('//')) {
    return `https:${href}`;
  }
  
  // Handle anchor links
  if (href.startsWith('#')) {
    return href;
  }
  
  // Handle root-relative URLs
  if (href.startsWith('/')) {
    if (baseUrl) {
      return new URL(href, baseUrl).toString();
    }
    return href;
  }
  
  // Handle relative URLs
  const resolvedPath = resolve(dirname(basePath), href);
  return resolvedPath;
}

/**
 * Check if an internal link/asset exists in the build directory
 * Also checks redirects to avoid false positives for redirected URLs
 */
async function checkInternalLink(link: Link, buildDir: string, redirects: RedirectRule[], baseUrl?: string): Promise<BrokenLink | null> {
  let { href } = link;
  
  // Skip external URLs - they should be handled by checkExternalLink
  if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//')) {
    return null;
  }
  
  // Remove hash fragments and query parameters for file checking
  const cleanHref = href.split('#')[0].split('?')[0];
  
  // Handle anchor links - they're valid if the file exists
  if (href.startsWith('#')) {
    return null; // Skip anchor-only links for now
  }
  
  // First, check if there's a redirect rule for this link (only if redirects are configured)
  if (cleanHref.startsWith('/') && redirects.length > 0) {
    const redirectRule = findRedirectRule(cleanHref, redirects);
    if (redirectRule) {
      // Found a redirect, check the redirect target instead
      const redirectTarget = applyRedirectRule(cleanHref, redirectRule);
      
      // Recursively check the redirect target if it's still internal
      if (redirectTarget.startsWith('/')) {
        const redirectedLink: Link = {
          ...link,
          href: redirectTarget
        };
        return await checkInternalLink(redirectedLink, buildDir, redirects, baseUrl);
      } else {
        // Redirect target is external, consider the original link valid
        return null;
      }
    }
  }
  
  // Convert to file system path
  let filePath: string;
  
  if (cleanHref.startsWith('/')) {
    // Root-relative path
    filePath = join(buildDir, cleanHref.substring(1));
  } else {
    // Relative path
    const sourceDir = dirname(join(buildDir, relative(buildDir, link.sourceFile)));
    filePath = resolve(sourceDir, cleanHref);
  }
  
  // Normalize path separators
  filePath = filePath.replace(/[/\\\\]/g, sep);
  
  // Check if file exists
  if (existsSync(filePath)) {
    return null; // File exists, link is valid
  }
  
  // For HTML files, try with .html extension and index.html
  if (!extname(filePath)) {
    // Try with .html extension
    if (existsSync(filePath + '.html')) {
      return null;
    }
    
    // Try as directory with index.html
    if (existsSync(join(filePath, 'index.html'))) {
      return null;
    }
  }
  
  // For directories, try index.html
  try {
    const stats = await fs.stat(filePath);
    if (stats.isDirectory() && existsSync(join(filePath, 'index.html'))) {
      return null;
    }
  } catch {
    // File doesn't exist, continue to error return
  }
  
  return {
    ...link,
    error: `File not found: ${relative(buildDir, filePath)}`,
    reason: 'not-found'
  };
}

/**
 * Check if an external link is accessible
 */
async function checkExternalLink(link: Link, timeout: number = 5000): Promise<BrokenLink | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(link.href, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; astro-link-checker/1.0.0)'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      return null; // Link is valid
    }
    
    return {
      ...link,
      error: `HTTP ${response.status}: ${response.statusText}`,
      reason: 'network-error'
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          ...link,
          error: `Request timeout after ${timeout}ms`,
          reason: 'timeout'
        };
      }
      
      return {
        ...link,
        error: error.message,
        reason: 'network-error'
      };
    }
    
    return {
      ...link,
      error: 'Unknown error',
      reason: 'network-error'
    };
  }
}

/**
 * Get all HTML files in a directory recursively
 */
async function getHtmlFiles(dir: string, include: string[] = ['**/*.html']): Promise<string[]> {
  const files: string[] = [];
  
  async function walk(currentDir: string): Promise<void> {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.html')) {
        files.push(fullPath);
      }
    }
  }
  
  await walk(dir);
  return files;
}

/**
 * Check links in a single HTML file
 */
async function checkLinksInFile(
  filePath: string,
  buildDir: string,
  redirects: RedirectRule[],
  options: {
    checkExternal: boolean;
    exclude: string[];
    externalTimeout: number;
    base: string | undefined;
  }
): Promise<{ links: Link[], brokenLinks: BrokenLink[] }> {
  const html = await fs.readFile(filePath, 'utf-8');
  const links = extractLinksFromHtml(html, filePath);
  const brokenLinks: BrokenLink[] = [];
  
  // Process links concurrently in batches of 10
  const BATCH_SIZE = 10;
  for (let i = 0; i < links.length; i += BATCH_SIZE) {
    const batch = links.slice(i, i + BATCH_SIZE);
    const batchPromises = batch.map(async (link) => {
      // Skip excluded patterns
      if (options.exclude.some(pattern => link.href.includes(pattern))) {
        return null;
      }
      
      if (link.type === 'external') {
        if (options.checkExternal) {
          return await checkExternalLink(link, options.externalTimeout);
        }
      } else if (link.type === 'internal' || link.type === 'asset') {
        return await checkInternalLink(link, buildDir, redirects, options.base);
      }
      return null;
    });
    
    const batchResults = await Promise.all(batchPromises);
    brokenLinks.push(...batchResults.filter((result): result is BrokenLink => result !== null));
  }
  
  return { links, brokenLinks };
}

/**
 * Main function to check all links in the build directory
 */
export async function checkLinks(
  buildDir: string,
  options: LinkCheckerOptions = {}
): Promise<LinkCheckResult> {
  const resolvedOptions = {
    checkExternal: false,
    failOnBrokenLinks: true,
    exclude: [],
    include: ['**/*.html'],
    externalTimeout: 5000,
    verbose: false,
    base: undefined as string | undefined,
    redirectsFile: undefined as string | undefined,
    ...options
  };
  
  const buildDirPath = typeof buildDir === 'string' ? buildDir : fileURLToPath(buildDir);
  
  // Load redirects from the specified file (if configured)
  const redirects = await loadRedirects(buildDirPath, resolvedOptions.redirectsFile);
  if (resolvedOptions.verbose && redirects.length > 0) {
    console.log(`📍 Loaded ${redirects.length} redirect rules from ${resolvedOptions.redirectsFile}`);
  }
  
  const htmlFiles = await getHtmlFiles(buildDirPath, resolvedOptions.include);
  
  const result: LinkCheckResult = {
    totalLinks: 0,
    brokenLinks: [],
    checkedFiles: [],
    skippedFiles: []
  };
  
  for (const filePath of htmlFiles) {
    try {
      const { links, brokenLinks } = await checkLinksInFile(filePath, buildDirPath, redirects, resolvedOptions);
      
      result.totalLinks += links.length;
      result.brokenLinks.push(...brokenLinks);
      result.checkedFiles.push(relative(buildDirPath, filePath));
      
      if (resolvedOptions.verbose) {
        console.log(`Checked ${links.length} links in ${relative(buildDirPath, filePath)}`);
      }
    } catch (error) {
      result.skippedFiles.push(relative(buildDirPath, filePath));
      if (resolvedOptions.verbose) {
        console.warn(`Skipped ${relative(buildDirPath, filePath)}: ${error}`);
      }
    }
  }
  
  return result;
}