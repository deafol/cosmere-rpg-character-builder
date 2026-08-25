/**
 * localStorage persistence for campaigns — an index of summaries (for the
 * campaign picker) plus one key per full campaign. Guards every call
 * against a missing `window` so this module is safe to import from
 * server-rendered code paths.
 */

import { Campaign } from '../types/campaign';

const INDEX_KEY = 'cosmereCampaignBuilder:index';
const campaignKey = (id: string) => `cosmereCampaignBuilder:campaign:${id}`;

export interface CampaignSummary {
    id: string;
    name: string;
    updatedAt: string;
}

function hasStorage(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readIndex(): CampaignSummary[] {
    if (!hasStorage()) return [];
    const raw = window.localStorage.getItem(INDEX_KEY);
    if (!raw) return [];
    try {
        return JSON.parse(raw) as CampaignSummary[];
    } catch {
        return [];
    }
}

function writeIndex(summaries: CampaignSummary[]): void {
    if (!hasStorage()) return;
    window.localStorage.setItem(INDEX_KEY, JSON.stringify(summaries));
}

/** Newest-updated first, for the campaign picker. */
export function listCampaignSummaries(): CampaignSummary[] {
    return readIndex().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function loadCampaignFromStorage(id: string): Campaign | undefined {
    if (!hasStorage()) return undefined;
    const raw = window.localStorage.getItem(campaignKey(id));
    if (!raw) return undefined;
    return JSON.parse(raw) as Campaign;
}

export function saveCampaignToStorage(campaign: Campaign): void {
    if (!hasStorage()) return;
    window.localStorage.setItem(campaignKey(campaign.id), JSON.stringify(campaign));
    const index = readIndex();
    const summary: CampaignSummary = { id: campaign.id, name: campaign.name, updatedAt: campaign.updatedAt };
    const existingIndex = index.findIndex(c => c.id === campaign.id);
    if (existingIndex >= 0) {
        index[existingIndex] = summary;
    } else {
        index.push(summary);
    }
    writeIndex(index);
}

export function deleteCampaignFromStorage(id: string): void {
    if (!hasStorage()) return;
    window.localStorage.removeItem(campaignKey(id));
    writeIndex(readIndex().filter(c => c.id !== id));
}
