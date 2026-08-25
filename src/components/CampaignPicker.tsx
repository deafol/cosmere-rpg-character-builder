"use client";

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCampaign } from '../context/CampaignContext';
import { CampaignSummary } from '../utils/campaignStorage';
import { Input, Label } from './ui';
import { Modal, NotificationModal } from './ui';

export const CampaignPicker = () => {
    const router = useRouter();
    const { listCampaigns, createCampaign, deleteCampaign, importCampaignFile } = useCampaign();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [summaries, setSummaries] = useState<CampaignSummary[]>([]);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
    const [notification, setNotification] = useState<{ title: string; message: string; variant: 'info' | 'success' | 'error' | 'warning' } | null>(null);

    const refresh = () => setSummaries(listCampaigns());

    useEffect(() => {
        refresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        const campaign = createCampaign(name.trim(), description.trim() || undefined);
        router.push(`/campaign/${campaign.id}`);
    };

    const handleImportClick = () => fileInputRef.current?.click();

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = event.target?.result as string;
                const campaign = importCampaignFile(json);
                router.push(`/campaign/${campaign.id}`);
            } catch (error) {
                console.error('Failed to import campaign', error);
                setNotification({ title: 'Import Failed', message: 'That file is not a valid campaign export.', variant: 'error' });
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const confirmDelete = () => {
        if (pendingDeleteId) {
            deleteCampaign(pendingDeleteId);
            setPendingDeleteId(null);
            refresh();
        }
    };

    return (
        <div className="max-w-3xl mx-auto min-h-screen py-12 px-4 font-body">
            <header className="text-center mb-10">
                <h1 className="text-4xl font-display font-bold tracking-widest text-cosmere-blue">COSMERE RPG</h1>
                <span className="text-lg font-body tracking-[0.2em] text-cosmere-blue/70 font-bold block mt-1">Campaigns</span>
            </header>

            <section className="bg-cosmere-parchment p-6 rounded-lg shadow-lg border border-cosmere-gold/50 mb-8">
                <h2 className="text-xl font-display font-bold text-cosmere-blue mb-4">Your Campaigns</h2>
                {summaries.length === 0 ? (
                    <p className="text-stone-500 text-sm">No campaigns yet — create one below, or import a campaign file.</p>
                ) : (
                    <ul className="divide-y divide-cosmere-gold/30">
                        {summaries.map(summary => (
                            <li key={summary.id} className="py-3 flex items-center justify-between gap-4">
                                <div>
                                    <div className="font-bold text-cosmere-blue">{summary.name}</div>
                                    <div className="text-xs text-stone-500">Updated {new Date(summary.updatedAt).toLocaleString()}</div>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <button
                                        onClick={() => router.push(`/campaign/${summary.id}`)}
                                        className="bg-cosmere-blue border border-cosmere-gold/50 text-cosmere-gold hover:bg-cosmere-blue-hover px-4 py-2 rounded text-xs uppercase font-bold tracking-wider transition-colors"
                                    >
                                        Open
                                    </button>
                                    <button
                                        onClick={() => setPendingDeleteId(summary.id)}
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
                <h2 className="text-xl font-display font-bold text-cosmere-blue mb-4">New Campaign</h2>
                <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                        <Label>Campaign Name</Label>
                        <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. The Shattered Plains" required />
                    </div>
                    <div>
                        <Label>Description (optional)</Label>
                        <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="A short summary for your table" />
                    </div>
                    <button
                        type="submit"
                        className="bg-cosmere-gold text-cosmere-blue hover:brightness-90 border border-transparent px-4 py-2 rounded text-xs uppercase font-bold tracking-wider shadow-lg hover:shadow-xl transition-all"
                    >
                        Create Campaign
                    </button>
                </form>
            </section>

            <section className="text-center">
                <button
                    onClick={handleImportClick}
                    className="bg-cosmere-blue border border-cosmere-gold/50 text-cosmere-gold hover:bg-cosmere-blue-hover px-4 py-2 rounded text-xs uppercase font-bold tracking-wider transition-colors"
                >
                    Import Campaign File
                </button>
                <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />
            </section>

            <Modal
                isOpen={pendingDeleteId !== null}
                title="Delete Campaign?"
                message="This removes the campaign and every character in it from this device. This cannot be undone here — make sure you've exported a backup first."
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={confirmDelete}
                onCancel={() => setPendingDeleteId(null)}
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
