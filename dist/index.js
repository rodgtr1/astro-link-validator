import { fileURLToPath } from 'node:url';
import { relative } from 'node:path';
import { checkLinks } from './link-checker.js';
import pc from 'picocolors';
/**
 * Creates the Astro Link Validator integration
 */
export default function linkValidator(options = {}) {
    return {
        name: 'astro-link-validator',
        hooks: {
            'astro:build:done': async ({ dir, logger }) => {
                logger.info('🔗 Validating links...');
                try {
                    const buildDir = fileURLToPath(dir);
                    const result = await checkLinks(buildDir, options);
                    // Log summary
                    logger.info(`✅ Checked ${result.totalLinks} links across ${result.checkedFiles.length} files`);
                    if (result.skippedFiles.length > 0) {
                        logger.warn(`⚠️  Skipped ${result.skippedFiles.length} files`);
                        if (options.verbose) {
                            result.skippedFiles.forEach(file => {
                                logger.warn(`   - ${file}`);
                            });
                        }
                    }
                    // Report broken links
                    if (result.brokenLinks.length > 0) {
                        logger.error(`❌ Found ${result.brokenLinks.length} broken links:`);
                        // Group broken links by file
                        const brokenLinksByFile = result.brokenLinks.reduce((acc, link) => {
                            const file = relative(buildDir, link.sourceFile);
                            if (!acc[file])
                                acc[file] = [];
                            acc[file].push(link);
                            return acc;
                        }, {});
                        // Display broken links grouped by file
                        for (const [file, links] of Object.entries(brokenLinksByFile)) {
                            console.log(`\\n${pc.red('📄 ' + file)}:`);
                            links.forEach(link => {
                                const typeIcon = getTypeIcon(link.type);
                                const reasonColor = getReasonColor(link.reason);
                                console.log(`  ${typeIcon} ${pc.cyan(link.href)}`);
                                console.log(`    ${reasonColor(link.error)}`);
                                if (link.text && link.text !== link.href) {
                                    console.log(`    Text: "${pc.dim(link.text)}"`);
                                }
                            });
                        }
                        // Fail build if configured to do so
                        if (options.failOnBrokenLinks !== false) {
                            throw new Error(`Build failed: Found ${result.brokenLinks.length} broken links`);
                        }
                        else {
                            logger.warn(`⚠️  Build continued with ${result.brokenLinks.length} broken links`);
                        }
                    }
                    else {
                        logger.info('🎉 No broken links found!');
                    }
                }
                catch (error) {
                    if (error instanceof Error) {
                        logger.error(`💥 Link validation failed: ${error.message}`);
                        if (options.failOnBrokenLinks !== false) {
                            throw error;
                        }
                    }
                    else {
                        logger.error('💥 Link validation failed with unknown error');
                        if (options.failOnBrokenLinks !== false) {
                            throw new Error('Link validation failed with unknown error');
                        }
                    }
                }
            }
        }
    };
}
/**
 * Get icon for link type
 */
function getTypeIcon(type) {
    switch (type) {
        case 'internal': return '🔗';
        case 'external': return '🌐';
        case 'asset': return '📦';
        case 'anchor': return '⚓';
        default: return '❓';
    }
}
/**
 * Get color function for reason
 */
function getReasonColor(reason) {
    switch (reason) {
        case 'not-found': return pc.red;
        case 'network-error': return pc.magenta;
        case 'timeout': return pc.yellow;
        case 'invalid': return pc.gray;
        default: return pc.red;
    }
}
// Export utilities for advanced users
export { checkLinks, extractLinksFromHtml } from './link-checker.js';
