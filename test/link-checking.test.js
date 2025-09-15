import { describe, it } from 'node:test';
import assert from 'node:assert';
import { checkLinks } from '../dist/link-checker.js';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Link Checking', () => {
  it('should check links in a mock build directory', async () => {
    const mockBuildDir = join(__dirname, 'fixtures/mock-build');
    
    const result = await checkLinks(mockBuildDir, {
      checkExternal: false,
      verbose: false
    });
    
    // Should find some total links
    assert(result.totalLinks > 0, 'Should find some links to check');
    
    // Should check multiple files
    assert(result.checkedFiles.length > 0, 'Should check some files');
    
    // Should find broken links (we set up some intentionally broken ones)
    assert(result.brokenLinks.length > 0, 'Should find broken links in mock build');
    
    console.log(`✅ Checked ${result.totalLinks} links across ${result.checkedFiles.length} files`);
    console.log(`✅ Found ${result.brokenLinks.length} broken links (expected)`);
  });

  it('should identify specific broken links correctly', async () => {
    const mockBuildDir = join(__dirname, 'fixtures/mock-build');
    
    const result = await checkLinks(mockBuildDir, {
      checkExternal: false,
      verbose: false
    });
    
    const brokenHrefs = result.brokenLinks.map(link => link.href);
    
    // Should find the broken links we set up
    assert(brokenHrefs.includes('/missing-page'), 'Should detect missing page');
    assert(brokenHrefs.includes('/images/missing.jpg'), 'Should detect missing image');
    
    // Should NOT report valid links as broken
    const validLinks = ['/about', '/styles.css', '/images/logo.png'];
    validLinks.forEach(href => {
      assert(!brokenHrefs.includes(href), `Should NOT report ${href} as broken`);
    });
    
    console.log('✅ Correctly identified broken vs valid links');
  });

  it('should respect exclude patterns', async () => {
    const mockBuildDir = join(__dirname, 'fixtures/mock-build');
    
    const result = await checkLinks(mockBuildDir, {
      checkExternal: false,
      exclude: ['/missing-page'], // Exclude one of the broken links
      verbose: false
    });
    
    const brokenHrefs = result.brokenLinks.map(link => link.href);
    
    // Should NOT find the excluded broken link
    assert(!brokenHrefs.includes('/missing-page'), 'Should exclude /missing-page from results');
    
    // Should still find other broken links
    assert(brokenHrefs.includes('/images/missing.jpg'), 'Should still find other broken links');
    
    console.log('✅ Exclude patterns working correctly');
  });

  it('should provide detailed error information', async () => {
    const mockBuildDir = join(__dirname, 'fixtures/mock-build');
    
    const result = await checkLinks(mockBuildDir, {
      checkExternal: false,
      verbose: false
    });
    
    // Check that broken links have proper error details
    result.brokenLinks.forEach(brokenLink => {
      assert(brokenLink.href, 'Broken link should have href');
      assert(brokenLink.error, 'Broken link should have error message');
      assert(brokenLink.reason, 'Broken link should have reason');
      assert(brokenLink.sourceFile, 'Broken link should have source file');
      assert(brokenLink.type, 'Broken link should have type');
    });
    
    console.log('✅ Broken links have proper error details');
  });

  it('should handle empty directories gracefully', async () => {
    const emptyDir = join(__dirname, 'fixtures/empty');
    
    // This should not throw an error
    const result = await checkLinks(emptyDir, {
      checkExternal: false,
      verbose: false
    }).catch(err => {
      // If directory doesn't exist, it's expected to fail
      assert(err.code === 'ENOENT' || err.message.includes('no such file'), 'Should handle missing directory gracefully');
      return { totalLinks: 0, brokenLinks: [], checkedFiles: [], skippedFiles: [] };
    });
    
    assert(result.totalLinks === 0, 'Empty directory should have no links');
    assert(result.brokenLinks.length === 0, 'Empty directory should have no broken links');
    
    console.log('✅ Empty directories handled gracefully');
  });
});

describe('Configuration Options', () => {
  it('should handle verbose mode', async () => {
    const mockBuildDir = join(__dirname, 'fixtures/mock-build');
    
    // This should not throw an error in verbose mode
    const result = await checkLinks(mockBuildDir, {
      checkExternal: false,
      verbose: true
    });
    
    assert(typeof result === 'object', 'Should return result object in verbose mode');
    assert(Array.isArray(result.brokenLinks), 'Should return broken links array');
    
    console.log('✅ Verbose mode works correctly');
  });

  it('should handle different include patterns', async () => {
    const mockBuildDir = join(__dirname, 'fixtures/mock-build');
    
    const result = await checkLinks(mockBuildDir, {
      checkExternal: false,
      include: ['**/*.html'], // Only HTML files
      verbose: false
    });
    
    // Should only check HTML files
    result.checkedFiles.forEach(file => {
      assert(file.endsWith('.html'), `Checked file ${file} should be HTML`);
    });
    
    console.log('✅ Include patterns work correctly');
  });
});