"use client";

import Link from 'next/link';
import { useLoadedCampaign } from '../hooks/useLoadedCampaign';
import { CharacterProvider } from '../context/CharacterContext';
import { BuilderLayout } from './BuilderLayout';

/**
 * Character editor, nested under its campaign route. CharacterProvider is
 * remounted (key={charId}) whenever charId changes so it always starts
 * blank before useCharacterCampaignSync (inside BuilderLayout) loads or
 * creates the right campaign.characters record.
 */
export const CampaignCharacterPage = ({ campaignId, charId }: { campaignId: string; charId: string }) => {
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
            <CharacterProvider key={charId}>
                <BuilderLayout campaignId={campaignId} charId={charId} />
            </CharacterProvider>
        </div>
    );
};
