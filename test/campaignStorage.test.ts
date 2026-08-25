import { describe, it, expect, beforeEach } from 'vitest';
import {
    deleteCampaignFromStorage,
    listCampaignSummaries,
    loadCampaignFromStorage,
    saveCampaignToStorage,
} from '@/utils/campaignStorage';
import { createCampaign } from '@/utils/campaignSerializer';

beforeEach(() => {
    window.localStorage.clear();
});

describe('campaignStorage', () => {
    it('round-trips a campaign through save/load', () => {
        const campaign = createCampaign('Roshar Campaign');
        saveCampaignToStorage(campaign);
        expect(loadCampaignFromStorage(campaign.id)).toEqual(campaign);
    });

    it('returns undefined for an unknown id', () => {
        expect(loadCampaignFromStorage('does-not-exist')).toBeUndefined();
    });

    it('lists saved campaigns newest-updated first', () => {
        const older = { ...createCampaign('Older'), updatedAt: '2026-01-01T00:00:00.000Z' };
        const newer = { ...createCampaign('Newer'), updatedAt: '2026-06-01T00:00:00.000Z' };
        saveCampaignToStorage(older);
        saveCampaignToStorage(newer);

        const summaries = listCampaignSummaries();
        expect(summaries.map(s => s.id)).toEqual([newer.id, older.id]);
    });

    it('updates the index summary when a campaign is re-saved under the same id', () => {
        const campaign = createCampaign('Original Name');
        saveCampaignToStorage(campaign);

        const renamed = { ...campaign, name: 'Renamed', updatedAt: new Date().toISOString() };
        saveCampaignToStorage(renamed);

        const summaries = listCampaignSummaries();
        expect(summaries).toHaveLength(1);
        expect(summaries[0].name).toBe('Renamed');
    });

    it('removes a campaign and its index entry on delete', () => {
        const campaign = createCampaign('To Delete');
        saveCampaignToStorage(campaign);
        deleteCampaignFromStorage(campaign.id);

        expect(loadCampaignFromStorage(campaign.id)).toBeUndefined();
        expect(listCampaignSummaries()).toHaveLength(0);
    });
});
