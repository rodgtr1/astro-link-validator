import { promises as fs, existsSync } from 'node:fs';
import { join, resolve, dirname, relative, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';
import { loadRedirects, findRedirectRule, applyRedirectRule } from './redirects.js';
/**
 * Maximum number of redirects to follow before treating a link as a redirect loop
 */
const MAX_REDIRECT_DEPTH = 10;
/**
 * Extract links from HTML content using Cheerio
 */
export function extractLinksFromHtml(html, sourceFile) {
    const $ = load(html);
    const links = [];
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
function categorizeLink(href) {
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
function parseSrcset(srcset) {
    return srcset
        .split(',')
        .map(s => s.trim().split(/\s+/)[0])
        .filter(Boolean);
}
/**
 * Build an anchored regex from a wildcard pattern.
 * A `*` matches any run of characters, including `/`. A leading globstar segment
 * matches the empty string too, so the default include pattern covers both
 * `index.html` and `blog/index.html`.
 */
function wildcardToRegExp(pattern) {
    let source = '';
    for (let i = 0; i < pattern.length; i++) {
        if (pattern.startsWith('**/', i)) {
            source += '(?:.*/)?';
            i += 2;
        }
        else if (pattern[i] === '*') {
            while (pattern[i + 1] === '*')
                i++;
            source += '.*';
        }
        else {
            source += pattern[i].replace(/[.+?^${}()|[\]\\]/g, '\\$&');
        }
    }
    return new RegExp(`^${source}$`);
}
/**
 * Match a link href against an `exclude` pattern.
 * Patterns containing `*` match as wildcards against the whole href; patterns
 * without one keep the original substring behaviour.
 */
function matchesExcludePattern(href, pattern) {
    if (!pattern.includes('*')) {
        return href.includes(pattern);
    }
    return wildcardToRegExp(pattern).test(href);
}
/**
 * Match a build-relative file path (always posix separators) against an
 * `include` pattern. A pattern without wildcards matches the path exactly.
 */
function matchesIncludePattern(relativePath, pattern) {
    return wildcardToRegExp(pattern).test(relativePath);
}
/**
 * Validate that a resolved path is within the build directory
 * Prevents path traversal attacks
 */
function validatePath(filePath, buildDir) {
    const resolved = resolve(filePath);
    const basePath = resolve(buildDir);
    return resolved.startsWith(basePath);
}
/**
 * Check if an internal link/asset exists in the build directory
 * Also follows redirects to avoid false positives for redirected URLs
 */
async function checkInternalLink(link, buildDir, redirects) {
    const { href } = link;
    // Skip external URLs - they should be handled by checkExternalLink
    if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//')) {
        return null;
    }
    // Handle anchor links - they're valid if the file exists
    if (href.startsWith('#')) {
        return null; // Skip anchor-only links for now
    }
    // Remove hash fragments and query parameters for file checking
    let cleanHref = href.split('#')[0].split('?')[0];
    // Follow any redirect rules before touching the file system. Rules can chain
    // (and can cycle), so cap how many hops we take.
    if (redirects.length > 0) {
        let hops = 0;
        while (cleanHref.startsWith('/')) {
            const redirectRule = findRedirectRule(cleanHref, redirects);
            if (!redirectRule) {
                break;
            }
            if (++hops > MAX_REDIRECT_DEPTH) {
                return {
                    ...link,
                    error: `Redirect loop: more than ${MAX_REDIRECT_DEPTH} redirects followed from ${href}`,
                    reason: 'invalid'
                };
            }
            const redirectTarget = applyRedirectRule(cleanHref, redirectRule);
            // Redirect target is external, consider the original link valid
            if (!redirectTarget.startsWith('/')) {
                return null;
            }
            cleanHref = redirectTarget.split('#')[0].split('?')[0];
        }
    }
    // Convert to file system path
    let filePath;
    if (cleanHref.startsWith('/')) {
        // Root-relative path
        filePath = join(buildDir, cleanHref.substring(1));
    }
    else {
        // Relative path
        const sourceDir = dirname(join(buildDir, relative(buildDir, link.sourceFile)));
        filePath = resolve(sourceDir, cleanHref);
    }
    // Normalize path separators
    filePath = filePath.replace(/[/\\\\]/g, sep);
    // Validate path to prevent directory traversal attacks
    if (!validatePath(filePath, buildDir)) {
        return {
            ...link,
            error: 'Invalid path - outside build directory',
            reason: 'invalid'
        };
    }
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
    }
    catch {
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
async function checkExternalLink(link, timeout = 5000) {
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
    }
    catch (error) {
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
 * Get all files in a directory recursively that match the include patterns
 */
async function getHtmlFiles(dir, include = ['**/*.html']) {
    const files = [];
    async function walk(currentDir) {
        const entries = await fs.readdir(currentDir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = join(currentDir, entry.name);
            if (entry.isDirectory()) {
                await walk(fullPath);
            }
            else if (entry.isFile()) {
                // Patterns are always written with posix separators
                const relativePath = relative(dir, fullPath).split(sep).join('/');
                if (include.some(pattern => matchesIncludePattern(relativePath, pattern))) {
                    files.push(fullPath);
                }
            }
        }
    }
    await walk(dir);
    return files;
}
/**
 * Check links in a single HTML file
 */
async function checkLinksInFile(filePath, buildDir, redirects, options) {
    const html = await fs.readFile(filePath, 'utf-8');
    const links = extractLinksFromHtml(html, filePath);
    const brokenLinks = [];
    // Process links concurrently in batches of 10
    const BATCH_SIZE = 10;
    for (let i = 0; i < links.length; i += BATCH_SIZE) {
        const batch = links.slice(i, i + BATCH_SIZE);
        const batchPromises = batch.map(async (link) => {
            // Skip excluded patterns
            if (options.exclude.some(pattern => matchesExcludePattern(link.href, pattern))) {
                return null;
            }
            if (link.type === 'external') {
                if (options.checkExternal) {
                    return await checkExternalLink(link, options.externalTimeout);
                }
            }
            else if (link.type === 'internal' || link.type === 'asset') {
                return await checkInternalLink(link, buildDir, redirects);
            }
            return null;
        });
        const batchResults = await Promise.all(batchPromises);
        brokenLinks.push(...batchResults.filter((result) => result !== null));
    }
    return { links, brokenLinks };
}
/**
 * Main function to check all links in the build directory
 */
export async function checkLinks(buildDir, options = {}) {
    const resolvedOptions = {
        checkExternal: false,
        failOnBrokenLinks: true,
        exclude: [],
        include: ['**/*.html'],
        externalTimeout: 5000,
        verbose: false,
        redirectsFile: undefined,
        ...options
    };
    const buildDirPath = typeof buildDir === 'string' ? buildDir : fileURLToPath(buildDir);
    // Load redirects from the specified file (if configured)
    const redirects = await loadRedirects(buildDirPath, resolvedOptions.redirectsFile);
    if (resolvedOptions.verbose && redirects.length > 0) {
        console.log(`📍 Loaded ${redirects.length} redirect rules from ${resolvedOptions.redirectsFile}`);
    }
    const htmlFiles = await getHtmlFiles(buildDirPath, resolvedOptions.include);
    const result = {
        totalLinks: 0,
        brokenLinks: [],
        checkedFiles: [],
        skippedFiles: []
    };
    // Process files concurrently in batches for better performance
    const FILE_BATCH_SIZE = 5; // Process 5 files at once
    for (let i = 0; i < htmlFiles.length; i += FILE_BATCH_SIZE) {
        const batch = htmlFiles.slice(i, i + FILE_BATCH_SIZE);
        const batchPromises = batch.map(async (filePath) => {
            try {
                const fileResult = await checkLinksInFile(filePath, buildDirPath, redirects, resolvedOptions);
                return {
                    success: true,
                    filePath,
                    links: fileResult.links,
                    brokenLinks: fileResult.brokenLinks
                };
            }
            catch (error) {
                return {
                    success: false,
                    filePath,
                    error: error instanceof Error ? error.message : String(error)
                };
            }
        });
        const batchResults = await Promise.all(batchPromises);
        // Process batch results
        for (const fileResult of batchResults) {
            if (fileResult.success) {
                result.totalLinks += fileResult.links.length;
                result.brokenLinks.push(...fileResult.brokenLinks);
                result.checkedFiles.push(relative(buildDirPath, fileResult.filePath));
                if (resolvedOptions.verbose) {
                    console.log(`Checked ${fileResult.links.length} links in ${relative(buildDirPath, fileResult.filePath)}`);
                }
            }
            else {
                result.skippedFiles.push(relative(buildDirPath, fileResult.filePath));
                if (resolvedOptions.verbose) {
                    console.warn(`Skipped ${relative(buildDirPath, fileResult.filePath)}: ${fileResult.error}`);
                }
            }
        }
    }
    return result;
}
