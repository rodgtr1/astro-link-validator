import { describe, it } from 'node:test';
import assert from 'node:assert';
import { checkLinks } from '../dist/link-checker.js';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { promises as fs } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Performance Tests', () => {
  it('should process multiple files concurrently', async () => {
    // Create a test directory with multiple HTML files
    const testDir = join(__dirname, 'fixtures/performance-test');
    
    try {
      await fs.mkdir(testDir, { recursive: true });
      
      // Create multiple HTML files to test concurrent processing
      const fileCount = 10;
      const promises = [];
      
      for (let i = 0; i < fileCount; i++) {
        const html = `
          <!DOCTYPE html>
          <html>
          <head><title>Test File ${i}</title></head>
          <body>
            <a href="/page-${i}">Link ${i}</a>
            <a href="/missing-${i}">Missing Link ${i}</a>
            <img src="/image-${i}.png" alt="Image ${i}">
            <script src="/script-${i}.js"></script>
          </body>
          </html>
        `;
        
        promises.push(fs.writeFile(join(testDir, `page-${i}.html`), html));
      }
      
      await Promise.all(promises);
      
      // Measure processing time
      const startTime = Date.now();
      
      const result = await checkLinks(testDir, {
        checkExternal: false,
        verbose: false
      });
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      // Verify results
      assert.strictEqual(result.checkedFiles.length, fileCount, `Should process all ${fileCount} files`);
      assert(result.totalLinks > 0, 'Should find links in the files');
      assert(result.brokenLinks.length > 0, 'Should find broken links as expected');
      
      // Performance check - should complete reasonably quickly due to concurrent processing
      console.log(`✅ Processed ${fileCount} files with ${result.totalLinks} links in ${processingTime}ms`);
      console.log(`✅ Found ${result.brokenLinks.length} broken links`);
      console.log(`✅ Average: ${(processingTime / fileCount).toFixed(2)}ms per file`);
      
      // The concurrent processing should be significantly faster than sequential
      // For 10 files, even with overhead, it should complete in under 2 seconds
      assert(processingTime < 2000, `Processing should be fast with concurrency, took ${processingTime}ms`);
      
    } finally {
      // Cleanup
      try {
        await fs.rm(testDir, { recursive: true, force: true });
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  it('should handle concurrent processing errors gracefully', async () => {
    // Create a test directory with some problematic files
    const testDir = join(__dirname, 'fixtures/performance-error-test');
    
    try {
      await fs.mkdir(testDir, { recursive: true });
      
      // Create a mix of valid and invalid HTML files
      const validHtml = '<html><body><a href="/valid">Valid</a></body></html>';
      const invalidHtml = '<html><body><!-- This has a malformed link: <a href="/test';
      
      await fs.writeFile(join(testDir, 'valid1.html'), validHtml);
      await fs.writeFile(join(testDir, 'valid2.html'), validHtml);
      await fs.writeFile(join(testDir, 'invalid.html'), invalidHtml);
      
      const result = await checkLinks(testDir, {
        checkExternal: false,
        verbose: false
      });
      
      // Should process valid files and skip/handle problematic ones
      assert(result.checkedFiles.length >= 2, 'Should process valid files');
      console.log(`✅ Processed ${result.checkedFiles.length} valid files`);
      console.log(`✅ Skipped ${result.skippedFiles.length} problematic files`);
      
    } finally {
      // Cleanup
      try {
        await fs.rm(testDir, { recursive: true, force: true });
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });
});