# AGENTS.md - Developer Guidelines for gfwiki-scraper

This document contains coding conventions, commands, and guidelines for AI coding agents working in this repository.

---

## 1. Build, Lint, Test & Run Commands

This is a minimal Node.js JavaScript project with no build step, linting, or test framework configured.

### Available Scripts (from package.json):
| Command | Description |
|---------|-------------|
| `npm start` | Runs `node index.js` - starts the web scraper |
| `npm test` | **Unimplemented** - placeholder that exits with error |

### No Linting/Formatting Tools:
There are no ESLint, Prettier, or other code quality tools configured. Follow existing code patterns as documented below.

### No Build Process:
Code runs directly with Node.js - no compilation/transpilation required.

### How to Add Testing (if needed):
1. Install test framework: `npm install --save-dev jest`
2. Add scripts to package.json:
   ```json
   {
     "scripts": {
       "test": "jest",
       "test:watch": "jest --watch",
       "test:coverage": "jest --coverage"
     }
   }
   ```
3. Run single test: `npx jest path/to/test-file.test.js`

---

## 2. Code Style Guidelines

### General Conventions:
- **Language**: Pure JavaScript (no TypeScript)
- **Module System**: CommonJS (`require()`/`module.exports` - no ES modules)
- **Indentation**: 2 spaces (no tabs)
- **Quotes**: Single quotes for strings (`'example'` not `"example"`)
- **Line Endings**: LF (Unix-style)
- **Semicolons**: Required at end of statements
- **File Encoding**: UTF-8

### Naming Conventions:
- **Functions & Variables**: `camelCase` (e.g., `captureTDollList`, `writeSkinList2File`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRY_TIMES = 3`)
- **Classes & Constructor Functions**: `PascalCase`
- **Files**: Lowercase with no separators (e.g., `index.js`, `utils.js`, `worker.js`)
- **JSON Keys**: camelCase or snake_case as appropriate for data context

### Imports:
- Order imports:
  1. Built-in Node.js modules first (fs, path, os, etc.)
  2. Third-party dependencies (puppeteer, etc.)
  3. Local project modules (./utils, ./exit, etc.)
- One import per line
- No unused imports

### Commenting & Documentation:
- Use JSDoc comments for all functions to document parameters, return types, and purpose:
  ```javascript
  /**
   * @param browser {puppeteer.Browser}
   * @returns {Promise<Array<TDollItem>>}
   */
  const captureTDollList = async (browser) => { /* ... */ }
  ```
- Use `@typedef` for custom type definitions
- Add inline comments for non-obvious logic
- Keep comments concise and actionable

### Error Handling:
- Use `try/catch` blocks for all asynchronous operations
- Log errors with context: `console.log('Error description', error)`
- Implement retry logic for flaky operations (e.g., web scraping)
- Always handle promise rejections
- Never leave empty catch blocks

### Asynchronous Code:
- Prefer `async/await` over `.then()` chains
- Use `Promise.all()` for parallel operations when appropriate
- Always add appropriate timeouts for Puppeteer operations
- Clean up resources (browsers, pages, workers) in exit handlers

### Worker Threads:
- Use worker threads for CPU-intensive or blocking operations
- Communicate via JSON messages with `type` field for message routing
- Implement proper exit handling for all workers
- Share read-only data via workerData

### Data Handling:
- Use `JSON.stringify(data, null, 4)` for pretty-printed JSON output
- Merge existing data with new data when writing to files (don't overwrite blindly)
- Validate all incoming data from web pages before processing
- Use Maps for deduplication when appropriate

### Puppeteer Best Practices:
- Launch browser with appropriate flags for performance and stability:
  ```javascript
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage'
    ]
  });
  ```
- Block unnecessary resources (images, styles, scripts) when scraping to improve speed
- Set reasonable navigation timeouts (30-60 seconds)
- Always close pages and browsers when done
- Use request interception to optimize scraping

### Security:
- Never hardcode secrets or credentials
- Sanitize all user input and external data
- Use `--no-sandbox` flag only in controlled environments
- Follow gfwiki.org scraping etiquette (add delays if needed, don't overload their servers)

---

## 3. Project Structure

```
gfwiki-scraper/
├── index.js          # Main entry point - coordinates scraping
├── worker.js         # Worker thread implementation
├── utils.js          # Shared utility functions
├── exit.js           # Process exit handling and worker cleanup
├── package.json      # Dependencies and scripts
├── pnpm-lock.yaml    # Dependency lockfile
├── tdolls_data.json  # Output: T-Doll list data
└── tdolls_skin_data.json # Output: T-Doll skin data
```

---

## 4. Repository-Specific Rules

1. **No breaking changes** to existing output JSON formats
2. **Preserve all existing functionality** when modifying code
3. **Scraping etiquette**: Add delays between requests if you notice rate limiting
4. **Data preservation**: Always merge new data with existing data files, don't overwrite
5. **Error resilience**: Implement retry logic for failed scraping tasks (max 3 retries)
6. **No dependencies**: Only add new dependencies if absolutely necessary
7. **Performance**: Maintain multi-threaded scraping architecture for speed
8. **Clean exit**: Ensure all workers and browsers are properly terminated on process exit

---

## 5. Cursor/Copilot Rules (None Currently)

There are no additional cursor rules or copilot instructions configured in this repository. Follow the guidelines above.

---

*Generated for AI coding agents - updated 2026-04-01*