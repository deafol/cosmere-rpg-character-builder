"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useCampaign } from '../context/CampaignContext';
import { useLoadedCampaign } from '../hooks/useLoadedCampaign';
import { EntityEditor } from './settings/EntityEditor';
import {
    pathFields,
    createDefaultPath,
    talentFields,
    createDefaultTalent,
    surgeFields,
    createDefaultSurge,
    expertiseFields,
    createDefaultExpertise,
    weaponFields,
    createDefaultWeapon,
    armorFields,
    createDefaultArmor,
    equipmentFields,
    createDefaultEquipment,
    ancestryContentFields,
    createDefaultAncestryContent,
    ancestryNameFor,
    FIXED_EXPERTISE_CATEGORIES,
} from './settings/entityFieldConfigs';
import { countReferences, EntityDomain } from '../utils/campaignReferences';
import { Armor, EquipmentItem, Expertise, Path, Surge, Talent, AncestryContent, Weapon } from '../types/campaign';

type EntityTab = EntityDomain;

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

const upsertEntry = <T,>(list: T[], entry: T, keyOf: (e: T) => string): T[] => {
    const id = keyOf(entry);
    const index = list.findIndex(e => keyOf(e) === id);
    if (index === -1) return [...list, entry];
    const next = [...list];
    next[index] = entry;
    return next;
};

const removeEntry = <T,>(list: T[], keyOf: (e: T) => string, id: string): T[] => list.filter(e => keyOf(e) !== id);

