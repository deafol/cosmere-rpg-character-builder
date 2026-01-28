"use client";

import React, { useRef, useState } from 'react';
import { CharacterForm } from './forms/CharacterForm';
import { useCharacter } from '../context/CharacterContext';
import { initialCharacterData } from '../types/character';
import { exportToPdf } from '../utils/pdfExport';
import { serializeCharacter, deserializeCharacter, isCompactFormat } from '../utils/characterSerializer';
import { Modal, NotificationModal } from './ui';
import Image from 'next/image';

// Import data for deserialization lookups
import ancestriesData from '../data/ancestries.json';
import heroicPathsData from '../data/heroic_paths.json';
import radiantPathsData from '../data/radiant_paths.json';
import weaponsData from '../data/weapons.json';
import armorData from '../data/armor.json';
import equipmentData from '../data/equipment.json';
import heroicTalents from '../data/heroic_talents.json';
import radiantTalents from '../data/radiant_talents.json';
const talentsData = { ...heroicTalents, ...radiantTalents };

export const BuilderLayout = () => {
    const { data, loadData, resetData } = useCharacter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Track if character has been modified (unsaved changes)
    const [lastSavedData, setLastSavedData] = useState(() => JSON.stringify(data));

    // Derive unsaved changes
    const hasUnsavedChanges = lastSavedData !== JSON.stringify(data);

    // Modal states
    const [showNewCharacterModal, setShowNewCharacterModal] = useState(false);
    const [showLoadWarningModal, setShowLoadWarningModal] = useState(false);
    const [showNotification, setShowNotification] = useState(false);
    const [notificationConfig, setNotificationConfig] = useState({ title: "", message: "", variant: "info" as "info" | "success" | "error" | "warning" });

    const showNotificationModal = (title: string, message: string, variant: "info" | "success" | "error" | "warning" = "info") => {
        setNotificationConfig({ title, message, variant });
        setShowNotification(true);
    };

    const handleSave = () => {
        // Use compact format for saving
        const compactData = serializeCharacter(data, {
            weapons: weaponsData,
            armor: armorData,
            equipment: equipmentData
        });
        const jsonString = JSON.stringify(compactData, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${data.characterName || "character"}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Mark as saved
        setLastSavedData(JSON.stringify(data));
    };

    const handleLoadClick = () => {
        if (hasUnsavedChanges) {
            setShowLoadWarningModal(true);
        } else {
            fileInputRef.current?.click();
        }
    };

    const handleLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const parsed = JSON.parse(event.target?.result as string);
                let loadedData;
                let characterName = "";

                if (isCompactFormat(parsed)) {
                    // New compact format
                    loadedData = deserializeCharacter(
                        parsed,
                        ancestriesData,
                        heroicPathsData,
                        radiantPathsData,
                        weaponsData,
                        armorData,
                        equipmentData,
                        talentsData
                    ); // Pass talentsData for full reconstruction
                    characterName = parsed.c;
                } else {
                    // Legacy full format - merge with defaults
                    loadedData = { ...initialCharacterData, ...parsed };
                    characterName = parsed.characterName || "character";
                }

                loadData(loadedData);
                setLastSavedData(JSON.stringify(loadedData));
                showNotificationModal("Character Loaded", `Successfully loaded ${characterName}!`, "success");
            } catch (error) {
                console.error("Failed to load JSON", error);
                showNotificationModal("Load Failed", "Failed to load character file. Please check the file format.", "error");
            }
        };
        reader.readAsText(file);
        // Reset the input so the same file can be loaded again
        e.target.value = "";
    };

    const handleNewCharacter = () => {
        if (hasUnsavedChanges) {
            setShowNewCharacterModal(true);
        } else {
            createNewCharacter();
        }
    };

    const createNewCharacter = () => {
        resetData();
        setLastSavedData(JSON.stringify(initialCharacterData));
        setShowNewCharacterModal(false);
    };

    return (
        <>
            <div className="max-w-[1200px] mx-auto min-h-screen pb-12 font-body">
                <header className="mb-8 flex justify-between items-center bg-cosmere-blue text-stone-100 p-6 rounded-b-lg shadow-lg border-b-4 border-cosmere-gold">
                    <div className="w-36 h-36 relative">
                        <Image src="/icons/paths/radiant/bondsmith.png" alt="" fill className="object-contain" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-display font-bold tracking-widest text-cosmere-gold drop-shadow-md">COSMERE RPG</h1>
                        <span className="text-xl font-body tracking-[0.2em] text-cosmere-gold font-bold block mt-1">Character Builder</span>
                    </div>

                    <div className="flex gap-4 items-center">
                        <div className="flex gap-3">
                            <button
                                onClick={handleNewCharacter}
                                className="bg-cosmere-blue border border-cosmere-gold/50 text-cosmere-gold hover:bg-cosmere-blue-hover px-4 py-2 rounded text-xs uppercase font-bold tracking-wider transition-colors"
                            >
                                New Character
                            </button>
                            <button
                                onClick={handleLoadClick}
                                className="bg-cosmere-blue border border-cosmere-gold/50 text-cosmere-gold hover:bg-cosmere-blue-hover px-4 py-2 rounded text-xs uppercase font-bold tracking-wider transition-colors"
                            >
                                Load Character
                            </button>
                            <button
                                onClick={handleSave}
                                className="bg-cosmere-blue border border-cosmere-gold/50 text-cosmere-gold hover:bg-cosmere-blue-hover px-4 py-2 rounded text-xs uppercase font-bold tracking-wider transition-colors relative"
                            >
                                Save Character
                                {hasUnsavedChanges && (
                                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full animate-pulse" title="Unsaved changes" />
                                )}
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleLoad}
                                accept=".json"
                                className="hidden"
                            />
                            <button
                                onClick={() => exportToPdf(data)}
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

            {/* New Character Confirmation Modal */}
            <Modal
                isOpen={showNewCharacterModal}
                title="Create New Character?"
                message="You have unsaved changes. Creating a new character will discard all current progress. Are you sure you want to continue?"
                confirmText="Create New"
                cancelText="Cancel"
                onConfirm={createNewCharacter}
                onCancel={() => setShowNewCharacterModal(false)}
                variant="warning"
            />

            {/* Load Character Warning Modal */}
            <Modal
                isOpen={showLoadWarningModal}
                title="Load Character?"
                message="You have unsaved changes. Loading a character will discard all current progress. Are you sure you want to continue?"
                confirmText="Load"
                cancelText="Cancel"
                onConfirm={() => {
                    setShowLoadWarningModal(false);
                    fileInputRef.current?.click();
                }}
                onCancel={() => setShowLoadWarningModal(false)}
                variant="warning"
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
