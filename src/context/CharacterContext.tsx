"use client";

import { createContext, ReactNode, useContext, useState } from 'react';
import surgesData from '../data/surges.json';
import { CharacterData, initialCharacterData } from '../types/character';

interface CharacterContextType {
    data: CharacterData;
    characterVersion: number;
    updateData: (updates: Partial<CharacterData>) => void;
    updateAttribute: (attr: keyof CharacterData['attributes'], value: number) => void;
    updateResource: (resource: keyof Pick<CharacterData, 'health' | 'focus' | 'investiture'>, field: 'current' | 'max', value: number) => void;
    updateSkillRank: (skillName: string, rank: number) => void;
    resetData: () => void;
    loadData: (data: CharacterData) => void;
}

const CharacterContext = createContext<CharacterContextType | undefined>(undefined);

export const CharacterProvider = ({ children }: { children: ReactNode }) => {
    const [data, setData] = useState<CharacterData>(initialCharacterData);
    const [characterVersion, setCharacterVersion] = useState(0);

    const updateData = (updates: Partial<CharacterData>) => {
        setData(prev => {
            const newData = { ...prev, ...updates };

            // Logic for Auto-Selecting Surges based on Radiant Paths
            if (updates.paths) {
                // 1. Identify all selected paths that are Radiant paths
                const activeWrapperNames = new Set(newData.paths.map(p => p.name));
                const allSurgeNames = new Set(surgesData.surges.map(s => s.name));

                // 2. Determine which Surges should be active
                const activeSurges = new Set<string>();

                surgesData.surges.forEach(surge => {
                    // Check if any of the surge's radiant_paths are in the character's active paths
                    const isActive = surge.radiant_paths.some(rp => activeWrapperNames.has(rp));
                    if (isActive) {
                        activeSurges.add(surge.name);
                    }
                });

                // 3. Update Skills
                // filter out any existing skills that are Surges but NOT active anymore
                const newSkills = newData.skills.filter(s => !allSurgeNames.has(s.name) || activeSurges.has(s.name));

                // add any active Surges that are NOT in skills yet
                activeSurges.forEach(surgeName => {
                    if (!newSkills.find(s => s.name === surgeName)) {
                        const surgeInfo = surgesData.surges.find(s => s.name === surgeName);
                        if (surgeInfo) {
                            const attr_abbrev = surgeInfo.attribute === 'Speed' ? 'SPD' : surgeInfo.attribute.slice(0, 3).toUpperCase();
                            newSkills.push({
                                name: surgeName,
                                attribute: surgeInfo.attribute,
                                attr_abbrev,
                                rank: 0 // Start at rank 0, user can mark it
                            });
                        }
                    }
                });

                newData.skills = newSkills;
            }

            return newData;
        });
    };

    const updateAttribute = (attr: keyof CharacterData['attributes'], value: number) => {
        setData(prev => {
            const newAttributes = { ...prev.attributes, [attr]: value };

            // Calculate Defenses
            const newDefenses = {
                ...prev.defenses,
                physical: 10 + newAttributes.strength + newAttributes.speed,
                cognitive: 10 + newAttributes.intellect + newAttributes.willpower,
                spiritual: 10 + newAttributes.awareness + newAttributes.presence,
            };

            // Calculate Lifting Capacity based on Strength
            let lifting = "100 lb.";
            let carrying = "50 lb.";
            const str = newAttributes.strength;
            if (str >= 9) {
                lifting = "10,000 lb.";
                carrying = "5,000 lb.";
            }
            else if (str >= 7) {
                lifting = "5,000 lb.";
                carrying = "2,500 lb.";
            }
            else if (str >= 5) {
                lifting = "1,000 lb.";
                carrying = "500 lb.";
            }
            else if (str >= 3) {
                lifting = "500 lb.";
                carrying = "250 lb.";
            }
            else if (str >= 1) {
                lifting = "200 lb.";
                carrying = "100 lb.";
            }

            // Calculate Senses Range based on Awareness
            let senses = "5 ft.";
            const awa = newAttributes.awareness;
            if (awa >= 9) senses = "Unobscured";
            else if (awa >= 7) senses = "100 ft.";
            else if (awa >= 5) senses = "50 ft.";
            else if (awa >= 3) senses = "20 ft.";
            else if (awa >= 1) senses = "10 ft.";

            // Calculate Movement based on Speed
            let move = 20;
            const spd = newAttributes.speed;
            if (spd >= 9) move = 80;
            else if (spd >= 7) move = 60;
            else if (spd >= 5) move = 40;
            else if (spd >= 3) move = 30;
            else if (spd >= 1) move = 25;

            // Calculate Recovery Die based on Willpower
            let recDie = "1d4";
            const wil = newAttributes.willpower;
            if (wil >= 7) recDie = "1d12";
            else if (wil >= 5) recDie = "1d10";
            else if (wil >= 3) recDie = "1d8";
            else if (wil >= 1) recDie = "1d6";

            return {
                ...prev,
                attributes: newAttributes,
                defenses: newDefenses,
                liftingCapacity: lifting,
                carryingCapacity: carrying,
                sensesRange: senses,
                movement: move,
                recoveryDie: recDie
            };
        });
    };

    const updateResource = (resource: keyof Pick<CharacterData, 'health' | 'focus' | 'investiture'>, field: 'current' | 'max', value: number) => {
        setData(prev => ({
            ...prev,
            [resource]: { ...prev[resource], [field]: value }
        }));
    };

    const updateSkillRank = (skillName: string, rank: number) => {
        setData(prev => ({
            ...prev,
            skills: prev.skills.map(skill =>
                skill.name === skillName ? { ...skill, rank: Math.max(0, Math.min(5, rank)) } : skill
            )
        }));
    };

    const resetData = () => {
        setData(initialCharacterData);
        setCharacterVersion(v => v + 1);
    };
    const loadData = (newData: CharacterData) => {
        setData(newData);
        setCharacterVersion(v => v + 1);
    };

    return (
        <CharacterContext.Provider value={{ data, characterVersion, updateData, updateAttribute, updateResource, updateSkillRank, resetData, loadData }}>
            {children}
        </CharacterContext.Provider>
    );
};

export const useCharacter = () => {
    const context = useContext(CharacterContext);
    if (context === undefined) {
        throw new Error('useCharacter must be used within a CharacterProvider');
    }
    return context;
};
