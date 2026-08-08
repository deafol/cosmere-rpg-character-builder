"use client";

import Link from 'next/link';
import { useLoadedCampaign } from '../hooks/useLoadedCampaign';
import { CharacterProvider } from '../context/CharacterContext';
import { BuilderLayout } from './BuilderLayout';

/**
 * Character editor, nested under its campaign route. For now this still
 * mounts the pre-existing CharacterContext/BuilderLayout unchanged — it
 * doesn't yet read from or save to the campaign's data stores. That
 * rewire (resolving talents/weapons/etc. as UUID refs into CampaignData,
 * saving as CharacterSaveV3) is a later phase; this step only makes sure
 * the character editor is reachable from within a campaign.
 */
export const CampaignCharacterPage = ({ campaignId }: { campaignId: string; charId: string }) => {
    const { campaign, notFound } = useLoadedCampaign(campaignId);

    if (notFound) {
        return (
            <div className="max-w-xl mx-auto py-24 text-center font-body">
                <p className="text-stone-600 mb-4">Campaign not found on this device.</p>
                <Link href="/" className="text-cosmere-blue underline">Back to campaigns</Link>
            </div>
        );
    }

    if (!campaign) {
        return <div className="max-w-xl mx-auto py-24 text-center font-body text-stone-500">Loading campaign…</div>;
    }

    return (
        <div className="min-h-screen bg-stone-200 p-4">
            <div className="max-w-[1200px] mx-auto mb-4">
                <Link href={`/campaign/${campaign.id}`} className="text-sm text-cosmere-blue underline">
                    ← {campaign.name}
                </Link>
            </div>
            <CharacterProvider>
                <BuilderLayout />
            </CharacterProvider>
        </div>
    );
};
