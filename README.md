# 🔗 Astro Link Checker

**Never deploy a site with broken links again!** 🚀

Automatically detects broken links during your Astro build process with **security-hardened validation** and **high-performance concurrent processing**.

[![GitHub](https://img.shields.io/github/license/rodgtr1/astro-link-checker)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/rodgtr1/astro-link-checker)](https://github.com/rodgtr1/astro-link-checker/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/rodgtr1/astro-link-checker)](https://github.com/rodgtr1/astro-link-checker/issues)

## 🚀 Quick Start (GitHub Installation)

**Step 1: Install directly from GitHub**
```bash
npm install github:rodgtr1/astro-link-checker
```

**Step 2: Add to your Astro config**
```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import linkChecker from 'astro-link-checker';

export default defineConfig({
  integrations: [
    linkChecker()  // ← Add this line
  ],
});
```

**Step 3: Build and check**
```bash
npm run build  # Link checking runs automatically!
```

> **💡 Pro tip**: Works with any Astro project - no additional setup required!

## 🔧 Requirements

- **Node.js** 18+ 
- **Astro** 4.0+
- **Git** (for GitHub installation)

## ✨ Key Features
✅ **Path Traversal Protection** - Secure validation prevents malicious link attacks  
✅ **High Performance** - Concurrent processing up to 10x faster than sequential  
✅ **Zero Configuration** - Works out of the box with sensible defaults  
✅ **Beautiful Output** - Color-coded error reports with exact locations  
✅ **CI/CD Ready** - Perfect for GitHub Actions and automated builds  
✅ **TypeScript Support** - Full type definitions included  
✅ **Comprehensive Checking** - Internal links, assets, responsive images, and more  

## 📦 Installation Options

Since this package isn't published to NPM yet, install directly from GitHub:

### ✅ Recommended (GitHub shorthand)
```bash
npm install github:rodgtr1/astro-link-checker
```

### Alternative methods
```bash
# Full GitHub URL
npm install git+https://github.com/rodgtr1/astro-link-checker.git

# Specific branch or tag
npm install github:rodgtr1/astro-link-checker#main
npm install github:rodgtr1/astro-link-checker#v1.0.0
```

## ✅ Verify Installation

After installing and configuring, verify it's working:

1. **Check your `package.json`** - You should see `astro-link-checker` listed in dependencies
2. **Run a build** - `npm run build` should show "🔗 Checking links..." in the output
3. **Test with a broken link** - Add `<a href="/nonexistent">Test</a>` to any page and rebuild

You should see something like:
```bash
❌ Found 1 broken links:
📄 index.html:
  🔗 /nonexistent
    File not found: nonexistent
```

## 🎯 What It Does

✅ **Internal page links**: `/about`, `./contact.html`, `../index.html`  
✅ **Asset references**: `/images/logo.png`, `/styles.css`, `/script.js`  
✅ **External links** (optional): `https://example.com`  
✅ **Responsive images**: All URLs in `srcset` attributes  
✅ **Multiple HTML elements**: `<a>`, `<img>`, `<script>`, `<link>`, `<iframe>`, etc.  
✅ **Beautiful error output** showing exactly what's broken  
✅ **Configurable build failure** on broken links

## 📖 Example Output

When you run `npm run build`, you'll see:

```bash
🔗 Checking links...
✅ Checked 23 links across 4 files
🎉 No broken links found!
```

Or if there are issues:

```bash
❌ Found 2 broken links:

📄 about/index.html:
  🔗 /missing-page
    File not found: missing-page
    Text: "Click here"
  📦 /images/logo.png
    File not found: images/logo.png

Build failed: Found 2 broken links
```

## ⚙️ Configuration Options

| Option | Type | Default | Description | When to Use |
|--------|------|---------|-------------|-------------|
| `checkExternal` | `boolean` | `false` | Enable checking of external HTTP(S) links | Production builds, comprehensive testing |
| `failOnBrokenLinks` | `boolean` | `true` | Whether to fail the build when broken links are found | CI/CD pipelines, production deploys |
| `exclude` | `string[]` | `[]` | Patterns to exclude from link checking | Skip admin areas, APIs, external CDNs |
| `include` | `string[]` | `['**/*.html']` | File patterns to include in link checking | Custom build outputs, specific directories |
| `externalTimeout` | `number` | `5000` | Timeout in milliseconds for external link requests | Slow networks, comprehensive external checking |
| `verbose` | `boolean` | `false` | Show detailed logging information | Debugging, development, progress monitoring |
| `base` | `string` | `undefined` | Base URL for resolving relative links | Multi-domain sites, absolute URL validation |
| `redirectsFile` | `string` | `undefined` | Path to redirects file (e.g., '_redirects', 'vercel.json') | Netlify/Vercel deployments with redirects |

## 🛠️ Usage Examples

### Basic Setup
```javascript
linkChecker()
```

### Development Mode (Fast & Forgiving)
```javascript
linkChecker({
  checkExternal: false,        // Skip external links
  failOnBrokenLinks: false,    // Don't fail dev builds
  verbose: true,               // Show progress
})
```

### Production Mode (Comprehensive & Strict)
```javascript
linkChecker({
  checkExternal: true,         // Check everything
  externalTimeout: 10000,      // Give external links time
  failOnBrokenLinks: true,     // Fail if problems found
  verbose: false,              // Keep logs clean in CI
})
```

### Large Sites (With Exclusions)
```javascript
linkChecker({
  exclude: [
    '/admin/*',                    // Skip admin pages
    '/drafts/*',                   // Skip draft content
    'https://analytics.google.com/*', // Skip tracking scripts
    'https://cdn.jsdelivr.net/*',     // CDN links are reliable
    '*.pdf',                       // PDFs might move
    '/api/*',                      // API endpoints
  ]
})
```

### Complete Configuration (All Options)
```javascript
// astro.config.mjs - Showing ALL available options
import { defineConfig } from 'astro/config';
import linkChecker from 'astro-link-checker';

export default defineConfig({
  integrations: [
    linkChecker({
      // External link checking
      checkExternal: false,            // Enable/disable external link checking
      externalTimeout: 5000,           // Timeout for external requests (ms)
      
      // Build behavior
      failOnBrokenLinks: true,         // Fail build on broken links
      verbose: false,                  // Show detailed progress
      
      // File inclusion/exclusion
      include: ['**/*.html'],          // File patterns to check
      exclude: [                       // Patterns to exclude
        '/admin/*',                    // Skip admin pages
        '/api/*',                      // Skip API routes
        '*.pdf',                       // Skip PDFs
        'https://analytics.google.com/*' // Skip tracking
      ],
      
      // Advanced options
      base: 'https://mysite.com',      // Base URL for relative links
      redirectsFile: '_redirects'      // Path to redirects file (Netlify/Vercel)
    })
  ],
});
```

### TypeScript Configuration
```typescript
// astro.config.mts - With full TypeScript support
import { defineConfig } from 'astro/config';
import linkChecker, { type LinkCheckerOptions } from 'astro-link-checker';

const linkCheckerConfig: LinkCheckerOptions = {
  checkExternal: false,
  verbose: true,
  exclude: ['/admin/*'],
};

export default defineConfig({
  integrations: [
    linkChecker(linkCheckerConfig)
  ],
});
```

### Real-World Integration
```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import linkChecker from 'astro-link-checker';

export default defineConfig({
  site: 'https://myblog.com',
  integrations: [
    mdx(),
    sitemap(),
    linkChecker({
      checkExternal: false,           // Skip external links for speed
      verbose: true,                  // Show progress
      exclude: ['/admin/*'],          // Skip admin pages
    })
  ],
});
```

### Redirects Support

If your site uses redirects (Netlify, Vercel, etc.), you can configure the link checker to respect them:

```javascript
// For Netlify _redirects file
linkChecker({
  redirectsFile: '_redirects'  // Path relative to build directory
})

// For Vercel redirects or custom location
linkChecker({
  redirectsFile: '/path/to/redirects.json'  // Absolute path
})
```

**Example `_redirects` file (Netlify format):**
```
/old-page /new-page 301
/blog/:slug /posts/:slug 301
/api/* https://api.example.com/v1/* 200
```

This prevents false positives when links are redirected rather than broken.

## 🚀 CI/CD Integration

Perfect for GitHub Actions:

```yaml
name: Build and Check Links
on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build  # Link checking runs automatically!
```

## 🔍 What Gets Checked

### ✅ Checked
- **Internal page links**: `/about`, `./contact.html`, `../index.html`
- **Asset references**: `/images/logo.png`, `/styles.css`, `/script.js`
- **External links** (when enabled): `https://example.com`
- **Responsive images**: All URLs in `srcset` attributes
- **Multiple elements**: `<a>`, `<img>`, `<script>`, `<link>`, `<iframe>`, etc.

### ❌ Skipped
- **JavaScript URLs**: `javascript:void(0)`
- **Email/phone links**: `mailto:`, `tel:`
- **Data URLs**: `data:image/png;base64,...`
- **Blob URLs**: `blob:https://example.com/...`

## 🆘 Troubleshooting

### 🔧 Installation Issues
- **"Package not found"?** Make sure you're using `github:rodgtr1/astro-link-checker` (not `astro-link-checker`)
- **Git authentication errors?** Ensure you have Git installed and GitHub access
- **Build failures during install?** Check you have Node.js 18+ and npm/yarn latest version

### 🔍 Link Checking Issues
- **Too many false positives?** Add URLs to `exclude` array
- **Build too slow?** Set `checkExternal: false` 
- **Want more details?** Set `verbose: true`
- **Path traversal errors?** This is a security feature - check your links for `../` patterns
- **CI/CD failing?** Ensure the build directory exists before link checking runs

## 💻 Programmatic Usage

```javascript
import { checkLinks } from 'astro-link-checker';

const result = await checkLinks('./dist', {
  checkExternal: true,
  verbose: true
});

console.log(`Found ${result.brokenLinks.length} broken links`);
```

## 🧪 Testing Your Setup

Create a test page with broken links:

```astro
---
// src/pages/test.astro
---
<html>
<body>
  <h1>Test Page</h1>
  <a href="/missing-page">This link is broken</a>
  <img src="/missing-image.jpg" alt="Missing image" />
</body>
</html>
```

Run `npm run build` and see the broken links detected!

## 🔄 Updating

To get the latest version:
```bash
npm update astro-link-checker
```

Or reinstall from GitHub:
```bash
npm uninstall astro-link-checker
npm install github:rodgtr1/astro-link-checker
```

## ✨ Why GitHub Installation?

✅ **No NPM account needed** - Install directly from source  
✅ **Always up-to-date** - Get the latest features and security fixes  
✅ **Works immediately** - No waiting for NPM publishing  
✅ **Full functionality** - All features work exactly the same  
✅ **Automatic building** - TypeScript compiles on installation  
✅ **Security hardened** - Latest path traversal protection included

## 🏗️ How It Works

1. **Build Hook**: Uses Astro's `astro:build:done` hook to run after your site is built
2. **HTML Parsing**: Scans all HTML files in the output directory using Cheerio
3. **Link Extraction**: Finds all `href` and `src` attributes from relevant HTML elements
4. **Validation**: Checks internal links against the file system and optionally validates external links via HTTP requests
5. **Reporting**: Provides detailed, colored output showing exactly which links are broken and why

## 📝 License

MIT License - see the [LICENSE](LICENSE) file for details.

---

Made with ❤️ for the Astro community