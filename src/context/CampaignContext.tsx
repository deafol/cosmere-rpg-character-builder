"use client";

import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Campaign, CampaignData, CharacterSaveV3 } from '../types/campaign';
import {
    createCampaign as buildCampaign,
    exportCampaign as buildExport,
    ExportCampaignOptions,
    mergeCampaign,
    parseCampaignFile,
} from '../utils/campaignSerializer';
import {
    CampaignSummary,
    deleteCampaignFromStorage,
    listCampaignSummaries,
    loadCampaignFromStorage,
    saveCampaignToStorage,
} from '../utils/campaignStorage';

interface CampaignContextType {
    campaign: Campaign | null;
    campaignVersion: number;
    listCampaigns: () => CampaignSummary[];
    createCampaign: (name: string, description?: string) => Campaign;
    loadCampaign: (id: string) => Campaign | undefined;
    closeCampaign: () => void;
    deleteCampaign: (id: string) => void;
    updateCampaignMeta: (updates: Partial<Pick<Campaign, 'name' | 'description'>>) => void;
    updateCampaignData: (updates: Partial<CampaignData>) => void;
    addCharacter: (character: CharacterSaveV3) => void;
    updateCharacter: (id: string, updates: Partial<CharacterSaveV3>) => void;
    removeCharacter: (id: string) => void;
    exportCampaignFile: (options?: ExportCampaignOptions) => string;
    importCampaignFile: (json: string) => Campaign;
}

const CampaignContext = createContext<CampaignContextType | undefined>(undefined);

const touch = (campaign: Campaign): Campaign => ({
    ...campaign,
    updatedAt: new Date().toISOString(),
});

const requireCampaign = (campaign: Campaign | null): Campaign => {
    if (!campaign) {
        throw new Error('No active campaign — load or create one first.');
    }
    return campaign;
};

export const CampaignProvider = ({ children }: { children: ReactNode }) => {
    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [campaignVersion, setCampaignVersion] = useState(0);

    // Autosave: any change to the active campaign is persisted immediately.
    useEffect(() => {
        if (campaign) {
            saveCampaignToStorage(campaign);
        }
    }, [campaign]);

    const listCampaigns = () => listCampaignSummaries();

    const createCampaign = (name: string, description?: string) => {
        const newCampaign = buildCampaign(name, description);
        setCampaign(newCampaign);
        setCampaignVersion(v => v + 1);
        return newCampaign;
    };

    const loadCampaign = (id: string) => {
        const loaded = loadCampaignFromStorage(id);
        if (loaded) {
            setCampaign(loaded);
            setCampaignVersion(v => v + 1);
        }
        return loaded;
    };

    const closeCampaign = () => {
        setCampaign(null);
        setCampaignVersion(v => v + 1);
    };

    const deleteCampaign = (id: string) => {
        deleteCampaignFromStorage(id);
        if (campaign?.id === id) {
            setCampaign(null);
            setCampaignVersion(v => v + 1);
        }
    };

    const updateCampaignMeta = (updates: Partial<Pick<Campaign, 'name' | 'description'>>) => {
        setCampaign(prev => touch({ ...requireCampaign(prev), ...updates }));
    };

    const updateCampaignData = (updates: Partial<CampaignData>) => {
        setCampaign(prev => {
            const current = requireCampaign(prev);
            return touch({ ...current, data: { ...current.data, ...updates } });
        });
    };

    const addCharacter = (character: CharacterSaveV3) => {
        setCampaign(prev => {
            const current = requireCampaign(prev);
            return touch({ ...current, characters: [...current.characters, character] });
        });
    };

    const updateCharacter = (id: string, updates: Partial<CharacterSaveV3>) => {
        setCampaign(prev => {
            const current = requireCampaign(prev);
            return touch({
                ...current,
                characters: current.characters.map(c => (c.id === id ? { ...c, ...updates } : c)),
            });
        });
    };

    const removeCharacter = (id: string) => {
        setCampaign(prev => {
            const current = requireCampaign(prev);
            return touch({ ...current, characters: current.characters.filter(c => c.id !== id) });
        });
    };

    const exportCampaignFile = (options?: ExportCampaignOptions) => buildExport(requireCampaign(campaign), options);

    const importCampaignFile = (json: string) => {
        const incoming = parseCampaignFile(json);
        const existing = campaign?.id === incoming.id ? campaign : loadCampaignFromStorage(incoming.id);
        const resolved = existing ? mergeCampaign(existing, incoming) : incoming;

        saveCampaignToStorage(resolved);
        if (!campaign || campaign.id === resolved.id) {
            setCampaign(resolved);
            setCampaignVersion(v => v + 1);
        }
        return resolved;
    };

    return (
        <CampaignContext.Provider
            value={{
                campaign,
                campaignVersion,
                listCampaigns,
                createCampaign,
                loadCampaign,
                closeCampaign,
                deleteCampaign,
                updateCampaignMeta,
                updateCampaignData,
                addCharacter,
                updateCharacter,
                removeCharacter,
                exportCampaignFile,
                importCampaignFile,
            }}
        >
            {children}
        </CampaignContext.Provider>
    );
};

export const useCampaign = () => {
    const context = useContext(CampaignContext);
    if (context === undefined) {
        throw new Error('useCampaign must be used within a CampaignProvider');
    }
    return context;
};
