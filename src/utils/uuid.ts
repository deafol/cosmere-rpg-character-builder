/**
 * Generates a UUIDv4 for campaign entities and character saves.
 * All IDs referenced within Campaign data must use this — see consent.md §2.11.
 */
export function generateId(): string {
    return crypto.randomUUID();
}
