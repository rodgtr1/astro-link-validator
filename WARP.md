# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

### Build and Test
- **Build**: `npm run build` - Compiles TypeScript to JavaScript in `dist/`
- **Development**: `npm run dev` - Watch mode compilation with TypeScript
- **Test**: `npm test` - Run all tests using Node.js built-in test runner
- **Test Watch**: `npm run test:watch` - Run tests in watch mode
- **Test Coverage**: `npm run test:coverage` - Run tests with c8 coverage reporting
- **Package**: `npm run prepack` - Builds and tests before packaging (runs automatically on `npm pack`)

### Single Test Execution
- Run specific test file: `node --test test/[filename].test.js`
- Run with isolation: `node --test --experimental-test-isolation=none test/[filename].test.js`

## Architecture Overview

This is an **Astro integration** that checks for broken links during the build process. The architecture follows a modular design with clear separation of concerns:

### Core Components

**Main Integration (`src/index.ts`)**
- Implements the Astro integration interface using the `astro:build:done` hook
- Handles error reporting with colored output and proper exit codes
- Manages configuration options and build failure logic

**Link Checker Engine (`src/link-checker.ts`)**
- Core link detection and validation logic
- Uses Cheerio for HTML parsing to extract links from `href`, `src`, and `srcset` attributes
- Categorizes links into: internal, external, asset, anchor
- Handles srcset parsing for responsive images
- Validates internal links against the filesystem and external links via HTTP

**Redirects Support (`src/redirects.ts`)**
- Parses redirect files (Netlify `_redirects` format)
- Pattern matching with wildcards (`*`) and parameters (`:lang`)
- Prevents false positives by checking redirect targets

**Type Definitions (`src/types.ts`)**
- Central type definitions for configuration options and data structures
- Exported for TypeScript users of the integration

### Link Processing Flow

1. **HTML Discovery**: Scans build output directory for HTML files
2. **Link Extraction**: Uses Cheerio to extract all links from HTML elements
3. **Link Categorization**: Classifies each link by type (internal/external/asset/anchor)
4. **Redirect Resolution**: Checks configured redirect rules before marking as broken
5. **Validation**: 
   - Internal links: Filesystem existence checks with fallbacks (.html, index.html)
   - External links: HTTP requests with configurable timeout (if enabled)
6. **Reporting**: Groups broken links by source file with detailed error information

### Test Structure

- `test/link-extraction.test.js` - Tests HTML parsing and link extraction
- `test/link-checking.test.js` - Tests link validation logic
- `test/astro-integration.test.js` - Tests integration hook behavior

The test suite uses Node.js built-in test runner and includes fixture HTML files for comprehensive testing.

## Development Notes

### TypeScript Configuration
- Targets ES2022 with ESNext modules and bundler resolution
- Outputs to `dist/` with declaration files for npm distribution
- Includes all files in `src/` directory

### Key Dependencies
- `cheerio` - Server-side jQuery-like HTML parsing
- `picocolors` - Lightweight terminal color output
- Peer dependency on `astro` ^4.0.0

### Package Distribution
- Main entry: `dist/index.js` (compiled from TypeScript)
- Exports types for TypeScript users
- Files included in npm package: only `dist/` directory
- Available on GitHub and will be published to npm

### External Link Handling
External link checking is disabled by default for performance. When enabled:
- Makes HTTP HEAD requests to validate links
- Respects `externalTimeout` configuration (default: 5000ms)
- Handles network errors gracefully with categorized error types

### Integration Pattern
Follows Astro's integration API pattern with proper hook usage and logger integration. The `astro:build:done` hook ensures link checking runs after the complete site build.