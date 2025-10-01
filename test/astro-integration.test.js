import { describe, it } from 'node:test';
import assert from 'node:assert';
import astroLinkChecker from '../dist/index.js';

describe('Astro Integration', () => {
  it('should export a function that returns an integration object', () => {
    const integration = astroLinkChecker();
    
    assert(typeof integration === 'object', 'Should return an object');
    assert(integration.name === 'astro-link-validator', 'Should have correct name');
    assert(typeof integration.hooks === 'object', 'Should have hooks object');
    assert(typeof integration.hooks['astro:build:done'] === 'function', 'Should have astro:build:done hook');
    
    console.log('✅ Integration object structure is correct');
  });

  it('should accept configuration options', () => {
    const options = {
      checkExternal: true,
      verbose: true,
      exclude: ['/admin/*']
    };
    
    const integration = astroLinkChecker(options);
    
    // Should still return valid integration
    assert(typeof integration === 'object', 'Should return an object with options');
    assert(integration.name === 'astro-link-validator', 'Should have correct name with options');
    
    console.log('✅ Configuration options accepted');
  });

  it('should work with empty options', () => {
    const integration = astroLinkChecker({});
    
    assert(typeof integration === 'object', 'Should work with empty options');
    assert(integration.name === 'astro-link-validator', 'Should have correct name with empty options');
    
    console.log('✅ Empty options handled correctly');
  });

  it('should work with no options', () => {
    const integration = astroLinkChecker();
    
    assert(typeof integration === 'object', 'Should work with no options');
    assert(integration.name === 'astro-link-validator', 'Should have correct name with no options');
    
    console.log('✅ No options handled correctly');
  });

  it('should export utility functions', async () => {
    // Dynamic import to test named exports
    const module = await import('../dist/index.js');
    
    assert(typeof module.checkLinks === 'function', 'Should export checkLinks function');
    assert(typeof module.extractLinksFromHtml === 'function', 'Should export extractLinksFromHtml function');
    
    console.log('✅ Utility functions exported correctly');
  });
});