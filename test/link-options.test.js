import { describe, it } from 'node:test';
import assert from 'node:assert';
import { checkLinks } from '../dist/link-checker.js';
import linkValidator from '../dist/index.js';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const globBuildDir = join(__dirname, 'fixtures/glob-build');
const redirectBuildDir = join(__dirname, 'fixtures/redirect-build');
const mockBuildDir = join(__dirname, 'fixtures/mock-build');

const brokenHrefs = (result) => result.brokenLinks.map(link => link.href);

describe('Exclude Patterns', () => {
  it('should treat * as a wildcard matching any characters', async () => {
    const result = await checkLinks(globBuildDir, {
      checkExternal: false,
      exclude: ['/admin/*'],
      verbose: false
    });

    const hrefs = brokenHrefs(result);

    // Everything under /admin/ is excluded, at any depth
    assert(!hrefs.includes('/admin/users'), 'Should exclude /admin/users');
    assert(!hrefs.includes('/admin/settings/advanced'), 'Should exclude nested /admin/settings/advanced');

    // The pattern requires the trailing slash, so /admin itself is still checked
    assert(hrefs.includes('/admin'), 'Should NOT exclude /admin from a /admin/* pattern');

    // Unrelated broken links are untouched
    assert(hrefs.includes('/missing-page'), 'Should still report unrelated broken links');
    assert(hrefs.includes('/docs/manual.pdf'), 'Should still report links not matching the pattern');
  });

  it('should match a leading wildcard such as *.pdf', async () => {
    const result = await checkLinks(globBuildDir, {
      checkExternal: false,
      exclude: ['*.pdf'],
      verbose: false
    });

    const hrefs = brokenHrefs(result);

    assert(!hrefs.includes('/docs/manual.pdf'), 'Should exclude /docs/manual.pdf via *.pdf');
    assert(hrefs.includes('/missing-page'), 'Should still report non-pdf broken links');
  });

  it('should still match patterns without a wildcard as substrings', async () => {
    const result = await checkLinks(mockBuildDir, {
      checkExternal: false,
      exclude: ['/missing-page'],
      verbose: false
    });

    const hrefs = brokenHrefs(result);

    assert(!hrefs.includes('/missing-page'), 'Should exclude /missing-page');
    assert(hrefs.includes('/images/missing.jpg'), 'Should still find other broken links');
  });

  it('should not let a wildcard pattern match unrelated links', async () => {
    const result = await checkLinks(globBuildDir, {
      checkExternal: false,
      exclude: ['/nothing-matches-this/*'],
      verbose: false
    });

    const hrefs = brokenHrefs(result);

    assert(hrefs.includes('/admin/users'), 'Should report /admin/users when the pattern does not match');
    assert(hrefs.includes('/missing-page'), 'Should report /missing-page when the pattern does not match');
  });
});

describe('Include Patterns', () => {
  it('should check every HTML file with the default pattern', async () => {
    const result = await checkLinks(globBuildDir, {
      checkExternal: false,
      verbose: false
    });

    assert(result.checkedFiles.includes('index.html'), 'Should check the root index.html');
    assert(result.checkedFiles.some(f => f.endsWith('deep.html')), 'Should check the nested deep.html');
    assert(brokenHrefs(result).includes('/nested-missing'), 'Should find the nested broken link');
  });

  it('should only check files matching a narrower include pattern', async () => {
    const result = await checkLinks(globBuildDir, {
      checkExternal: false,
      include: ['nested/*.html'],
      verbose: false
    });

    assert.strictEqual(result.checkedFiles.length, 1, 'Should check exactly one file');
    assert(result.checkedFiles[0].endsWith('deep.html'), 'Should check only the nested file');

    const hrefs = brokenHrefs(result);
    assert(hrefs.includes('/nested-missing'), 'Should find the broken link in the included file');
    assert(!hrefs.includes('/missing-page'), 'Should NOT report links from the excluded root file');
  });

  it('should match a file path exactly when the pattern has no wildcard', async () => {
    const result = await checkLinks(globBuildDir, {
      checkExternal: false,
      include: ['index.html'],
      verbose: false
    });

    assert.deepStrictEqual(result.checkedFiles, ['index.html'], 'Should check only index.html');
    assert(!brokenHrefs(result).includes('/nested-missing'), 'Should NOT check the nested file');
  });

  it('should check nothing when no file matches the include pattern', async () => {
    const result = await checkLinks(globBuildDir, {
      checkExternal: false,
      include: ['**/*.xml'],
      verbose: false
    });

    assert.strictEqual(result.checkedFiles.length, 0, 'Should check no files');
    assert.strictEqual(result.totalLinks, 0, 'Should find no links');
  });
});

describe('Redirect Loops', () => {
  it('should report a redirect cycle as broken instead of recursing forever', async () => {
    const result = await checkLinks(redirectBuildDir, {
      checkExternal: false,
      redirectsFile: '_redirects',
      verbose: false
    });

    const loop = result.brokenLinks.find(link => link.href === '/loop-a');

    assert(loop, 'Should report /loop-a as broken');
    assert.strictEqual(loop.reason, 'invalid', 'Redirect loops should have reason "invalid"');
    assert(/redirect loop/i.test(loop.error), `Error should mention a redirect loop, got: ${loop.error}`);
  });

  it('should report a self-referencing redirect as broken', async () => {
    const result = await checkLinks(redirectBuildDir, {
      checkExternal: false,
      redirectsFile: '_redirects',
      verbose: false
    });

    const self = result.brokenLinks.find(link => link.href === '/self');

    assert(self, 'Should report /self as broken');
    assert.strictEqual(self.reason, 'invalid', 'Self-redirects should have reason "invalid"');
  });

  it('should still follow a redirect that resolves to a real page', async () => {
    const result = await checkLinks(redirectBuildDir, {
      checkExternal: false,
      redirectsFile: '_redirects',
      verbose: false
    });

    const hrefs = brokenHrefs(result);

    assert(!hrefs.includes('/old-page'), '/old-page redirects to a real page and should be valid');
    assert(!hrefs.includes('/real-page'), '/real-page exists and should be valid');
  });

  it('should report a redirect whose target does not exist', async () => {
    const result = await checkLinks(redirectBuildDir, {
      checkExternal: false,
      redirectsFile: '_redirects',
      verbose: false
    });

    const gone = result.brokenLinks.find(link => link.href === '/gone');

    assert(gone, 'Should report /gone as broken');
    assert.strictEqual(gone.reason, 'not-found', 'A missing redirect target should be reported as not-found');
  });
});

describe('Broken Link Output', () => {
  it('should print a real newline before each file heading', async () => {
    const integration = linkValidator({ failOnBrokenLinks: false });
    const logger = { info() {}, warn() {}, error() {} };

    const originalLog = console.log;
    const output = [];
    console.log = (...args) => output.push(args.join(' '));

    try {
      await integration.hooks['astro:build:done']({
        dir: pathToFileURL(join(mockBuildDir, '/')),
        logger
      });
    } finally {
      console.log = originalLog;
    }

    const heading = output.find(line => line.includes('index.html'));

    assert(heading, 'Should print a heading for the file containing broken links');
    assert(!heading.includes('\\n'), 'Heading should not contain a literal backslash-n');
    assert(heading.startsWith('\n'), 'Heading should start with a real newline');
  });
});
