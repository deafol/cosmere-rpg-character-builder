"use client";

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCampaign } from '../context/CampaignContext';
import { useLoadedCampaign } from '../hooks/useLoadedCampaign';
import { Input, Label, Modal, NotificationModal } from './ui';

export const CampaignDashboard = ({ campaignId }: { campaignId: string }) => {
    const router = useRouter();
    const { updateCampaignMeta, closeCampaign, deleteCampaign, removeCharacter, exportCampaignFile, importCampaignFile } = useCampaign();
    const { campaign, notFound } = useLoadedCampaign(campaignId);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [pendingDeleteCharacterId, setPendingDeleteCharacterId] = useState<string | null>(null);
    const [includeCharactersOnExport, setIncludeCharactersOnExport] = useState(true);
    const [notification, setNotification] = useState<{ title: string; message: string; variant: 'info' | 'success' | 'error' | 'warning' } | null>(null);

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

    const handleExport = () => {
        const json = exportCampaignFile({ includeCharacters: includeCharactersOnExport });
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${campaign.name || 'campaign'}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleImportClick = () => fileInputRef.current?.click();

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                importCampaignFile(event.target?.result as string);
                setNotification({ title: 'Campaign Merged', message: 'The imported file was merged into this campaign.', variant: 'success' });
            } catch (error) {
                console.error('Failed to import campaign', error);
                setNotification({ title: 'Import Failed', message: 'That file is not a valid campaign export.', variant: 'error' });
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const handleClose = () => {
        closeCampaign();
        router.push('/');
    };

    const handleDelete = () => {
        deleteCampaign(campaign.id);
        setShowDeleteModal(false);
        router.push('/');
    };

    const pendingDeleteCharacter = campaign.characters.find(c => c.id === pendingDeleteCharacterId) ?? null;

    const handleDeleteCharacter = () => {
        if (pendingDeleteCharacterId) {
            removeCharacter(pendingDeleteCharacterId);
            setPendingDeleteCharacterId(null);
        }
    };

    return (
        <div className="max-w-3xl mx-auto min-h-screen py-10 px-4 font-body">
            <Link href="/" className="text-sm text-cosmere-blue underline mb-6 inline-block">← All campaigns</Link>

            <header className="bg-cosmere-blue text-stone-100 p-6 rounded-lg shadow-lg border-b-4 border-cosmere-gold mb-8 space-y-3">
                <div>
                    <Label className="text-cosmere-gold/70">Campaign Name</Label>
                    <Input
                        value={campaign.name}
                        onChange={e => updateCampaignMeta({ name: e.target.value })}
                        className="text-xl font-display font-bold"
                    />
                </div>
                <div>
                    <Label className="text-cosmere-gold/70">Description</Label>
                    <Input
                        value={campaign.description ?? ''}
                        onChange={e => updateCampaignMeta({ description: e.target.value })}
                        placeholder="A short summary for your table"
                    />
                </div>
            </header>

            <section className="bg-cosmere-parchment p-6 rounded-lg shadow-lg border border-cosmere-gold/50 mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-display font-bold text-cosmere-blue">Characters</h2>
                    <button
                        onClick={() => router.push(`/campaign/${campaign.id}/character/new`)}
                        className="bg-cosmere-gold text-cosmere-blue hover:brightness-90 px-4 py-2 rounded text-xs uppercase font-bold tracking-wider shadow-md transition-all"
                    >
                        New Character
                    </button>
                </div>
                {campaign.characters.length === 0 ? (
                    <p className="text-stone-500 text-sm">No characters yet.</p>
                ) : (
                    <ul className="divide-y divide-cosmere-gold/30">
                        {campaign.characters.map(character => (
                            <li key={character.id} className="py-3 flex items-center justify-between">
                                <div>
                                    <div className="font-bold text-cosmere-blue">{character.characterName || 'Unnamed'}</div>
                                    <div className="text-xs text-stone-500">Level {character.level} · Played by {character.playerName || 'Unknown'}</div>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <button
                                        onClick={() => router.push(`/campaign/${campaign.id}/character/${character.id}`)}
                                        className="bg-cosmere-blue border border-cosmere-gold/50 text-cosmere-gold hover:bg-cosmere-blue-hover px-4 py-2 rounded text-xs uppercase font-bold tracking-wider transition-colors"
                                    >
                                        Open
                                    </button>
                                    <button
                                        onClick={() => setPendingDeleteCharacterId(character.id)}
                                        className="border border-red-400 text-red-500 hover:bg-red-50 px-4 py-2 rounded text-xs uppercase font-bold tracking-wider transition-colors"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <section className="bg-cosmere-parchment p-6 rounded-lg shadow-lg border border-cosmere-gold/50 mb-8">
                <h2 className="text-xl font-display font-bold text-cosmere-blue mb-4">Campaign Data</h2>
                <p className="text-sm text-stone-600 mb-4">
                    Talents, paths, surges, expertises, weapons, armor and equipment for this campaign — entered
                    and edited by your table, not bundled with the app.
                </p>
                <Link
                    href={`/campaign/${campaign.id}/settings`}
                    className="inline-block bg-cosmere-blue border border-cosmere-gold/50 text-cosmere-gold hover:bg-cosmere-blue-hover px-4 py-2 rounded text-xs uppercase font-bold tracking-wider transition-colors"
                >
                    Open Campaign Settings
                </Link>
            </section>

            <section className="bg-cosmere-parchment p-6 rounded-lg shadow-lg border border-cosmere-gold/50 mb-8">
                <h2 className="text-xl font-display font-bold text-cosmere-blue mb-4">Save & Share</h2>
                <div className="flex flex-wrap items-center gap-4">
                    <label className="flex items-center gap-2 text-sm text-stone-700">
                        <input
                            type="checkbox"
                            checked={includeCharactersOnExport}
                            onChange={e => setIncludeCharactersOnExport(e.target.checked)}
                        />
                        Include characters in export
                    </label>
                    <button
                        onClick={handleExport}
                        className="bg-cosmere-gold text-cosmere-blue hover:brightness-90 px-4 py-2 rounded text-xs uppercase font-bold tracking-wider shadow-md transition-all"
                    >
                        Export Campaign
                    </button>
                    <button
                        onClick={handleImportClick}
                        className="bg-cosmere-blue border border-cosmere-gold/50 text-cosmere-gold hover:bg-cosmere-blue-hover px-4 py-2 rounded text-xs uppercase font-bold tracking-wider transition-colors"
                    >
                        Import & Merge File
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />
                </div>
            </section>

            <section className="flex gap-4">
                <button
                    onClick={handleClose}
                    className="border border-cosmere-blue/40 text-cosmere-blue hover:bg-cosmere-blue/10 px-4 py-2 rounded text-xs uppercase font-bold tracking-wider transition-colors"
                >
                    Close Campaign
                </button>
                <button
                    onClick={() => setShowDeleteModal(true)}
                    className="border border-red-400 text-red-500 hover:bg-red-50 px-4 py-2 rounded text-xs uppercase font-bold tracking-wider transition-colors"
                >
                    Delete Campaign
                </button>
            </section>

            <Modal
                isOpen={showDeleteModal}
                title="Delete Campaign?"
                message="This removes the campaign and every character in it from this device. Export a backup first if you want to keep it."
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={handleDelete}
                onCancel={() => setShowDeleteModal(false)}
                variant="warning"
            />

            <Modal
                isOpen={pendingDeleteCharacterId !== null}
                title="Delete Character?"
                message={`Remove "${pendingDeleteCharacter?.characterName || 'Unnamed'}" from this campaign? Export a backup first if you want to keep it.`}
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={handleDeleteCharacter}
                onCancel={() => setPendingDeleteCharacterId(null)}
                variant="warning"
            />

            <NotificationModal
                isOpen={notification !== null}
                title={notification?.title ?? ''}
                message={notification?.message ?? ''}
                variant={notification?.variant}
                onClose={() => setNotification(null)}
            />
        </div>
    );
};
