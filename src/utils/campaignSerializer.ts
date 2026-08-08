/**
 * Campaign serialization: create, export/import (readable JSON), and
 * merge-on-import semantics (consent.md §2.10) — entities and characters
 * are upserted by UUID, incoming values win on conflict, local-only
 * entries are preserved.
 */

import {
    Campaign,
    CampaignData,
    CharacterSaveV3,
    CAMPAIGN_SCHEMA_VERSION,
    createEmptyCampaignData,
} from '../types/campaign';
import { generateId } from './uuid';

export function createCampaign(name: string, description?: string): Campaign {
    const now = new Date().toISOString();
    return {
        schemaVersion: CAMPAIGN_SCHEMA_VERSION,
        id: generateId(),
        name,
        description,
        createdAt: now,
        updatedAt: now,
        data: createEmptyCampaignData(),
        characters: [],
    };
}

export interface ExportCampaignOptions {
    /** Defaults to true — set false to export data stores without characters. */
    includeCharacters?: boolean;
}

export function exportCampaign(campaign: Campaign, options: ExportCampaignOptions = {}): string {
    const includeCharacters = options.includeCharacters ?? true;
    const payload: Campaign = includeCharacters ? campaign : { ...campaign, characters: [] };
    return JSON.stringify(payload, null, 2);
}

export function isCampaignFile(value: unknown): value is Campaign {
    if (value === null || typeof value !== 'object') return false;
    const c = value as Partial<Campaign>;
    return (
        c.schemaVersion === CAMPAIGN_SCHEMA_VERSION &&
        typeof c.id === 'string' &&
        typeof c.name === 'string' &&
        typeof c.data === 'object' &&
        c.data !== null &&
        Array.isArray(c.characters)
    );
}

export function parseCampaignFile(json: string): Campaign {
    const parsed = JSON.parse(json);
    if (!isCampaignFile(parsed)) {
        throw new Error('File is not a valid campaign (missing or unsupported schema version).');
    }
    return parsed;
}

function upsertByKey<T, K>(local: T[], incoming: T[], keyFn: (item: T) => K): T[] {
    const merged = new Map<K, T>(local.map(item => [keyFn(item), item]));
    for (const item of incoming) {
        merged.set(keyFn(item), item);
    }
    return Array.from(merged.values());
}

const upsertById = <T extends { id: string }>(local: T[], incoming: T[]): T[] =>
    upsertByKey(local, incoming, item => item.id);

export function mergeCampaignData(local: CampaignData, incoming: CampaignData): CampaignData {
    return {
        paths: upsertById(local.paths, incoming.paths),
        talents: upsertById(local.talents, incoming.talents),
        surges: upsertById(local.surges, incoming.surges),
        expertises: upsertById(local.expertises, incoming.expertises),
        expertiseCategories: Array.from(new Set([...local.expertiseCategories, ...incoming.expertiseCategories])),
        weapons: upsertById(local.weapons, incoming.weapons),
        armor: upsertById(local.armor, incoming.armor),
        equipment: upsertById(local.equipment, incoming.equipment),
        ancestryContent: upsertByKey(local.ancestryContent, incoming.ancestryContent, a => a.ancestryId),
    };
}

export function mergeCharacters(local: CharacterSaveV3[], incoming: CharacterSaveV3[]): CharacterSaveV3[] {
    return upsertByKey(local, incoming, c => c.id);
}

/**
 * Merge an incoming campaign file into the local copy of the same
 * campaign (same id). Incoming data-store entities and characters win on
 * UUID conflicts; anything local-only is preserved. Throws if the two
 * campaigns don't share an id — that's a distinct campaign, not a merge.
 */
export function mergeCampaign(local: Campaign, incoming: Campaign): Campaign {
    if (local.id !== incoming.id) {
        throw new Error('Cannot merge campaigns with different ids.');
    }
    return {
        schemaVersion: incoming.schemaVersion,
        id: local.id,
        name: incoming.name,
        description: incoming.description ?? local.description,
        createdAt: local.createdAt,
        updatedAt: new Date().toISOString(),
        data: mergeCampaignData(local.data, incoming.data),
        characters: mergeCharacters(local.characters, incoming.characters),
    };
}
