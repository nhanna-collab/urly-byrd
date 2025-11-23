export interface BusinessValidationData {
  businessName: string;
  website: string;
  businessStreet: string;
  businessCity: string;
  businessState: string;
  businessPhone: string;
}

export interface ValidationResult {
  isValid: boolean;
  confidence: 'high' | 'medium' | 'low';
  reasons: string[];
}

/**
 * Validates a business by checking data completeness and basic format
 * SECURITY: Does NOT fetch user-provided URLs to prevent SSRF attacks
 * For production, integrate with trusted third-party validation API (Middesk, Trulioo, etc.)
 */
export async function validateBusiness(data: BusinessValidationData): Promise<ValidationResult> {
  const reasons: string[] = [];
  let confidenceScore = 0;

  try {
    // Validate business name
    if (data.businessName && data.businessName.trim().length >= 3) {
      reasons.push('✓ Business name provided');
      confidenceScore += 20;
      
      // Check for reasonable business name (not just random characters)
      const hasLetters = /[a-zA-Z]{3,}/.test(data.businessName);
      if (hasLetters) {
        reasons.push('✓ Business name appears valid');
        confidenceScore += 10;
      }
    } else {
      reasons.push('✗ Business name is too short or missing');
    }

    // Validate complete address
    if (data.businessStreet && data.businessStreet.trim().length >= 5) {
      reasons.push('✓ Street address provided');
      confidenceScore += 15;
    } else {
      reasons.push('✗ Street address is incomplete');
    }

    if (data.businessCity && data.businessCity.trim().length >= 2) {
      reasons.push('✓ City provided');
      confidenceScore += 10;
    } else {
      reasons.push('✗ City is missing');
    }

    if (data.businessState && data.businessState.trim().length >= 2) {
      reasons.push('✓ State provided');
      confidenceScore += 10;
    } else {
      reasons.push('✗ State is missing');
    }

    // Note: Phone number validation removed per business requirements
    // Phone number is collected but not validated

    // Validate domain format (without fetching it - SECURITY)
    const websiteWithoutProtocol = data.website
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '')
      .toLowerCase();
    
    const domainParts = websiteWithoutProtocol.split('.');
    
    // Check for valid domain structure
    if (domainParts.length >= 2 && domainParts[domainParts.length - 1].length >= 2) {
      reasons.push('✓ Valid domain format');
      confidenceScore += 10;
      
      // Check it's not a personal email provider being used as website
      const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com'];
      if (!personalDomains.includes(websiteWithoutProtocol)) {
        reasons.push('✓ Not a personal email domain');
        confidenceScore += 10;
      } else {
        reasons.push('✗ Website appears to be an email provider domain');
      }
    } else {
      reasons.push('✗ Invalid domain format');
    }

    // Determine validation result
    // We want reasonable confidence that data is complete (lowered threshold since phone validation removed)
    const isValid = confidenceScore >= 50;
    const confidence: 'high' | 'medium' | 'low' = 
      confidenceScore >= 80 ? 'high' : 
      confidenceScore >= 60 ? 'medium' : 
      'low';

    return {
      isValid,
      confidence,
      reasons
    };

  } catch (error) {
    return {
      isValid: false,
      confidence: 'low',
      reasons: ['Error during validation: ' + (error instanceof Error ? error.message : 'Unknown error')]
    };
  }
}
