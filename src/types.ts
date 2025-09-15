export interface LinkCheckerOptions {
  /**
   * Whether to check external links (default: false)
   */
  checkExternal?: boolean;

  /**
   * Whether to fail the build on broken links (default: true)
   */
  failOnBrokenLinks?: boolean;

  /**
   * Patterns to exclude from link checking
   */
  exclude?: string[];

  /**
   * Include patterns for files to check (default: ['** /*.html'])
   */
  include?: string[];

  /**
   * Timeout for external link checking in milliseconds (default: 5000)
   */
  externalTimeout?: number;

  /**
   * Whether to show verbose output (default: false)
   */
  verbose?: boolean;

  /**
   * Base URL for resolving relative links
   */
  base?: string;

  /**
   * Path to redirects file (relative to build directory or absolute path)
   * When provided, the checker will respect redirect rules before marking links as broken
   * Common formats: '_redirects' (Netlify), 'vercel.json', 'netlify.toml'
   */
  redirectsFile?: string;
}

export interface Link {
  href: string;
  text: string;
  line?: number;
  column?: number;
  sourceFile: string;
  type: 'internal' | 'external' | 'asset' | 'anchor';
}

export interface BrokenLink extends Link {
  error: string;
  reason: 'not-found' | 'network-error' | 'timeout' | 'invalid';
}

export interface LinkCheckResult {
  totalLinks: number;
  brokenLinks: BrokenLink[];
  checkedFiles: string[];
  skippedFiles: string[];
}