import { describe, it } from 'node:test';
import assert from 'node:assert';
import { checkLinks } from '../dist/link-checker.js';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { promises as fs } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Security Tests', () => {
  it('should prevent path traversal attacks', async () => {
    // Create a temporary test directory with path traversal attempts
    const testDir = join(__dirname, 'fixtures/security-test');
    
    try {
      await fs.mkdir(testDir, { recursive: true });
      
      // Create HTML file with malicious links attempting path traversal
      const maliciousHtml = `
        <!DOCTYPE html>
        <html>
        <head><title>Security Test</title></head>
        <body>
          <!-- These should be blocked by our path validation -->
          <a href="../../../etc/passwd">Path Traversal 1</a>
          <a href="../../../../../../root/.ssh/id_rsa">Path Traversal 2</a>
          <img src="../../../etc/hosts" alt="Host file">
          <script src="../../../../bin/bash"></script>
          
          <!-- Valid internal links should still work -->
          <a href="/valid-page">Valid Page</a>
          <a href="./local-file.html">Local File</a>
        </body>
        </html>
      `;
      
      await fs.writeFile(join(testDir, 'index.html'), maliciousHtml);
      
      // Run link checker
      const result = await checkLinks(testDir, {
        checkExternal: false,
        verbose: false
      });
      
      // Check that path traversal attempts are marked as invalid
      const brokenLinks = result.brokenLinks;
      const invalidLinks = brokenLinks.filter(link => link.reason === 'invalid');
      
      // Should have blocked the path traversal attempts
      assert(invalidLinks.length >= 4, `Should block path traversal attempts, found ${invalidLinks.length} invalid links`);
      
      // Verify specific error message
      invalidLinks.forEach(link => {
        assert(link.error.includes('Invalid path - outside build directory'), 
               `Expected security error message, got: ${link.error}`);
      });
      
      console.log(`✅ Blocked ${invalidLinks.length} path traversal attempts`);
      
    } finally {
      // Cleanup
      try {
        await fs.rm(testDir, { recursive: true, force: true });
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  it('should allow valid relative paths within build directory', async () => {
    // Create a test with valid relative paths
    const testDir = join(__dirname, 'fixtures/security-valid');
    
    try {
      await fs.mkdir(testDir, { recursive: true });
      await fs.mkdir(join(testDir, 'subdir'), { recursive: true });
      
      // Create HTML with valid relative links
      const validHtml = `
        <!DOCTYPE html>
        <html>
        <head><title>Valid Paths Test</title></head>
        <body>
          <!-- These should be allowed -->
          <a href="./subdir/page.html">Subdirectory Page</a>
          <a href="../index.html">Parent Directory</a>
          <img src="/assets/image.png" alt="Root Asset">
          <script src="./scripts/app.js"></script>
        </body>
        </html>
      `;
      
      await fs.writeFile(join(testDir, 'subdir', 'index.html'), validHtml);
      
      // Create the referenced files so they're not marked as missing
      await fs.writeFile(join(testDir, 'index.html'), '<html><body>Root</body></html>');
      await fs.mkdir(join(testDir, 'assets'), { recursive: true });
      await fs.writeFile(join(testDir, 'assets', 'image.png'), 'fake-image');
      await fs.mkdir(join(testDir, 'subdir', 'scripts'), { recursive: true });
      await fs.writeFile(join(testDir, 'subdir', 'scripts', 'app.js'), 'console.log("test");');
      
      const result = await checkLinks(testDir, {
        checkExternal: false,
        verbose: false
      });
      
      // Should have no invalid path errors
      const invalidLinks = result.brokenLinks.filter(link => link.reason === 'invalid');
      assert.strictEqual(invalidLinks.length, 0, 
                        `Valid paths should not be blocked, found ${invalidLinks.length} invalid links`);
      
      console.log('✅ Valid relative paths are correctly allowed');
      
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