export const CampaignSettings = ({ campaignId }: { campaignId: string }) => {
    const { updateCampaignData } = useCampaign();
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

    const { data, characters } = campaign;

    const referenceWarning = (domain: EntityDomain, id: string, label: string): string | null => {
        const count = countReferences(data, characters, domain, id);
        if (count === 0) return null;
        return `"${label}" is referenced by ${count} other ${count === 1 ? 'entry' : 'entries'} (talents, paths, or characters).`;
    };

    const renderEditor = () => {
        switch (activeTab) {
            case 'paths':
                return (
                    <EntityEditor<Path>
                        entityName="Path"
                        entries={data.paths}
                        fields={pathFields}
                        campaignData={data}
                        getId={p => p.id}
                        getLabel={p => p.name || 'Unnamed Path'}
                        createDefault={createDefaultPath}
                        onSave={entry => updateCampaignData({ paths: upsertEntry(data.paths, entry, p => p.id) })}
                        onDelete={id => updateCampaignData({ paths: removeEntry(data.paths, p => p.id, id) })}
                        referenceWarning={p => referenceWarning('paths', p.id, p.name || 'Unnamed Path')}
                        emptyLabel="No paths yet."
                    />
                );
            case 'talents':
                return (
                    <EntityEditor<Talent>
                        entityName="Talent"
                        entries={data.talents}
                        fields={talentFields}
                        campaignData={data}
                        getId={t => t.id}
                        getLabel={t => t.name || 'Unnamed Talent'}
                        createDefault={createDefaultTalent}
                        onSave={entry => updateCampaignData({ talents: upsertEntry(data.talents, entry, t => t.id) })}
                        onDelete={id => updateCampaignData({ talents: removeEntry(data.talents, t => t.id, id) })}
                        referenceWarning={t => referenceWarning('talents', t.id, t.name || 'Unnamed Talent')}
                        emptyLabel="No talents yet."
                    />
                );
            case 'surges':
                return (
                    <EntityEditor<Surge>
                        entityName="Surge"
                        entries={data.surges}
                        fields={surgeFields}
                        campaignData={data}
                        getId={s => s.id}
                        getLabel={s => s.name || 'Unnamed Surge'}
                        createDefault={createDefaultSurge}
                        onSave={entry => updateCampaignData({ surges: upsertEntry(data.surges, entry, s => s.id) })}
                        onDelete={id => updateCampaignData({ surges: removeEntry(data.surges, s => s.id, id) })}
                        referenceWarning={s => referenceWarning('surges', s.id, s.name || 'Unnamed Surge')}
                        emptyLabel="No surges yet."
                    />
                );
            case 'expertises':
                return (
                    <EntityEditor<Expertise>
                        entityName="Expertise"
                        entries={data.expertises}
                        fields={expertiseFields}
                        campaignData={data}
                        getId={e => e.id}
                        getLabel={e => e.name || 'Unnamed Expertise'}
                        createDefault={createDefaultExpertise}
                        onSave={entry => {
                            const expertises = upsertEntry(data.expertises, entry, e => e.id);
                            const expertiseCategories = FIXED_EXPERTISE_CATEGORIES.includes(entry.category) ||
                                data.expertiseCategories.includes(entry.category)
                                ? data.expertiseCategories
                                : [...data.expertiseCategories, entry.category];
                            updateCampaignData({ expertises, expertiseCategories });
                        }}
                        onDelete={id => updateCampaignData({ expertises: removeEntry(data.expertises, e => e.id, id) })}
                        referenceWarning={e => referenceWarning('expertises', e.id, e.name || 'Unnamed Expertise')}
                        emptyLabel="No expertises yet."
                    />
                );
            case 'weapons':
                return (
                    <EntityEditor<Weapon>
                        entityName="Weapon"
                        entries={data.weapons}
                        fields={weaponFields}
                        campaignData={data}
                        getId={w => w.id}
                        getLabel={w => w.name || 'Unnamed Weapon'}
                        createDefault={createDefaultWeapon}
                        onSave={entry => updateCampaignData({ weapons: upsertEntry(data.weapons, entry, w => w.id) })}
                        onDelete={id => updateCampaignData({ weapons: removeEntry(data.weapons, w => w.id, id) })}
                        referenceWarning={w => referenceWarning('weapons', w.id, w.name || 'Unnamed Weapon')}
                        emptyLabel="No weapons yet."
                    />
                );
            case 'armor':
                return (
                    <EntityEditor<Armor>
                        entityName="Armor"
                        entries={data.armor}
                        fields={armorFields}
                        campaignData={data}
                        getId={a => a.id}
                        getLabel={a => a.name || 'Unnamed Armor'}
                        createDefault={createDefaultArmor}
                        onSave={entry => updateCampaignData({ armor: upsertEntry(data.armor, entry, a => a.id) })}
                        onDelete={id => updateCampaignData({ armor: removeEntry(data.armor, a => a.id, id) })}
                        referenceWarning={a => referenceWarning('armor', a.id, a.name || 'Unnamed Armor')}
                        emptyLabel="No armor yet."
                    />
                );
            case 'equipment':
                return (
                    <EntityEditor<EquipmentItem>
                        entityName="Equipment"
                        entries={data.equipment}
                        fields={equipmentFields}
                        campaignData={data}
                        getId={e => e.id}
                        getLabel={e => e.name || 'Unnamed Item'}
                        createDefault={createDefaultEquipment}
                        onSave={entry => updateCampaignData({ equipment: upsertEntry(data.equipment, entry, e => e.id) })}
                        onDelete={id => updateCampaignData({ equipment: removeEntry(data.equipment, e => e.id, id) })}
                        referenceWarning={e => referenceWarning('equipment', e.id, e.name || 'Unnamed Item')}
                        emptyLabel="No equipment yet."
                    />
                );
            case 'ancestryContent':
                return (
                    <EntityEditor<AncestryContent>
                        entityName="Ancestry"
                        entries={data.ancestryContent}
                        fields={ancestryContentFields}
                        campaignData={data}
                        getId={a => a.ancestryId}
                        getLabel={a => ancestryNameFor(a.ancestryId)}
                        createDefault={createDefaultAncestryContent}
                        onSave={entry => updateCampaignData({ ancestryContent: upsertEntry(data.ancestryContent, entry, a => a.ancestryId) })}
                        onDelete={id => updateCampaignData({ ancestryContent: removeEntry(data.ancestryContent, a => a.ancestryId, id) })}
                        referenceWarning={a => referenceWarning('ancestryContent', a.ancestryId, ancestryNameFor(a.ancestryId))}
                        emptyLabel="No ancestry content yet."
                    />
                );
        }
    };

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
                        {tab.label} ({data[tab.key].length})
                    </button>
                ))}
            </div>

            <section className="bg-cosmere-parchment p-6 rounded-lg shadow-lg border border-cosmere-gold/50">
                {renderEditor()}
            </section>
        </div>
    );
};
