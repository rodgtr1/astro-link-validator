# 🔗 Astro Link Checker

**Never deploy a site with broken links again!** 🚀

Automatically detects broken links during your Astro build process.

## 📦 Install

### From GitHub (Available Now)
```bash
npm install github:travisrodgers/astro-link-checker
```

### From NPM (Coming Soon)
```bash
npm install astro-link-checker
```

## ⚡ Quick Setup

Add one line to your `astro.config.mjs`:

```javascript
import { defineConfig } from 'astro/config';
import linkChecker from 'astro-link-checker';

export default defineConfig({
  integrations: [
    linkChecker()  // ← Add this line
  ],
});
```

That's it! Now `npm run build` will check for broken links.

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

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `checkExternal` | `boolean` | `false` | Enable checking of external HTTP(S) links |
| `failOnBrokenLinks` | `boolean` | `true` | Whether to fail the build when broken links are found |
| `exclude` | `string[]` | `[]` | Patterns to exclude from link checking |
| `include` | `string[]` | `['**/*.html']` | File patterns to include in link checking |
| `externalTimeout` | `number` | `5000` | Timeout in milliseconds for external link requests |
| `verbose` | `boolean` | `false` | Show detailed logging information |
| `base` | `string` | `undefined` | Base URL for resolving relative links |
| `redirectsFile` | `string` | `undefined` | Path to redirects file (e.g., '_redirects', 'vercel.json') |

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

- **Too many false positives?** Add URLs to `exclude` array
- **Build too slow?** Set `checkExternal: false` 
- **Want more details?** Set `verbose: true`

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
npm install github:travisrodgers/astro-link-checker
```

## ⚡ Installation Methods

### Method 1: GitHub URL (Recommended)
```bash
npm install github:travisrodgers/astro-link-checker
```

### Method 2: Full GitHub URL
```bash
npm install git+https://github.com/travisrodgers/astro-link-checker.git
```

### Method 3: Specific Branch/Tag
```bash
npm install github:travisrodgers/astro-link-checker#main
npm install github:travisrodgers/astro-link-checker#v1.0.0
```

## 🎉 Benefits of GitHub Installation

✅ **No NPM account needed** - Install directly from source  
✅ **Always up-to-date** - Get the latest code  
✅ **Works immediately** - No waiting for NPM publishing  
✅ **Full functionality** - All features work the same  
✅ **Automatic building** - Builds on installation via prepack  

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