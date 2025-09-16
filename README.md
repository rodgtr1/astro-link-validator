# 🔗 Astro Link Validator

Automatically validates links during your Astro build process with **security-hardened validation** and **high-performance concurrent processing**.

[![GitHub](https://img.shields.io/github/license/rodgtr1/astro-link-validator)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/rodgtr1/astro-link-validator)](https://github.com/rodgtr1/astro-link-validator/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/rodgtr1/astro-link-validator)](https://github.com/rodgtr1/astro-link-validator/issues)

## 🚀 Quick Start (GitHub Installation)

**Step 1: Install directly from GitHub**
```bash
# Recommended
npm install github:rodgtr1/astro-link-validator

# Alternative methods
npm install git+https://github.com/rodgtr1/astro-link-validator.git
npm install github:rodgtr1/astro-link-validator#v1.0.0  # Specific version
```

> **📝 Note**: This package includes pre-built JavaScript files (committed `dist/` folder) to ensure immediate compatibility when installed from GitHub. No build step required!
> 
> **🔄 Updates**: When updating the package, you may need to clear your node_modules and reinstall:
> ```bash
> npm uninstall astro-link-validator
> npm install github:rodgtr1/astro-link-validator
> ```

**Step 2: Add to your Astro config**
```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import linkValidator from 'astro-link-validator';

export default defineConfig({
  integrations: [
    linkValidator()  // ← Add this line
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

> **TypeScript Support**: Full TypeScript definitions included, but TypeScript is **not required** to use this integration. Works perfectly with JavaScript-only projects.

## ✨ Key Features
✅ **Path Traversal Protection** - Secure validation prevents malicious link attacks  
✅ **High Performance** - Concurrent processing up to 10x faster than sequential  
✅ **Zero Configuration** - Works out of the box with sensible defaults  
✅ **Beautiful Output** - Color-coded error reports with exact locations  
✅ **CI/CD Ready** - Perfect for GitHub Actions and automated builds  
✅ **TypeScript Support** - Full type definitions included  
✅ **Comprehensive Checking** - Internal links, assets, responsive images, and more  


## ✅ Verify Installation

After installing and configuring, verify it's working:

1. **Check your `package.json`** - You should see `astro-link-validator` listed in dependencies
2. **Run a build** - `npm run build` should show "🔗 Checking links..." in the output
3. **Test with a broken link** - Add `<a href="/nonexistent">Test</a>` to any page and rebuild

You should see something like:
```bash
❌ Found 1 broken links:
📄 index.html:
  🔗 /nonexistent
    File not found: nonexistent
```

## 📚 Example Output

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
| `redirectsFile` | `string` | `undefined` | Path to redirects file (e.g., '_redirects', 'vercel.json') | Netlify/Cloudflare/Vercel deployments with redirects |

## 🛮️ Usage Examples

### Development vs Production
```javascript
// Development: Fast & forgiving
linkValidator({
  checkExternal: false,
  failOnBrokenLinks: false,
  verbose: true
})

// Production: Comprehensive & strict  
linkValidator({
  checkExternal: true,
  failOnBrokenLinks: true,
  exclude: ['/admin/*', '*.pdf']
})
```

### Complete Configuration (All Options)
```javascript
// astro.config.mjs - Showing ALL available options
import { defineConfig } from 'astro/config';
import linkChecker from 'astro-link-validator';

export default defineConfig({
  integrations: [
    linkValidator({
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
      redirectsFile: '_redirects'      // Path to redirects file (Netlify/Cloudflare/Vercel)
    })
  ],
});
```

### TypeScript Configuration
```typescript
// astro.config.mts - With full TypeScript support
import { defineConfig } from 'astro/config';
import linkChecker, { type LinkValidatorOptions } from 'astro-link-validator';

const linkCheckerConfig: LinkValidatorOptions = {
  checkExternal: false,
  verbose: true,
  exclude: ['/admin/*'],
};

export default defineConfig({
  integrations: [
    linkValidator(linkCheckerConfig)
  ],
});
```


### Redirects Support

If your site uses redirects (Netlify, Vercel, Cloudflare Pages, etc.), you can configure the link checker to respect them:

```javascript
// For Netlify _redirects file
linkValidator({
  redirectsFile: '_redirects'  // Path relative to build directory
})

// For Cloudflare Pages _redirects file (same format as Netlify)
linkValidator({
  redirectsFile: '_redirects'  // Cloudflare Pages uses same format
})

// For Vercel or custom location
linkValidator({
  redirectsFile: '/path/to/redirects.json'  // Absolute path
})
```

#### Platform-Specific Examples

**Netlify `_redirects` file:**
```
/old-page /new-page 301
/blog/:slug /posts/:slug 301
/api/* https://api.example.com/v1/* 200
/docs/* /documentation/:splat 301
```

**Cloudflare Pages `_redirects` file:**
```
# Same format as Netlify
/old-blog/* /blog/:splat 301
/admin /dashboard 302
/api/v1/* https://api.mysite.com/v1/:splat 200
```

**Vercel `vercel.json` redirects:**
```json
{
  "redirects": [
    {
      "source": "/old-page",
      "destination": "/new-page",
      "permanent": true
    }
  ]
}
```

> **Note**: Currently supports Netlify/Cloudflare `_redirects` format. Vercel JSON support coming soon.

This prevents false positives when links are redirected rather than broken.

## 🚀 CI/CD Integration

**Good news**: Since link checking runs automatically during `npm run build`, it works out-of-the-box with **all deployment platforms** (Netlify, Cloudflare Pages, Vercel, etc.). No special configuration needed! 🎉

### 🔍 When CI/CD Configuration Matters

**1. Build Failure Control**
```javascript
// Development: Don't fail builds on broken links
linkValidator({
  failOnBrokenLinks: false  // Let builds succeed for previews
})

// Production: Fail builds to prevent broken deployments
linkValidator({
  failOnBrokenLinks: true   // Block deployment if links are broken
})
```

**2. Environment-Specific Checking**
```javascript
// Different configs for different environments
linkValidator({
  checkExternal: process.env.NODE_ENV === 'production',
  verbose: process.env.NODE_ENV === 'development',
  exclude: process.env.NODE_ENV === 'production' 
    ? ['/admin/*', '/drafts/*']  // Production: exclude more
    : ['/admin/*']               // Development: minimal exclusions
})
```

**3. Pull Request vs Main Branch**
```yaml
# GitHub Actions example for different branch behavior
- name: Build with link checking
  run: npm run build
  env:
    # Strict checking on main, lenient on PRs
    LINK_CHECK_MODE: ${{ github.ref == 'refs/heads/main' && 'strict' || 'lenient' }}
```

**4. Large Site Optimization**
```javascript
// Skip external links in CI for speed, but check locally
linkValidator({
  checkExternal: !process.env.CI,  // Only check external links locally
  verbose: !!process.env.CI        // Verbose in CI for debugging
})
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
- **"Package not found"?** Make sure you're using `github:rodgtr1/astro-link-validator` (not `astro-link-validator`)
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
import { checkLinks } from 'astro-link-validator';

const result = await checkLinks('./dist', {
  checkExternal: true,
  verbose: true
});

console.log(`Found ${result.brokenLinks.length} broken links`);
```


## 🔄 Updating

To get the latest version:
```bash
npm update astro-link-validator
```

Or reinstall from GitHub:
```bash
npm uninstall astro-link-validator
npm install github:rodgtr1/astro-link-validator
```


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