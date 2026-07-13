/**
 * Utility to parse and clean up raw API error responses (including Gemini 429 quota limits)
 * into beautiful, user-friendly, and actionable feedback.
 */
export function cleanErrorMessage(msg: string | null | undefined): string {
  if (!msg) return "An unexpected error occurred. Please try again.";

  // Strip prefixes if present
  let cleanMsg = msg.trim();
  if (cleanMsg.startsWith("ApiError:")) {
    cleanMsg = cleanMsg.slice("ApiError:".length).trim();
  } else if (cleanMsg.startsWith("Error:")) {
    cleanMsg = cleanMsg.slice("Error:".length).trim();
  }

  // Normalize string for checking
  const lowerMsg = cleanMsg.toLowerCase();

  // Try parsing as JSON first in case it's stringified JSON from the API
  try {
    const parsed = JSON.parse(cleanMsg);
    if (parsed.error && parsed.error.message) {
      return cleanErrorMessage(parsed.error.message);
    }
  } catch (e) {
    // Not a valid JSON string, continue with regex/substring checks
  }

  // Check if the message contains stringified JSON within it
  if (cleanMsg.includes('{"error":') || cleanMsg.includes('{"message":')) {
    try {
      const match = cleanMsg.match(/\{"error":.*\}/) || cleanMsg.match(/\{"message":.*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (parsed.error && parsed.error.message) {
          return cleanErrorMessage(parsed.error.message);
        }
      }
    } catch (e) {}
  }

  // Handle Quota / Rate limit errors (429 / RESOURCE_EXHAUSTED)
  if (
    cleanMsg.includes("429") || 
    lowerMsg.includes("quota") || 
    lowerMsg.includes("resource_exhausted") || 
    lowerMsg.includes("rate limit") ||
    lowerMsg.includes("limit exceeded") ||
    lowerMsg.includes("exceeded your current quota")
  ) {
    // Check if there is a retry delay mentioned in the message
    const retryMatch = cleanMsg.match(/retry in ([\d\.]+)s/i);
    const retryTime = retryMatch 
      ? ` Please retry in ${Math.ceil(parseFloat(retryMatch[1]))} seconds.` 
      : " Please wait a few seconds and try again.";
    
    return `⚠️ Service Quota Limit Exceeded: The free-tier request quota limit has been reached.${retryTime}\n\nTo continue using the assistant uninterrupted, you can configure your own Google Gemini API key in the Settings panel (using the ⚙️ button in the top-right corner of the application header).`;
  }

  // Handle missing API Key/Authentication issues
  if (lowerMsg.includes("api key") || lowerMsg.includes("api_key") || lowerMsg.includes("invalid api key")) {
    return "🔑 Invalid or Missing API Key: The system could not validate your Google Gemini API configuration. Please verify your custom API key in the Settings panel (⚙️ button in the top-right corner).";
  }

  // Handle generic network or connection issues
  if (lowerMsg.includes("fetch") || lowerMsg.includes("network") || lowerMsg.includes("failed to fetch") || lowerMsg.includes("offline")) {
    return "🌐 Network connection issue. Please check your internet connection or custom API key and try again.";
  }

  // Default clean-up of API error wrappers
  return cleanMsg.replace(/^Error:\s*/i, '');
}
