/**
 * Parses and validates lead input from textarea
 * Handles emails, domains, and mixed input with various separators
 */

export type EntityType = 'email' | 'domain'

export interface ParsedInput {
  original: string
  type: EntityType
  email: string | null
  domain: string | null
  status: 'valid' | 'invalid' | 'duplicate'
  error?: string
}

export interface ParseResult {
  items: ParsedInput[]
  validCount: number
  invalidCount: number
  duplicateCount: number
}

/**
 * Validate email address format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate domain format
 * Must be at least 2 characters, contain only valid domain chars
 */
function isValidDomain(domain: string): boolean {
  if (domain.length < 2) return false
  const domainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i
  return domainRegex.test(domain)
}

/**
 * Clean and normalize email address
 */
function cleanEmail(email: string): string {
  return email.toLowerCase().trim()
}

/**
 * Extract domain from email address
 */
function extractDomainFromEmail(email: string): string {
  const parts = email.toLowerCase().trim().split('@')
  if (parts.length === 2) {
    return parts[1]
  }
  return ''
}

/**
 * Clean and normalize domain
 * Removes protocol, www, paths, query strings, fragments, trailing slashes
 */
function cleanDomain(domain: string): string {
  let cleaned = domain.toLowerCase().trim()

  // Remove protocol
  cleaned = cleaned.replace(/^https?:\/\//, '')

  // Remove www. prefix
  cleaned = cleaned.replace(/^www\./, '')

  // Remove path, query string, fragment
  cleaned = cleaned.split('/')[0]
  cleaned = cleaned.split('?')[0]
  cleaned = cleaned.split('#')[0]

  // Remove trailing slash and whitespace
  cleaned = cleaned.replace(/\/+$/, '').trim()

  return cleaned
}

/**
 * Parse raw input string into individual items
 * Handles comma, semicolon, newline, and mixed separators
 */
function splitInput(raw: string): string[] {
  if (!raw || raw.trim().length === 0) {
    return []
  }

  // Split on common separators and filter empty strings
  const items = raw
    .split(/[,\n;]+/)
    .map(item => item.trim())
    .filter(item => item.length > 0)

  return items
}

/**
 * Parse a single item (email or domain)
 */
function parseItem(item: string): ParsedInput {
  const original = item

  // Check if it's an email (contains @)
  if (item.includes('@')) {
    const cleanedEmail = cleanEmail(item)

    if (!isValidEmail(cleanedEmail)) {
      return {
        original,
        type: 'email',
        email: null,
        domain: null,
        status: 'invalid',
        error: 'Invalid email format'
      }
    }

    const domain = extractDomainFromEmail(cleanedEmail)
    if (!isValidDomain(domain)) {
      return {
        original,
        type: 'email',
        email: null,
        domain: null,
        status: 'invalid',
        error: 'Invalid domain extracted from email'
      }
    }

    return {
      original,
      type: 'email',
      email: cleanedEmail,
      domain,
      status: 'valid'
    }
  }

  // Treat as domain
  const cleanedDomain = cleanDomain(item)

  if (!isValidDomain(cleanedDomain)) {
    return {
      original,
      type: 'domain',
      email: null,
      domain: null,
      status: 'invalid',
      error: 'Invalid domain format'
    }
  }

  return {
    original,
    type: 'domain',
    email: null,
    domain: cleanedDomain,
    status: 'valid'
  }
}

/**
 * Main parse function
 * Takes raw textarea input and returns parsed, deduplicated results
 */
export function parseInputs(rawInput: string): ParseResult {
  const items = splitInput(rawInput)
  const parsed: ParsedInput[] = []

  // Track duplicates within this submission
  const validItemsByEmail = new Set<string>()
  const validItemsByDomain = new Set<string>()

  for (const item of items) {
    const result = parseItem(item)

    // Check for duplicates within submission
    if (result.status === 'valid') {
      let key = ''
      if (result.type === 'email' && result.email) {
        key = `email:${result.email}`
        if (validItemsByEmail.has(key)) {
          result.status = 'duplicate'
        } else {
          validItemsByEmail.add(key)
        }
      } else if (result.type === 'domain' && result.domain) {
        key = `domain:${result.domain}`
        if (validItemsByDomain.has(key)) {
          result.status = 'duplicate'
        } else {
          validItemsByDomain.add(key)
        }
      }
    }

    parsed.push(result)
  }

  const validCount = parsed.filter(p => p.status === 'valid').length
  const invalidCount = parsed.filter(p => p.status === 'invalid').length
  const duplicateCount = parsed.filter(p => p.status === 'duplicate').length

  return {
    items: parsed,
    validCount,
    invalidCount,
    duplicateCount
  }
}

/*
 * TEST EXAMPLES (not executable, just for documentation)
 *
 * Example 1 - Mixed input:
 * Input: "John@Brand.com, https://www.Nike.com/about, apple.com"
 * Expected:
 *   - john@brand.com (email, domain: brand.com, valid)
 *   - nike.com (domain, valid)
 *   - apple.com (domain, valid)
 *
 * Example 2 - Email from markdown link:
 * Input: "[founder@startup.ai](mailto:founder@startup.ai)"
 * Expected: founder@startup.ai (email, domain: startup.ai, valid)
 * Note: Markdown parser should strip the link syntax before parsing
 *
 * Example 3 - Invalid input:
 * Input: "bad input here"
 * Expected: (domain type, null, invalid, error: "Invalid domain format")
 *
 * Example 4 - Duplicate test:
 * Input: "john@brand.com, John@Brand.com"
 * Expected:
 *   - john@brand.com (email, valid)
 *   - John@Brand.com (email, duplicate)
 *
 * Example 5 - Domain cleanup:
 * Input: "https://www.example.com/path?x=1"
 * Expected: example.com (domain, valid)
 *
 * Example 6 - Various separators:
 * Input: "test@example.com; another@test.com\nthird@domain.com"
 * Expected: 3 valid emails
 *
 * Example 7 - Empty and whitespace:
 * Input: "  ,  , \n,  "
 * Expected: 0 items (empty strings filtered)
 *
 * Example 8 - Edge cases:
 * Input: "@ (missing local), test@ (missing domain), test@.com (invalid TLD)"
 * Expected: all invalid
 */
