"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useLoadedCampaign } from '../hooks/useLoadedCampaign';
import { CampaignData } from '../types/campaign';

type EntityTab = 'paths' | 'talents' | 'surges' | 'expertises' | 'weapons' | 'armor' | 'equipment' | 'ancestryContent';

const TABS: { key: EntityTab; label: string }[] = [
    { key: 'paths', label: 'Paths' },
    { key: 'talents', label: 'Talents' },
    { key: 'surges', label: 'Surges' },
    { key: 'expertises', label: 'Expertises' },
    { key: 'weapons', label: 'Weapons' },
    { key: 'armor', label: 'Armor' },
    { key: 'equipment', label: 'Equipment' },
    { key: 'ancestryContent', label: 'Ancestries' },
];

const entryLabel = (tab: EntityTab, entry: CampaignData[EntityTab][number]): string => {
    if (tab === 'ancestryContent') {
        return (entry as CampaignData['ancestryContent'][number]).ancestryId;
    }
    return (entry as { name: string }).name;
};

export const CampaignSettings = ({ campaignId }: { campaignId: string }) => {
    const { campaign, notFound } = useLoadedCampaign(campaignId);
    const [activeTab, setActiveTab] = useState<EntityTab>('paths');

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

    const entries = campaign.data[activeTab];

    return (
        <div className="max-w-3xl mx-auto min-h-screen py-10 px-4 font-body">
            <Link href={`/campaign/${campaign.id}`} className="text-sm text-cosmere-blue underline mb-6 inline-block">
                ← {campaign.name}
            </Link>

            <header className="mb-6">
                <h1 className="text-2xl font-display font-bold text-cosmere-blue">Campaign Settings</h1>
                <p className="text-sm text-stone-600 mt-1">
                    Copyright-sensitive game content lives here — entered by your table, never bundled with the app.
                </p>
            </header>

            <div className="flex flex-wrap gap-2 mb-6">
                {TABS.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-4 py-2 rounded text-xs uppercase font-bold tracking-wider transition-colors border ${
                            activeTab === tab.key
                                ? 'bg-cosmere-blue text-cosmere-gold border-cosmere-gold/50'
                                : 'bg-cosmere-parchment text-cosmere-blue border-cosmere-gold/30 hover:bg-cosmere-gold/10'
                        }`}
                    >
                        {tab.label} ({campaign.data[tab.key].length})
                    </button>
                ))}
            </div>

            <section className="bg-cosmere-parchment p-6 rounded-lg shadow-lg border border-cosmere-gold/50">
                {entries.length === 0 ? (
                    <p className="text-stone-500 text-sm">
                        No {TABS.find(t => t.key === activeTab)?.label.toLowerCase()} yet.
                    </p>
                ) : (
                    <ul className="divide-y divide-cosmere-gold/30 mb-4">
                        {entries.map((entry, i) => (
                            <li key={i} className="py-2 text-cosmere-blue font-bold">
                                {entryLabel(activeTab, entry)}
                            </li>
                        ))}
                    </ul>
                )}
                <p className="text-xs text-stone-400 italic">
                    Editing forms for {TABS.find(t => t.key === activeTab)?.label.toLowerCase()} are coming next —
                    this view is read-only for now.
                </p>
            </section>
        </div>
    );
};
