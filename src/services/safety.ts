// Content Safety Filter - Basic guardrails for AI responses
// Can be expanded with Qwen3Guard backend later

const BLOCKED_KEYWORDS = [
  'violence', 'weapon', 'harm', 'abuse', 'threat',
  'illegal', 'fraud', 'scam',
];

const SUSPICIOUS_PATTERNS = [
  /\b(jailbreak|hack|bypass|admin|root)\b/i,
  /\b(ignore previous|instruct|system prompt)\b/i,
];

interface SafetyResult {
  isSafe: boolean;
  reason?: string;
  suggestions?: string[];
}

export const contentSafety = {
  // Check user input before sending to AI
  checkInput(text: string): SafetyResult {
    const lowerText = text.toLowerCase();
    
    // Check blocked keywords
    for (const keyword of BLOCKED_KEYWORDS) {
      if (lowerText.includes(keyword)) {
        return {
          isSafe: false,
          reason: `Your message contains restricted content: "${keyword}"`,
          suggestions: ['Try rephrasing your question'],
        };
      }
    }
    
    // Check suspicious patterns (prompt injection attempts)
    for (const pattern of SUSPICIOUS_PATTERNS) {
      if (pattern.test(text)) {
        return {
          isSafe: false,
          reason: 'Your message appears to contain unusual requests',
          suggestions: ['Try asking in a different way'],
        };
      }
    }
    
    // Check length
    if (text.length > 1000) {
      return {
        isSafe: false,
        reason: 'Message too long. Please shorten it.',
      };
    }
    
    return { isSafe: true };
  },

  // Filter AI response before displaying
  checkOutput(text: string): { filtered: string; wasFiltered: boolean } {
    // Basic filtering - can expand with Qwen3Guard
    let filtered = text;
    let wasFiltered = false;
    
    // Remove any system prompts that might leak
    if (filtered.includes('system prompt') || filtered.includes('instructions:')) {
      filtered = filtered.replace(/.*(system prompt|instructions):.*/gi, '');
      wasFiltered = true;
    }
    
    return { filtered: filtered.trim(), wasFiltered };
  },

  // Multi-language detection (basic)
  detectLanguage(text: string): string {
    // Simple heuristic - can be improved
    const patterns = {
      af: /^[a-z\s]+$/i, // Afrikaans rough check
      zu: /u|um|ba|si/i, // Zulu rough check
      st: /o|a|e|ho/i,   // Sesotho rough check
    };
    
    // Default to English if uncertain
    return 'en';
  },
};

export default contentSafety;
