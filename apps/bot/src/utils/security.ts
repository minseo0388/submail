export function sanitizeHeader(value: string | undefined): string {
    if (!value) return "";
    // Remove newlines and carriage returns to prevent header injection
    return value.replace(/[\r\n%0A%0D]/g, "");
}

export function validateContent(text: string | null | undefined, html: string | null | undefined): boolean {
    const combined = (text || "") + (html || "");

    // 1. URL Limit Abuse Check
    // Simple regex to count http/https occurrences
    const urlCount = (combined.match(/https?:\/\//gi) || []).length;
    if (urlCount > 20) {
        console.warn(`[Security] Content blocked: Too many URLs (${urlCount})`);
        return false;
    }

    // 2. Spam Keyword Filtering
    const spamKeywords = [
        "winning_prize", "claim_now", "urgent_transfer",
        "lottery_winner", "bank_account_verification"
    ];

    const lowerContent = combined.toLowerCase();
    for (const keyword of spamKeywords) {
        if (lowerContent.includes(keyword)) {
            console.warn(`[Security] Content blocked: Spam keyword '${keyword}' detected`);
            return false;
        }
    }

    return true;
}
