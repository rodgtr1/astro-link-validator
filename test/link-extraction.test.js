import { describe, it } from 'node:test';
import assert from 'node:assert';
import { promises as fs } from 'node:fs';
import { extractLinksFromHtml } from '../dist/link-checker.js';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Link Extraction', () => {
  it('should extract all types of links from HTML', async () => {
    const htmlPath = join(__dirname, 'fixtures/sample.html');
    const html = await fs.readFile(htmlPath, 'utf-8');
    const links = extractLinksFromHtml(html, '/test/page.html');
    
    // Should find multiple links
    assert(links.length > 0, 'Should extract some links');
    
    // Check for different link types
    const linkHrefs = links.map(link => link.href);
    
    // Internal page links
    assert(linkHrefs.includes('/'), 'Should find home link');
    assert(linkHrefs.includes('/about'), 'Should find about link');
    assert(linkHrefs.includes('/contact.html'), 'Should find contact link');
    
    // Asset links
    assert(linkHrefs.includes('/styles.css'), 'Should find CSS link');
    assert(linkHrefs.includes('/images/logo.png'), 'Should find image link');
    assert(linkHrefs.includes('/js/main.js'), 'Should find script link');
    
    // External links
    assert(linkHrefs.includes('https://example.com'), 'Should find external link');
    assert(linkHrefs.includes('https://cdn.example.com/lib.js'), 'Should find external script');
    
    console.log(`✅ Extracted ${links.length} links from HTML`);
  });

  it('should categorize links correctly', async () => {
    const htmlPath = join(__dirname, 'fixtures/sample.html');
    const html = await fs.readFile(htmlPath, 'utf-8');
    const links = extractLinksFromHtml(html, '/test/page.html');
    
    const linkTypes = {
      internal: links.filter(link => link.type === 'internal'),
      external: links.filter(link => link.type === 'external'),
      asset: links.filter(link => link.type === 'asset'),
      anchor: links.filter(link => link.type === 'anchor')
    };
    
    // Should have internal links
    assert(linkTypes.internal.length > 0, 'Should categorize internal links');
    
    // Should have external links
    assert(linkTypes.external.length > 0, 'Should categorize external links');
    
    // Should have asset links
    assert(linkTypes.asset.length > 0, 'Should categorize asset links');
    
    // Should have anchor links
    assert(linkTypes.anchor.length > 0, 'Should categorize anchor links');
    
    console.log(`✅ Link categorization: ${linkTypes.internal.length} internal, ${linkTypes.external.length} external, ${linkTypes.asset.length} assets, ${linkTypes.anchor.length} anchors`);
  });

  it('should ignore special link types', async () => {
    const htmlPath = join(__dirname, 'fixtures/sample.html');
    const html = await fs.readFile(htmlPath, 'utf-8');
    const links = extractLinksFromHtml(html, '/test/page.html');
    
    const linkHrefs = links.map(link => link.href);
    
    // Should NOT include these special links
    assert(!linkHrefs.includes('mailto:test@example.com'), 'Should ignore mailto links');
    assert(!linkHrefs.includes('tel:+1234567890'), 'Should ignore tel links');
    assert(!linkHrefs.includes('javascript:void(0)'), 'Should ignore javascript links');
    
    // Should NOT include data URLs
    const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    assert(!linkHrefs.includes(dataUrl), 'Should ignore data URLs');
    
    console.log('✅ Special link types properly ignored');
  });

  it('should extract srcset URLs', async () => {
    const htmlPath = join(__dirname, 'fixtures/sample.html');
    const html = await fs.readFile(htmlPath, 'utf-8');
    const links = extractLinksFromHtml(html, '/test/page.html');
    
    const linkHrefs = links.map(link => link.href);
    
    // Should extract individual URLs from srcset
    assert(linkHrefs.includes('/images/small.jpg'), 'Should extract small image from srcset');
    assert(linkHrefs.includes('/images/large.jpg'), 'Should extract large image from srcset');
    
    console.log('✅ Srcset URLs properly extracted');
  });
});