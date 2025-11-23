import bcrypt from "bcrypt";
import psl from "psl";

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// List of common free email providers that are not allowed for business registration
const BLOCKED_EMAIL_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'aol.com',
  'icloud.com',
  'protonmail.com',
  'mail.com',
  'yandex.com',
  'zoho.com',
  'gmx.com',
  'tutanota.com',
  'live.com',
  'msn.com',
  'inbox.com',
  'me.com',
  'mac.com',
];

export function isBusinessEmail(email: string): {
  valid: boolean;
  message?: string;
} {
  if (!validateEmail(email)) {
    return { valid: false, message: "Invalid email format" };
  }

  const domain = email.split('@')[1].toLowerCase();
  
  if (BLOCKED_EMAIL_DOMAINS.includes(domain)) {
    return { 
      valid: false, 
      message: "Please use a business email address. Personal email addresses (Gmail, Yahoo, etc.) are not allowed for merchant accounts." 
    };
  }

  return { valid: true };
}

export function validatePassword(password: string): {
  valid: boolean;
  message?: string;
} {
  if (password.length < 8) {
    return { valid: false, message: "Password must be at least 8 characters" };
  }
  if (!/[A-Z]/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one uppercase letter",
    };
  }
  if (!/[a-z]/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one lowercase letter",
    };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: "Password must contain at least one number" };
  }
  return { valid: true };
}

// Extract the registrable domain using the Public Suffix List
// Examples: "mail.acme.com" -> "acme.com", "www.example.co.uk" -> "example.co.uk"
function extractRegistrableDomain(input: string): string | null {
  // For email addresses, extract the hostname part
  const hostname = input.includes('@') 
    ? input.split('@')[1].toLowerCase() 
    : extractHostnameFromUrl(input);
  
  if (!hostname) {
    throw new Error('Invalid input format');
  }
  
  // Use PSL library to get the registrable domain
  // This correctly handles multi-part TLDs like .co.uk
  const parsed = psl.parse(hostname);
  
  // Validate the parsed result
  if (parsed.error || !parsed.domain) {
    throw new Error('Invalid or unregistrable domain');
  }
  
  return parsed.domain;
}

// Extract hostname from a URL string
function extractHostnameFromUrl(input: string): string {
  try {
    // Trim whitespace and ensure proper URL format
    const trimmedInput = input.trim();
    const url = new URL(trimmedInput.startsWith('http') ? trimmedInput : `https://${trimmedInput}`);
    return url.hostname.toLowerCase();
  } catch {
    // If URL parsing fails, try manual extraction
    const cleaned = input.trim().toLowerCase()
      .replace(/^(https?:\/\/)?(www\.)?/, '') // Remove protocol and www
      .split('/')[0]  // Remove path
      .split('?')[0]  // Remove query params
      .split('#')[0]; // Remove hash
    
    // Validate that we have a domain-like string (must contain dot and no spaces)
    if (!cleaned || cleaned.includes(' ') || !cleaned.includes('.')) {
      throw new Error('Invalid URL format');
    }
    
    return cleaned;
  }
}

// Validate that email domain matches business website domain
export function validateDomainMatch(email: string, businessUrl: string): {
  valid: boolean;
  message?: string;
} {
  try {
    const emailDomain = extractRegistrableDomain(email);
    const websiteDomain = extractRegistrableDomain(businessUrl);
    
    if (!emailDomain || !websiteDomain) {
      return {
        valid: false,
        message: "Unable to extract valid domain from email or website URL"
      };
    }
    
    if (emailDomain !== websiteDomain) {
      return {
        valid: false,
        message: `Email domain (${emailDomain}) must match your business website domain (${websiteDomain}). This verifies you own the business.`
      };
    }
    
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      message: "Invalid website URL format. Please enter a valid business website (e.g., https://yourbusiness.com)"
    };
  }
}
