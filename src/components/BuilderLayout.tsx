"use client";

import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CharacterForm } from './forms/CharacterForm';
import { useCharacter } from '../context/CharacterContext';
import { useCampaign } from '../context/CampaignContext';
import { useCharacterCampaignSync } from '../hooks/useCharacterCampaignSync';
import { exportToPdf } from '../utils/pdfExport';
import { exportCharacterFile, toCharacterSaveV3 } from '../utils/characterCampaignSerializer';
import { Modal, NotificationModal } from './ui';
import Image from 'next/image';

/**
 * Every edit autosaves into campaign.characters via useCharacterCampaignSync
 * (consent.md phase 7) — there's no local "unsaved changes" state anymore.
 * Export/Import work with standalone CharacterSaveV3 files (embedded
 * snapshots, portable across campaigns); the old v1/v2 compact format and
 * its bundled-data reconstruction are gone.
 */
export const BuilderLayout = ({ campaignId, charId }: { campaignId: string; charId: string }) => {
    const router = useRouter();
    const { data } = useCharacter();
    const { campaign, importCharacterFile } = useCampaign();
    const { currentId, notFound } = useCharacterCampaignSync(campaignId, charId);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [showImportWarning, setShowImportWarning] = useState(false);
    const [showNotification, setShowNotification] = useState(false);
    const [notificationConfig, setNotificationConfig] = useState({ title: "", message: "", variant: "info" as "info" | "success" | "error" | "warning" });

    const showNotificationModal = (title: string, message: string, variant: "info" | "success" | "error" | "warning" = "info") => {
        setNotificationConfig({ title, message, variant });
        setShowNotification(true);
    };

    if (notFound) {
        return (
            <div className="max-w-xl mx-auto py-24 text-center font-body">
                <p className="text-stone-600 mb-4">Character not found in this campaign.</p>
                <Link href={`/campaign/${campaignId}`} className="text-cosmere-blue underline">Back to campaign</Link>
            </div>
        );
    }

    const handleExport = () => {
        if (!campaign || !currentId) return;
        const save = toCharacterSaveV3(data, campaignId, campaign.data, currentId);
        const json = exportCharacterFile(save, campaign.data);
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${data.characterName || "character"}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleImportClick = () => setShowImportWarning(true);

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const character = importCharacterFile(event.target?.result as string);
                router.push(`/campaign/${campaignId}/character/${character.id}`);
            } catch (error) {
                console.error("Failed to import character", error);
                showNotificationModal("Import Failed", "That file is not a valid character export.", "error");
            }
        };
        reader.readAsText(file);
        e.target.value = "";
    };

    return (
        <>
            <div className="max-w-[1200px] mx-auto min-h-screen pb-12 font-body">
                <header className="mb-8 flex justify-between items-center bg-cosmere-blue text-stone-100 p-6 rounded-b-lg shadow-lg border-b-4 border-cosmere-gold">
                    <div className="w-36 h-36 relative">
                        <Image src="/icons/paths/radiant/bondsmith.png" alt="" fill sizes="144px" className="object-contain" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-display font-bold tracking-widest text-cosmere-gold drop-shadow-md">COSMERE RPG</h1>
                        <span className="text-xl font-body tracking-[0.2em] text-cosmere-gold font-bold block mt-1">Character Builder</span>
                    </div>

                    <div className="flex gap-4 items-center">
                        <div className="flex gap-3">
                            <button
                                onClick={() => router.push(`/campaign/${campaignId}/character/new`)}
                                className="bg-cosmere-blue border border-cosmere-gold/50 text-cosmere-gold hover:bg-cosmere-blue-hover px-4 py-2 rounded text-xs uppercase font-bold tracking-wider transition-colors"
                            >
                                New Character
                            </button>
                            <button
                                onClick={handleImportClick}
                                className="bg-cosmere-blue border border-cosmere-gold/50 text-cosmere-gold hover:bg-cosmere-blue-hover px-4 py-2 rounded text-xs uppercase font-bold tracking-wider transition-colors"
                            >
                                Import Character
                            </button>
                            <button
                                onClick={handleExport}
                                className="bg-cosmere-blue border border-cosmere-gold/50 text-cosmere-gold hover:bg-cosmere-blue-hover px-4 py-2 rounded text-xs uppercase font-bold tracking-wider transition-colors"
                            >
                                Export Character
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImport}
                                accept=".json"
                                className="hidden"
                            />
                            <button
                                onClick={() => campaign && exportToPdf(data, campaign.data)}
                                className="bg-cosmere-gold text-cosmere-blue hover:brightness-90 border border-transparent px-4 py-2 rounded text-xs uppercase font-bold tracking-wider shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                            >
                                Export PDF
                            </button>
                        </div>
                    </div>
                </header>

                <div className="px-4">
                    <div className="bg-cosmere-parchment p-8 rounded-lg shadow-2xl border border-b-4 border-cosmere-gold border-cosmere-gold/90 relative">
                        <CharacterForm />
                    </div>
                </div>
            </div>

            {/* Import Character Warning Modal */}
            <Modal
                isOpen={showImportWarning}
                title="Import Character?"
                message="This adds or updates a character in this campaign's roster from a file — it won't affect the character you're currently editing unless the file has the same id."
                confirmText="Choose File"
                cancelText="Cancel"
                onConfirm={() => {
                    setShowImportWarning(false);
                    fileInputRef.current?.click();
                }}
                onCancel={() => setShowImportWarning(false)}
                variant="info"
            />

            {/* Notification Modal */}
            <NotificationModal
                isOpen={showNotification}
                title={notificationConfig.title}
                message={notificationConfig.message}
                onClose={() => setShowNotification(false)}
                variant={notificationConfig.variant}
            />
        </>
    );
};
