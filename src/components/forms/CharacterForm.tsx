"use client";

import { useEffect, useState } from 'react';
import { useCharacter } from '../../context/CharacterContext';
import { Label, Input, Select, NumberControl, CollapsiblePanel, DividerDecoration } from '../ui';

// Import data directly (Next.js handles JSON imports)
import heroicPathsData from '../../data/heroic_paths.json';
import radiantPathsData from '../../data/radiant_paths.json';
import ancestriesData from '../../data/ancestries.json';
import weaponsData from '../../data/weapons.json';
import heroicTalents from '../../data/heroic_talents.json';
import radiantTalents from '../../data/radiant_talents.json';

// Type for talent lookup data structure
interface TalentDataEntry {
    name: string;
    specialty?: string;
    activation?: string;
    description?: string;
    isKeyTalent?: boolean;
    prerequisites?: string;
}

interface PathTalentData {
    keyTalent?: string;
    talents: TalentDataEntry[];
}

type TalentsDataMap = Record<string, PathTalentData>;

const talentsData: TalentsDataMap = { ...heroicTalents, ...radiantTalents };
import expertisesData from '../../data/expertises.json';
import armorData from '../../data/armor.json';
import equipmentData from '../../data/equipment.json';
import { User, Activity, Sparkles, Sword, Scroll } from 'lucide-react';
import { Talent, HeroicPath, Ancestry, Armor, EquipmentItem, Weapon } from '../../types/character';

export const CharacterForm = () => {
    const { data, characterVersion, updateData, updateAttribute, updateResource, updateSkillRank } = useCharacter();
    const [showStatement, setShowStatement] = useState(false);

    // Auto-open first panel when character is new/loaded
    // (Handled via key={characterVersion} and defaultOpen on the panel below)

    // Auto-select key talents when paths change
    useEffect(() => {
        const requiredKeyTalents: Talent[] = [];

        data.paths.forEach((path: HeroicPath) => {
            let talentName = "";
            let description = "";

            // 1. Try getting Key Talent from static data (works for Radiant paths)
            const pathData = talentsData[path.name];
            if (pathData?.keyTalent) {
                talentName = pathData.keyTalent;
                const talentFromDb = pathData.talents.find((t) => t.name === talentName);
                description = talentFromDb?.description || "";
            }

            // 2. Fallback: Parse from key_attributes (Legacy/Heroic paths)
            if (!talentName && path.key_attributes) {
                const keyTalentAttr = path.key_attributes.find((attr: string) => attr.includes('Key Talent'));
                if (keyTalentAttr) {
                    const match = keyTalentAttr.match(/^(.+?)\s*\(Key Talent\)/);
                    if (match) {
                        talentName = match[1].trim();
                        // Try to find description in DB if possible, otherwise use attribute text
                        const talentFromDb = pathData?.talents.find((t) => t.name === talentName);
                        description = talentFromDb?.description || keyTalentAttr;
                    }
                }
            }

            if (talentName) {
                requiredKeyTalents.push({
                    name: talentName,
                    path: path.name,
                    isKeyTalent: true,
                    description: description
                });
            }
        });

        // Current non-key talents (preserve these)
        const nonKeyTalents = data.talents.filter(t => !t.isKeyTalent);

        // Check if update is needed
        const currentKeyTalents = data.talents.filter(t => t.isKeyTalent);

        // Simple comparison: Check names and paths to see if the SET of key talents changed
        const stringsCurrent = currentKeyTalents.map(t => `${t.name}|${t.path}`).sort().join(',');
        const stringsRequired = requiredKeyTalents.map(t => `${t.name}|${t.path}`).sort().join(',');

        const hasRadiantPath = data.paths.some(p => radiantPathsData.some((rp: HeroicPath) => rp.name === p.name));
        const shouldResetIdeal = !hasRadiantPath && data.radiantIdeal !== 0;

        if (stringsCurrent !== stringsRequired) {
            // Update: Put Key Talents FIRST
            updateData({
                talents: [...requiredKeyTalents, ...nonKeyTalents],
                ...(shouldResetIdeal ? { radiantIdeal: 0 } : {})
            });
        } else if (shouldResetIdeal) {
            updateData({ radiantIdeal: 0 });
        }

    }, [data.paths, data.talents, data.radiantIdeal, updateData]);

    // Compute and store surges from extra skills
    useEffect(() => {
        const standardSkillNames = new Set([
            "Agility", "Athletics", "Heavy Weaponry", "Light Weaponry", "Stealth", "Thievery",
            "Crafting", "Deduction", "Discipline", "Intimidation", "Lore", "Medicine",
            "Deception", "Insight", "Leadership", "Perception", "Persuasion", "Survival"
        ]);

        const rankMap = [
            { die: "d4", size: "2.5 ft" },
            { die: "d6", size: "5 ft" },
            { die: "d8", size: "10 ft" },
            { die: "d10", size: "15 ft" },
            { die: "d12", size: "20 ft" }
        ];

        const surgeSkills = data.skills.filter(s => !standardSkillNames.has(s.name));

        const computedSurges = surgeSkills.map(s => {
            const attrKey = s.attribute.toLowerCase() as keyof typeof data.attributes;
            const attrVal = data.attributes[attrKey] || 0;
            const rank = s.rank || 0;
            const modifier = rank === 0 ? 0 : attrVal + rank;

            let die = "-";
            let size = "-";
            if (rank > 0 && rank <= 5) {
                const info = rankMap[rank - 1];
                die = info.die;
                size = info.size;
            }

            return {
                name: s.name,
                attribute: s.attribute,
                attr_abbrev: s.attr_abbrev,
                rank,
                modifier,
                die,
                size
            };
        });

        // Only update if surges actually changed
        const currentSurgesStr = JSON.stringify(data.surges || []);
        const newSurgesStr = JSON.stringify(computedSurges);

        if (currentSurgesStr !== newSurgesStr) {
            updateData({ surges: computedSurges });
        }
    }, [data, updateData]);

    return (
        <div className="pb-10">
            {/* Group 1: General Characteristics */}
            <CollapsiblePanel key={characterVersion} title="General Characteristics" icon={User} defaultOpen={characterVersion > 0}>
                <div className="space-y-6">
                    {/* Identity */}
                    <div className="space-y-6">
                        {/* Name Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <Label>Player Name</Label>
                                <Input
                                    value={data.playerName}
                                    onChange={(e) => updateData({ playerName: e.target.value })}
                                    placeholder="Your Name"
                                />
                            </div>
                            <div>
                                <Label>Character Name</Label>
                                <Input
                                    value={data.characterName}
                                    onChange={(e) => updateData({ characterName: e.target.value })}
                                    placeholder="Character Name"
                                />
                            </div>
                        </div>

                        {/* Level & Ancestry Row */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                            {/* Level Control */}
                            <div className="md:col-span-3">
                                <div className="flex justify-between items-baseline mb-2">
                                    <Label className="text-center md:text-left block">Level</Label>
                                </div>
                                <div className="flex items-center gap-2 justify-center md:justify-start">
                                    <button
                                        onClick={() => updateData({ level: Math.max(1, data.level - 1) })}
                                        className="w-8 h-8 rounded-full border-2 border-cosmere-blue text-cosmere-blue hover:bg-cosmere-blue hover:text-cosmere-gold flex items-center justify-center transition-colors font-display font-bold text-xl shadow-sm"
                                        aria-label="Decrease Level"
                                    >
                                        −
                                    </button>
                                    <div className="w-12 text-center font-display text-2xl font-bold text-cosmere-blue">
                                        {data.level}
                                    </div>
                                    <button
                                        onClick={() => updateData({ level: data.level + 1 })}
                                        className="w-8 h-8 rounded-full border-2 border-cosmere-blue bg-cosmere-blue text-cosmere-gold hover:bg-cosmere-blue-hover flex items-center justify-center transition-colors font-display font-bold text-xl shadow-sm"
                                        aria-label="Increase Level"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            {/* Ancestry Selection */}
                            <div className="md:col-span-9">
                                <div className="flex justify-between items-baseline mb-2">
                                    <Label>Ancestry</Label>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {ancestriesData.map((a: Ancestry) => {
                                        const isSelected = data.ancestry?.name === a.name;
                                        return (
                                            <button
                                                key={a.name}
                                                onClick={() => updateData({ ancestry: a })}
                                                className={`px-3 py-1 text-m rounded border transition-all font-display font-bold uppercase tracking-wide shadow-sm
                                                    ${isSelected
                                                        ? 'bg-cosmere-blue text-cosmere-gold border-cosmere-gold transform scale-105 ring-1 ring-cosmere-gold'
                                                        : 'bg-white/50 text-cosmere-blue/80 border-cosmere-blue/20 hover:bg-cosmere-blue/5 hover:border-cosmere-blue/50'
                                                    }`}
                                            >
                                                {a.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4">
                        <div className="flex justify-between items-baseline mb-2">
                            <Label>Heroic Path</Label>
                        </div>
                        <div className="flex flex-wrap gap-4 mb-8">
                            {heroicPathsData.map((path: HeroicPath) => {
                                const isSelected = data.paths.some(p => p.name === path.name);
                                return (
                                    <button
                                        key={path.name}
                                        onClick={() => {
                                            if (isSelected) {
                                                // Deselect: Remove this specific path, keep everything else
                                                updateData({ paths: data.paths.filter(p => p.name !== path.name) });
                                            } else {
                                                // Select: Add this path, keep everything else
                                                updateData({ paths: [...data.paths, path] });
                                            }
                                        }}
                                        className={`px-3 py-1 text-m rounded border transition-all font-display font-bold uppercase tracking-wide ${isSelected ? 'bg-cosmere-blue text-cosmere-gold border-cosmere-gold shadow-md transform scale-105' : 'bg-transparent text-cosmere-blue/70 border-cosmere-blue/20 hover:bg-cosmere-blue/5 hover:border-cosmere-blue/50'}`}
                                    >
                                        {path.name}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex justify-between items-baseline mb-2">
                            <Label>Radiant Path</Label>
                        </div>
                        <div className="flex flex-wrap gap-4 mt-2 mb-8">
                            {radiantPathsData.map((path: HeroicPath) => {
                                const isSelected = data.paths.some(p => p.name === path.name);
                                return (
                                    <button
                                        key={path.name}
                                        onClick={() => {
                                            // Heroic paths are now separate, so we filter by checking against heroicPathsData
                                            const currentHeroicPaths = data.paths.filter(p => heroicPathsData.some((hp: HeroicPath) => hp.name === p.name));
                                            if (isSelected) {
                                                updateData({ paths: currentHeroicPaths, radiantPath: "" });
                                            } else {
                                                updateData({ paths: [...currentHeroicPaths, path], radiantPath: path.name });
                                            }
                                        }}
                                        className={`px-3 py-1 text-m rounded border transition-all font-display font-bold uppercase tracking-wide ${isSelected ? 'bg-cosmere-blue text-cosmere-gold border-cosmere-gold shadow-md transform scale-105' : 'bg-transparent text-cosmere-blue/70 border-cosmere-blue/20 hover:bg-cosmere-blue/5 hover:border-cosmere-blue/50'}`}
                                    >
                                        {path.name}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Radiant Ideal */}
                        {(() => {
                            const hasRadiantPath = data.paths.some(p => radiantPathsData.some((rp: HeroicPath) => rp.name === p.name));

                            return (
                                <>
                                    <div className={`flex justify-between items-baseline mb-2 mt-4 ${!hasRadiantPath ? 'opacity-50' : ''}`}>
                                        <Label>Radiant Ideal</Label>
                                    </div>
                                    <div className={`flex flex-wrap gap-2 items-center ${!hasRadiantPath ? 'opacity-50 pointer-events-none' : ''}`}>
                                        {[1, 2, 3, 4, 5].map((level) => {
                                            const isChecked = hasRadiantPath && (data.radiantIdeal || 0) >= level;
                                            return (
                                                <button
                                                    key={level}
                                                    onClick={() => {
                                                        if (!hasRadiantPath) return;
                                                        const current = data.radiantIdeal || 0;
                                                        updateData({ radiantIdeal: current === level ? level - 1 : level });
                                                    }}
                                                    className={`
                                                        flex items-center gap-2 px-3 py-1.5 rounded border text-xs font-display font-bold uppercase tracking-wide transition-all shadow-sm
                                                        ${isChecked
                                                            ? 'bg-cosmere-blue border-cosmere-gold text-cosmere-gold transform scale-105'
                                                            : 'bg-white/50 border-cosmere-blue/20 text-stone-500 hover:bg-cosmere-blue/5 hover:border-cosmere-blue/50'}
                                                    `}
                                                >
                                                    <div className={`w-3 h-3 rounded-sm border ${isChecked ? 'bg-cosmere-gold border-transparent' : 'bg-transparent border-cosmere-blue/40'}`} />
                                                    <span>{level}{level === 1 ? 'st' : level === 2 ? 'nd' : level === 3 ? 'rd' : 'th'}</span>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Spren Info */}
                                    <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 ${!hasRadiantPath ? 'opacity-50 pointer-events-none' : ''}`}>
                                        <div>
                                            <Label>Spren Name</Label>
                                            <Input
                                                value={data.sprenName || ""}
                                                onChange={(e) => updateData({ sprenName: e.target.value })}
                                                placeholder="Spren Name"
                                                disabled={!hasRadiantPath}
                                            />
                                        </div>
                                        <div>
                                            <Label>Spren Bond Range</Label>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => updateData({ bondRange: Math.max(30, (data.bondRange || 30) - 10) })}
                                                    disabled={!hasRadiantPath || (data.bondRange || 30) <= 30}
                                                    className="w-8 h-8 rounded-full border-2 border-cosmere-blue text-cosmere-blue hover:bg-cosmere-blue hover:text-cosmere-gold flex items-center justify-center transition-colors font-display font-bold text-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    −
                                                </button>
                                                <div className="w-24 text-center font-display text-lg font-bold text-cosmere-blue bg-white/50 py-1 rounded border border-cosmere-blue/10">
                                                    {data.bondRange || 30} ft
                                                </div>
                                                <button
                                                    onClick={() => updateData({ bondRange: Math.min(100, (data.bondRange || 30) + 10) })}
                                                    disabled={!hasRadiantPath || (data.bondRange || 30) >= 100}
                                                    className="w-8 h-8 rounded-full border-2 border-cosmere-blue bg-cosmere-blue text-cosmere-gold hover:bg-cosmere-blue-hover flex items-center justify-center transition-colors font-display font-bold text-xl shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>
            </CollapsiblePanel>

            {/* Group 2: Attributes, Skills & Resources */}
            <CollapsiblePanel title="Attributes, Skills & Resources" icon={Activity}>
                <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Physical Column */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between border-b-2 border-cosmere-gold mb-4 pb-1">
                                <h4 className="text-lg font-display font-bold uppercase text-cosmere-blue">Physical</h4>
                                <div className="text-sm font-bold text-stone-500">Defense
                                    <span className="font-display font-bold text-base text-cosmere-blue bg-cosmere-parchment px-1.5 rounded border border-cosmere-gold min-w-[1.5rem] text-center shadow-sm">
                                        {data.defenses.physical}
                                    </span>
                                </div>
                            </div>

                            {/* Physical Attributes */}
                            <h4 className="font-bold text-sm uppercase text-stone-500 mb-4">Attributes</h4>
                            <div className="bg-white/50 p-4 rounded-lg border border-cosmere-blue/10 space-y-4">
                                {['Strength', 'Speed'].map(attr => (
                                    <div key={attr} className="flex items-center justify-between">
                                        <Label className="mb-0">{attr}</Label>
                                        <NumberControl
                                            value={data.attributes[attr.toLowerCase() as keyof typeof data.attributes]}
                                            onChange={(val) => updateAttribute(attr.toLowerCase() as keyof typeof data.attributes, val)}
                                        />
                                    </div>
                                ))}


                            </div>

                            {/* Physical Skills */}
                            <div>
                                <h4 className="font-bold text-sm uppercase text-stone-500 mb-4">Skills</h4>
                                {data.skills.filter(s => s.attribute === "Strength" || s.attribute === "Speed").map(skill => {
                                    const attrValue = data.attributes[skill.attribute.toLowerCase() as keyof typeof data.attributes];
                                    const standardNames = new Set([
                                        "Agility", "Athletics", "Heavy Weaponry", "Light Weaponry", "Stealth", "Thievery",
                                        "Crafting", "Deduction", "Discipline", "Intimidation", "Lore", "Medicine",
                                        "Deception", "Insight", "Leadership", "Perception", "Persuasion", "Survival"
                                    ]);
                                    const isSurge = !standardNames.has(skill.name);
                                    const surgeModifier = isSurge ? (skill.rank === 0 ? 0 : attrValue + skill.rank) : null;

                                    // Calculate Surge Size and Die
                                    let surgeDie = "-";
                                    let surgeSize = "-";
                                    if (isSurge && skill.rank > 0) {
                                        const rankMap = [
                                            { die: "d4", size: "S" },
                                            { die: "d6", size: "M" },
                                            { die: "d8", size: "L" },
                                            { die: "d10", size: "H" },
                                            { die: "d12", size: "G" }
                                        ];
                                        const info = rankMap[Math.min(skill.rank, 5) - 1];
                                        if (info) {
                                            surgeDie = info.die;
                                            surgeSize = info.size;
                                        }
                                    }

                                    return (
                                        <div key={skill.name} className="mb-2 p-2 bg-stone-50 rounded border border-stone-200">
                                            <div className="flex items-center justify-between mb-1">
                                                <label className="text-sm font-bold text-stone-700">{skill.name}
                                                    <span className="text-[10px] text-stone-400 font-display uppercase italic"> ({skill.attr_abbrev})</span>
                                                </label>
                                                <div className="flex items-center gap-1">
                                                    {isSurge && (
                                                        <>
                                                            <span className="font-display font-bold text-base text-white bg-cosmere-blue px-1.5 rounded border border-cosmere-gold min-w-[1.5rem] text-center shadow-sm" title="Surge Modifier">
                                                                {surgeModifier}
                                                            </span>
                                                            {skill.rank > 0 && (
                                                                <>
                                                                    <span className="font-display font-bold text-xs text-cosmere-blue bg-cosmere-blue/10 px-1.5 py-0.5 rounded border border-cosmere-blue/20" title="Surge Die">
                                                                        {surgeDie}
                                                                    </span>
                                                                    <span className="font-display font-bold text-xs text-cosmere-blue bg-cosmere-blue/10 px-1.5 py-0.5 rounded border border-cosmere-blue/20" title="Surge Size">
                                                                        {surgeSize}
                                                                    </span>
                                                                </>
                                                            )}
                                                        </>
                                                    )}
                                                    <span className="font-display font-bold text-base text-cosmere-blue bg-cosmere-parchment px-1.5 rounded border border-cosmere-gold min-w-[1.5rem] text-center shadow-sm" title="Attribute Score">
                                                        {attrValue}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 justify-end">
                                                {[1, 2, 3, 4, 5].map(rank => (
                                                    <button
                                                        key={rank}
                                                        onClick={() => updateSkillRank(skill.name, skill.rank === rank ? rank - 1 : rank)}
                                                        className={`text-base leading-none transition-colors ${skill.rank >= rank ? 'text-cosmere-blue' : 'text-stone-300 hover:text-cosmere-gold'}`}
                                                        title={`Rank ${rank}`}
                                                    >
                                                        {skill.rank >= rank ? '●' : '○'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Cognitive Column */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between border-b-2 border-cosmere-gold mb-4 pb-1">
                                <h4 className="text-lg font-display font-bold uppercase text-cosmere-blue">Cognitive</h4>
                                <div className="text-sm font-bold text-stone-500">Defense
                                    <span className="font-display font-bold text-base text-cosmere-blue bg-cosmere-parchment px-1.5 rounded border border-cosmere-gold min-w-[1.5rem] text-center shadow-sm">
                                        {data.defenses.cognitive}
                                    </span>
                                </div>
                            </div>

                            {/* Cognitive Attributes */}
                            <h4 className="font-bold text-sm uppercase text-stone-500 mb-4">Attributes</h4>
                            <div className="bg-white/50 p-4 rounded-lg border border-cosmere-blue/10 space-y-4">
                                {['Intellect', 'Willpower'].map(attr => (
                                    <div key={attr} className="flex items-center justify-between">
                                        <Label className="mb-0">{attr}</Label>
                                        <NumberControl
                                            value={data.attributes[attr.toLowerCase() as keyof typeof data.attributes]}
                                            onChange={(val) => updateAttribute(attr.toLowerCase() as keyof typeof data.attributes, val)}
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Cognitive Skills */}
                            <div>
                                <h4 className="font-bold text-sm uppercase text-stone-500 mb-4">Skills</h4>
                                {data.skills.filter(s => s.attribute === "Intellect" || s.attribute === "Willpower").map(skill => {
                                    const attrValue = data.attributes[skill.attribute.toLowerCase() as keyof typeof data.attributes];
                                    const standardNames = new Set([
                                        "Agility", "Athletics", "Heavy Weaponry", "Light Weaponry", "Stealth", "Thievery",
                                        "Crafting", "Deduction", "Discipline", "Intimidation", "Lore", "Medicine",
                                        "Deception", "Insight", "Leadership", "Perception", "Persuasion", "Survival"
                                    ]);
                                    const isSurge = !standardNames.has(skill.name);
                                    const surgeModifier = isSurge ? (skill.rank === 0 ? 0 : attrValue + skill.rank) : null;

                                    // Calculate Surge Size and Die
                                    let surgeDie = "-";
                                    let surgeSize = "-";
                                    if (isSurge && skill.rank > 0) {
                                        const rankMap = [
                                            { die: "d4", size: "S" },
                                            { die: "d6", size: "M" },
                                            { die: "d8", size: "L" },
                                            { die: "d10", size: "H" },
                                            { die: "d12", size: "G" }
                                        ];
                                        const info = rankMap[Math.min(skill.rank, 5) - 1];
                                        if (info) {
                                            surgeDie = info.die;
                                            surgeSize = info.size;
                                        }
                                    }

                                    return (
                                        <div key={skill.name} className="mb-2 p-2 bg-stone-50 rounded border border-stone-200">
                                            <div className="flex items-center justify-between mb-1">
                                                <label className="text-sm font-bold text-stone-700">{skill.name}
                                                    <span className="text-[10px] text-stone-400 font-display uppercase italic"> ({skill.attr_abbrev})</span>
                                                </label>
                                                <div className="flex items-center gap-1">
                                                    {isSurge && (
                                                        <>
                                                            <span className="font-display font-bold text-base text-white bg-cosmere-blue px-1.5 rounded border border-cosmere-gold min-w-[1.5rem] text-center shadow-sm" title="Surge Modifier">
                                                                {surgeModifier}
                                                            </span>
                                                            {skill.rank > 0 && (
                                                                <>
                                                                    <span className="font-display font-bold text-xs text-cosmere-blue bg-cosmere-blue/10 px-1.5 py-0.5 rounded border border-cosmere-blue/20" title="Surge Die">
                                                                        {surgeDie}
                                                                    </span>
                                                                    <span className="font-display font-bold text-xs text-cosmere-blue bg-cosmere-blue/10 px-1.5 py-0.5 rounded border border-cosmere-blue/20" title="Surge Size">
                                                                        {surgeSize}
                                                                    </span>
                                                                </>
                                                            )}
                                                        </>
                                                    )}
                                                    <span className="font-display font-bold text-base text-cosmere-blue bg-cosmere-parchment px-1.5 rounded border border-cosmere-gold min-w-[1.5rem] text-center shadow-sm" title="Attribute Score">
                                                        {attrValue}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 justify-end">
                                                {[1, 2, 3, 4, 5].map(rank => (
                                                    <button
                                                        key={rank}
                                                        onClick={() => updateSkillRank(skill.name, skill.rank === rank ? rank - 1 : rank)}
                                                        className={`text-base leading-none transition-colors ${skill.rank >= rank ? 'text-cosmere-blue' : 'text-stone-300 hover:text-cosmere-gold'}`}
                                                        title={`Rank ${rank}`}
                                                    >
                                                        {skill.rank >= rank ? '●' : '○'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Spiritual Column */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between border-b-2 border-cosmere-gold mb-4 pb-1">
                                <h4 className="text-lg font-display font-bold uppercase text-cosmere-blue">Spiritual</h4>
                                <div className="text-sm font-bold text-stone-500">Defense
                                    <span className="font-display font-bold text-base text-cosmere-blue bg-cosmere-parchment px-1.5 rounded border border-cosmere-gold min-w-[1.5rem] text-center shadow-sm">
                                        {data.defenses.spiritual}
                                    </span>
                                </div>
                            </div>

                            {/* Spiritual Attributes */}
                            <h4 className="font-bold text-sm uppercase text-stone-500 mb-4">Attributes</h4>
                            <div className="bg-white/50 p-4 rounded-lg border border-cosmere-blue/10 space-y-4">
                                {['Awareness', 'Presence'].map(attr => (
                                    <div key={attr} className="flex items-center justify-between">
                                        <Label className="mb-0">{attr}</Label>
                                        <NumberControl
                                            value={data.attributes[attr.toLowerCase() as keyof typeof data.attributes]}
                                            onChange={(val) => updateAttribute(attr.toLowerCase() as keyof typeof data.attributes, val)}
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Spiritual Skills */}
                            <div>
                                <h4 className="font-bold text-sm uppercase text-stone-500 mb-4">Skills</h4>
                                {data.skills.filter(s => s.attribute === "Awareness" || s.attribute === "Presence").map(skill => {
                                    const attrValue = data.attributes[skill.attribute.toLowerCase() as keyof typeof data.attributes];
                                    const standardNames = new Set([
                                        "Agility", "Athletics", "Heavy Weaponry", "Light Weaponry", "Stealth", "Thievery",
                                        "Crafting", "Deduction", "Discipline", "Intimidation", "Lore", "Medicine",
                                        "Deception", "Insight", "Leadership", "Perception", "Persuasion", "Survival"
                                    ]);
                                    const isSurge = !standardNames.has(skill.name);
                                    const surgeModifier = isSurge ? (skill.rank === 0 ? 0 : attrValue + skill.rank) : null;

                                    // Calculate Surge Size and Die
                                    let surgeDie = "-";
                                    let surgeSize = "-";
                                    if (isSurge && skill.rank > 0) {
                                        const rankMap = [
                                            { die: "d4", size: "S" },
                                            { die: "d6", size: "M" },
                                            { die: "d8", size: "L" },
                                            { die: "d10", size: "H" },
                                            { die: "d12", size: "G" }
                                        ];
                                        const info = rankMap[Math.min(skill.rank, 5) - 1];
                                        if (info) {
                                            surgeDie = info.die;
                                            surgeSize = info.size;
                                        }
                                    }

                                    return (
                                        <div key={skill.name} className="mb-2 p-2 bg-stone-50 rounded border border-stone-200">
                                            <div className="flex items-center justify-between mb-1">
                                                <label className="text-sm font-bold text-stone-700">{skill.name}
                                                    <span className="text-[10px] text-stone-400 font-display uppercase italic"> ({skill.attr_abbrev || skill.attribute.slice(0, 3)})</span>
                                                </label>
                                                <div className="flex items-center gap-1">
                                                    {isSurge && (
                                                        <>
                                                            <span className="font-display font-bold text-base text-white bg-cosmere-blue px-1.5 rounded border border-cosmere-gold min-w-[1.5rem] text-center shadow-sm" title="Surge Modifier">
                                                                {surgeModifier}
                                                            </span>
                                                            {skill.rank > 0 && (
                                                                <>
                                                                    <span className="font-display font-bold text-xs text-cosmere-blue bg-cosmere-blue/10 px-1.5 py-0.5 rounded border border-cosmere-blue/20" title="Surge Die">
                                                                        {surgeDie}
                                                                    </span>
                                                                    <span className="font-display font-bold text-xs text-cosmere-blue bg-cosmere-blue/10 px-1.5 py-0.5 rounded border border-cosmere-blue/20" title="Surge Size">
                                                                        {surgeSize}
                                                                    </span>
                                                                </>
                                                            )}
                                                        </>
                                                    )}
                                                    <span className="font-display font-bold text-base text-cosmere-blue bg-cosmere-parchment px-1.5 rounded border border-cosmere-gold min-w-[1.5rem] text-center shadow-sm" title="Attribute Score">
                                                        {attrValue}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 justify-end">
                                                {[1, 2, 3, 4, 5].map(rank => (
                                                    <button
                                                        key={rank}
                                                        onClick={() => updateSkillRank(skill.name, skill.rank === rank ? rank - 1 : rank)}
                                                        className={`text-base leading-none transition-colors ${skill.rank >= rank ? 'text-cosmere-blue' : 'text-stone-300 hover:text-cosmere-gold'}`}
                                                        title={`Rank ${rank}`}
                                                    >
                                                        {skill.rank >= rank ? '●' : '○'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Resources Section */}
                    <div className="pt-2">
                        <h4 className="font-bold text-sm uppercase text-stone-500 mb-4">Resources</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-6">
                            <div className="bg-white/50 p-4 rounded-lg border border-cosmere-blue/10 flex items-center justify-between">
                                <Label className="mb-0">Max Health</Label>
                                <NumberControl
                                    value={data.health.max}
                                    onChange={(val) => updateResource('health', 'max', val)}
                                />
                            </div>
                            <div className="bg-white/50 p-4 rounded-lg border border-cosmere-blue/10 flex items-center justify-between">
                                <Label className="mb-0">Max Focus</Label>
                                <NumberControl
                                    value={data.focus.max}
                                    onChange={(val) => updateResource('focus', 'max', val)}
                                />
                            </div>
                            <div className="bg-white/50 p-4 rounded-lg border border-cosmere-blue/10 flex items-center justify-between">
                                <Label className="mb-0">Max Investiture</Label>
                                <NumberControl
                                    value={data.investiture.max}
                                    onChange={(val) => updateResource('investiture', 'max', val)}
                                />
                            </div>
                            <div className="bg-white/50 p-4 rounded-lg border border-cosmere-blue/10 flex items-center justify-between">
                                <Label className="mb-0">Deflect</Label>
                                <NumberControl
                                    value={data.defenses.deflect}
                                    onChange={(val) => updateData({ defenses: { ...data.defenses, deflect: val } })}
                                />
                            </div>
                            <div className="bg-amber-50 border-amber-300 p-4 rounded-lg border flex items-center justify-between">
                                <Label className="mb-0">Lifting Capacity</Label>
                                <div className="font-display rounded text-s font-bold">
                                    {data.liftingCapacity}
                                </div>
                            </div>
                            <div className="bg-amber-50 border-amber-300 p-4 rounded-lg border flex items-center justify-between">
                                <Label className="mb-0">Carrying Capacity</Label>
                                <div className="font-display rounded text-s font-bold">
                                    {data.carryingCapacity}
                                </div>
                            </div>
                            <div className="bg-amber-50 border-amber-300 p-4 rounded-lg border flex items-center justify-between">
                                <Label className="mb-0">Movement</Label>
                                <div className="font-display rounded text-s font-bold">
                                    {data.movement} ft.
                                </div>
                            </div>
                            <div className="bg-amber-50 border-amber-300 p-4 rounded-lg border flex items-center justify-between">
                                <Label className="mb-0">Senses Range</Label>
                                <div className="font-display rounded text-s font-bold">
                                    {data.sensesRange}
                                </div>
                            </div>
                            <div className="bg-amber-50 border-amber-300 p-4 rounded-lg border flex items-center justify-between">
                                <Label className="mb-0">Recovery Die</Label>
                                <div className="font-display rounded text-s font-bold">
                                    {data.recoveryDie}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </CollapsiblePanel>

            {/* Group 3: Expertises & Talents */}
            <CollapsiblePanel title="Expertises & Talents" icon={Sparkles}>
                <div className="space-y-8">
                    {/* Expertises */}
                    <div>
                        <h4 className="font-bold text-sm uppercase text-stone-500 mb-2 border-b border-stone-200">Expertises</h4>
                        <p className="text-sm text-stone-600 mb-4">Select from common expertises or add your own custom ones.</p>

                        {/* Selected Expertises */}
                        <div className="mb-4">
                            <Label>Your Expertises</Label>
                            <div className="flex flex-wrap gap-2 min-h-[2.5rem] p-2 border border-stone-300 rounded bg-stone-50">
                                {data.expertises.length === 0 ? (
                                    <span className="text-stone-400 text-sm">No expertises selected</span>
                                ) : (
                                    data.expertises.map((exp, idx) => (
                                        <span
                                            key={idx}
                                            className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 border border-amber-300 text-stone-800 text-sm rounded"
                                        >
                                            {exp}
                                            <button
                                                onClick={() => updateData({ expertises: data.expertises.filter((_, i) => i !== idx) })}
                                                className="ml-2 text-destructive hover:text-red-800 font-bold px-2 text-xl leading-none"
                                                title="Remove"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Add Expertise Dropdown */}
                        <div className="mb-4 flex items-center gap-4">
                            <Label className="w-52 shrink-0 font-normal text-right">Select Expertise</Label>
                            <div className="flex-1">
                                <p className="text-xs text-stone-500 mb-1">Select from available expertises.</p>
                                <Select
                                    onChange={(e) => {
                                        if (e.target.value && !data.expertises.includes(e.target.value)) {
                                            updateData({ expertises: [...data.expertises, e.target.value] });
                                            e.target.value = '';
                                        }
                                    }}
                                >
                                    <option value="">Select an expertise...</option>
                                    <optgroup label="Cultural">
                                        {expertisesData.cultural.map((exp: string) => (
                                            <option key={exp} value={exp} disabled={data.expertises.includes(exp)}>
                                                {exp}
                                            </option>
                                        ))}
                                    </optgroup>
                                    <optgroup label="Utility">
                                        {expertisesData.utility.map((exp: string) => (
                                            <option key={exp} value={exp} disabled={data.expertises.includes(exp)}>
                                                {exp}
                                            </option>
                                        ))}
                                    </optgroup>
                                    <optgroup label="Weapon">
                                        {expertisesData.weapon.map((exp: string) => (
                                            <option key={exp} value={exp} disabled={data.expertises.includes(exp)}>
                                                {exp}
                                            </option>
                                        ))}
                                    </optgroup>
                                    <optgroup label="Armor">
                                        {expertisesData.armor.map((exp: string) => (
                                            <option key={exp} value={exp} disabled={data.expertises.includes(exp)}>
                                                {exp}
                                            </option>
                                        ))}
                                    </optgroup>
                                    <optgroup label="Specialist">
                                        {expertisesData.specialist.map((exp: string) => (
                                            <option key={exp} value={exp} disabled={data.expertises.includes(exp)}>
                                                {exp}
                                            </option>
                                        ))}
                                    </optgroup>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Add Custom Expertise */}
                    <div className="mb-4 flex items-center gap-4">
                        <Label className="w-52 shrink-0 font-normal text-right">Add Custom Expertise</Label>
                        <div className="flex gap-2 flex-1">
                            <Input
                                id="custom-expertise"
                                placeholder="Enter custom expertise name..."
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        const input = e.currentTarget;
                                        const value = input.value.trim();
                                        if (value && !data.expertises.includes(value)) {
                                            updateData({ expertises: [...data.expertises, value] });
                                            input.value = '';
                                        }
                                    }
                                }}
                            />
                            <button
                                onClick={() => {
                                    const input = document.getElementById('custom-expertise') as HTMLInputElement;
                                    const value = input?.value.trim();
                                    if (value && !data.expertises.includes(value)) {
                                        updateData({ expertises: [...data.expertises, value] });
                                        input.value = '';
                                    }
                                }}
                                className="px-2 py-2 bg-cosmere-blue text-cosmere-gold text-sm border border-cosmere-gold/30 rounded font-display uppercase tracking-widest hover:bg-cosmere-blue-hover transition-colors whitespace-nowrap shadow-md"
                            >
                                Add
                            </button>
                        </div>
                    </div>

                    {/* Talents */}
                    <div>
                        <h4 className="font-bold text-sm uppercase text-stone-500 mb-2 border-b border-stone-200">Talents</h4>
                        <p className="text-sm text-stone-600 mb-4">Key talents are automatically selected from your chosen paths.</p>

                        {/* Display Talents */}
                        <div className="mb-4">
                            <Label>Your Talents</Label>
                            {data.talents.length === 0 ? (
                                <div className="p-4 border border-stone-300 rounded bg-stone-50 text-stone-400 text-sm italic">
                                    No talents selected
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {[...data.talents].sort((a, b) => (a.isKeyTalent === b.isKeyTalent ? 0 : a.isKeyTalent ? -1 : 1)).map((talent) => {
                                        const tData = talentsData[talent.path]?.talents.find((t) => t.name === talent.name);
                                        const act = tData?.activation ? `${tData.activation}` : null;
                                        return (
                                            <div key={`${talent.path}-${talent.name}`} className={`flex items-start justify-between p-3 border rounded ${talent.isKeyTalent ? 'bg-amber-50 border-amber-300' : 'bg-stone-50 border-stone-300'}`}>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        {act && <span className={`text-stone-600 font-medium mr-1 ${act.includes('∞') ? 'text-xl leading-none translate-y-0.5 inline-block' : 'text-sm'}`}>{act}</span>}
                                                        <span className="font-bold text-stone-800">{talent.name}</span>
                                                        {talent.isKeyTalent && (
                                                            <span className="px-2 py-0.5 bg-cosmere-gold text-white text-xs rounded font-bold">KEY</span>
                                                        )}
                                                        <span className="text-xs text-stone-500">({talent.path})</span>
                                                    </div>
                                                    {talent.description && (
                                                        <div className="text-xs text-stone-600 mt-1">{talent.description}</div>
                                                    )}
                                                </div>
                                                {!talent.isKeyTalent && (
                                                    <button
                                                        onClick={() => updateData({ talents: data.talents.filter(t => t.name !== talent.name || t.path !== talent.path) })}
                                                        className="ml-4 text-destructive hover:text-red-800 font-bold px-2 text-xl leading-none"
                                                        title="Remove"
                                                    >
                                                        ×
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Add Talents */}
                        {data.paths.length > 0 && (
                            <div className="mb-4 flex items-center gap-4">
                                <Label className="w-52 shrink-0 font-normal text-right">Select Talent</Label>
                                <div className="flex-1">
                                    <p className="text-xs text-stone-500 mb-1">Select from available talents for your chosen paths.</p>
                                    <Select
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                const [pathName, talentName] = e.target.value.split('|||');
                                                const pathData = talentsData[pathName];
                                                if (pathData) {
                                                    const talent = pathData.talents.find((t) => t.name === talentName);

                                                    if (talent && !data.talents.some(t => t.name === talent.name && t.path === pathName)) {
                                                        updateData({
                                                            talents: [...data.talents, {
                                                                name: talent.name,
                                                                path: pathName,
                                                                isKeyTalent: false,
                                                                description: talent.description
                                                            }]
                                                        });
                                                    }
                                                    e.target.value = '';
                                                }
                                            }
                                        }}
                                    >
                                        <option value="">Select a talent...</option>
                                        {data.paths.map((path: HeroicPath) => {
                                            const pathData = talentsData[path.name];
                                            if (!pathData) return null;

                                            return (
                                                <optgroup key={path.name} label={path.name}>
                                                    {pathData.talents
                                                        .filter((t) => !t.isKeyTalent)
                                                        .map((talent) => (
                                                            <option
                                                                key={`${path.name}|||${talent.name}`}
                                                                value={`${path.name}|||${talent.name}`}
                                                                disabled={data.talents.some(t => t.name === talent.name && t.path === path.name)}
                                                            >
                                                                {talent.activation ? `${talent.activation} ` : ''}{talent.name} {talent.specialty ? `(${talent.specialty})` : ''} - {talent.prerequisites}
                                                            </option>
                                                        ))}
                                                </optgroup>
                                            );
                                        }).filter(Boolean)}
                                    </Select>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </CollapsiblePanel >

            {/* Group 4: Weapons & Equipment */}
            < CollapsiblePanel title="Weapons, Armor & Equipment" icon={Sword} >
                <div className="space-y-8">
                    {/* Weapons */}
                    <div>
                        <h4 className="font-bold text-sm uppercase text-stone-500 mb-2 border-b border-stone-200">Weapons</h4>
                        <p className="text-sm text-stone-600 mb-4">Equip weapons from the handbook.</p>

                        {/* Selected Weapons */}
                        <div className="mb-4">
                            <Label>Equipped Weapons</Label>
                            {data.weapons.length === 0 ? (
                                <div className="p-4 border border-stone-300 rounded bg-stone-50 text-stone-400 text-sm italic">
                                    No weapons equipped
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {data.weapons.map((weapon, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 border border-stone-300 rounded bg-stone-50">
                                            <div className="flex-1">
                                                <div className="font-bold text-stone-800">{weapon.name}</div>
                                                <div className="text-xs text-stone-500">
                                                    {weapon.category} • {weapon.damage} • {weapon.range}
                                                    {weapon.properties.length > 0 && ` • ${weapon.properties.join(', ')}`}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => updateData({ weapons: data.weapons.filter((_, i) => i !== idx) })}
                                                className="ml-4 text-destructive hover:text-red-800 font-bold px-2 text-xl leading-none"
                                                title="Remove"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Weapon Dropdown */}
                        <div className="mb-4 flex items-center gap-4">
                            <Label className="w-52 shrink-0 font-normal text-right">Select Weapon</Label>
                            <Select
                                onChange={(e) => {
                                    if (e.target.value) {
                                        const weapon = weaponsData.find((w: Weapon) => w.name === e.target.value);
                                        if (weapon && !data.weapons.some(w => w.name === weapon.name)) {
                                            updateData({ weapons: [...data.weapons, weapon] });
                                        }
                                        e.target.value = '';
                                    }
                                }}
                            >
                                <option value="">Select a weapon...</option>
                                <optgroup label="Light">
                                    {weaponsData.filter((w: Weapon) => w.category === "Light").map((w: Weapon) => (
                                        <option key={w.name} value={w.name} disabled={data.weapons.some(weapon => weapon.name === w.name)}>
                                            {w.name} ({w.damage})
                                        </option>
                                    ))}
                                </optgroup>
                                <optgroup label="Heavy">
                                    {weaponsData.filter((w: Weapon) => w.category === "Heavy").map((w: Weapon) => (
                                        <option key={w.name} value={w.name} disabled={data.weapons.some(weapon => weapon.name === w.name)}>
                                            {w.name} ({w.damage})
                                        </option>
                                    ))}
                                </optgroup>
                                <optgroup label="Special">
                                    {weaponsData.filter((w: Weapon) => w.category === "Special").map((w: Weapon) => (
                                        <option key={w.name} value={w.name} disabled={data.weapons.some(weapon => weapon.name === w.name)}>
                                            {w.name} ({w.damage})
                                        </option>
                                    ))}
                                </optgroup>
                            </Select>
                        </div>
                    </div>

                    {/* Armor and Equipment */}
                    <div>
                        <h4 className="font-bold text-sm uppercase text-stone-500 mb-2 border-b border-stone-200">Armor & Equipment</h4>

                        {/* Armor */}
                        <div className="mb-6">
                            <Label>Equipped Armor</Label>
                            <div className="mb-2">
                                {data.armor.length === 0 ? (
                                    <div className="text-sm text-stone-400 italic mb-2">No armor equipped</div>
                                ) : (
                                    <div className="space-y-2 mb-2">
                                        {data.armor.map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 border border-stone-300 rounded bg-stone-50">
                                                <div>
                                                    <div className="font-bold text-stone-800">{item.name}</div>
                                                    <div className="text-xs text-stone-500">
                                                        {item.category} • Deflect +{item.deflect} • {item.price}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => updateData({ armor: data.armor.filter((_, i) => i !== idx) })}
                                                    className="text-destructive hover:text-red-800 font-bold px-2"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-4">
                                <Label className="w-52 shrink-0 font-normal text-right">Select Armor</Label>
                                <Select
                                    onChange={(e) => {
                                        const selected = armorData.find((a: Armor) => a.name === e.target.value);
                                        if (selected) {
                                            updateData({ armor: [...data.armor, selected] });
                                        }
                                        e.target.value = "";
                                    }}
                                >
                                    <option value="">Select an armor...</option>
                                    {["Light", "Medium", "Heavy", "Shardplate"].map(cat => (
                                        <optgroup key={cat} label={cat}>
                                            {armorData.filter((a: Armor) => a.category === cat).map((a: Armor) => (
                                                <option key={a.name} value={a.name}>{a.name} (Deflect {a.deflect}) - {a.price}</option>
                                            ))}
                                        </optgroup>
                                    ))}
                                </Select>
                            </div>
                        </div>

                        {/* Equipment */}
                        <div className="mb-6">
                            <Label>Equipment</Label>
                            <div className="mb-2">
                                {data.equipment.length === 0 ? (
                                    <div className="text-sm text-stone-400 italic mb-2">No equipment</div>
                                ) : (
                                    <div className="space-y-2 mb-2">
                                        {data.equipment.map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-2 border border-stone-300 rounded bg-stone-50">
                                                <div className="flex-1">
                                                    <span className="font-medium text-stone-800">{item.name}</span>
                                                    <span className="text-xs text-stone-500 ml-2">[{item.price || '-'}, {item.weight || '-'}]</span>
                                                    {item.description && <span className="text-xs text-stone-500 ml-2">- {item.description}</span>}
                                                </div>
                                                <button
                                                    onClick={() => updateData({ equipment: data.equipment.filter((_, i) => i !== idx) })}
                                                    className="text-destructive hover:text-red-800 font-bold px-2"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-4 mb-2">
                                <Label className="w-52 shrink-0 font-normal text-right">Select Equipment Item</Label>
                                <Select
                                    onChange={(e) => {
                                        const selected = equipmentData.find((eq: EquipmentItem) => eq.name === e.target.value);
                                        if (selected) {
                                            updateData({ equipment: [...data.equipment, selected] });
                                        }
                                        e.target.value = "";
                                    }}
                                >
                                    <option value="">Select an equipment item...</option>
                                    {equipmentData.map((eq: EquipmentItem) => (
                                        <option key={eq.name} value={eq.name}>{eq.name} - {eq.price}</option>
                                    ))}
                                </Select>
                            </div>

                            <div className="mb-4 flex items-center gap-4">
                                <Label className="w-52 shrink-0 font-normal text-right">Add Custom Item</Label>
                                <div className="flex gap-2 flex-1">
                                    <Input
                                        id="custom-equipment"
                                        placeholder="Enter custom equipment item name..."
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                const input = e.currentTarget;
                                                const value = input.value.trim();
                                                if (value) {
                                                    updateData({
                                                        equipment: [...data.equipment, { name: value, price: "0", weight: "0", description: "Custom item" }]
                                                    });
                                                    input.value = "";
                                                }
                                            }
                                        }}
                                    />
                                    <button
                                        className="px-2 py-2 bg-cosmere-blue text-cosmere-gold text-sm border border-cosmere-gold/30 rounded font-display uppercase tracking-widest hover:bg-cosmere-blue-hover transition-colors whitespace-nowrap shadow-sm"
                                        onClick={() => {
                                            const input = document.getElementById('custom-equipment') as HTMLInputElement;
                                            const value = input?.value.trim();
                                            if (value) {
                                                updateData({
                                                    equipment: [...data.equipment, { name: value, price: "0", weight: "0", description: "Custom item" }]
                                                });
                                                input.value = "";
                                            }
                                        }}
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>

                            {/* Marks */}
                            <div className="border-t border-stone-200 mt-4 pt-4 flex items-center gap-4">
                                <Label className="w-32 shrink-0">Marks</Label>
                                <NumberControl
                                    value={data.marks}
                                    onChange={(val) => updateData({ marks: val })}
                                    editable={true}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </CollapsiblePanel >

            {/* Group 5: Character Details */}
            < CollapsiblePanel title="Character Details" icon={Scroll} >
                <div className="space-y-6">
                    {/* Purpose */}
                    <div>
                        <Label>Purpose</Label>
                        <div className="space-y-2 mb-2">
                            {data.purpose.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 border border-stone-300 rounded bg-white">
                                    <span>{item}</span>
                                    <button onClick={() => updateData({ purpose: data.purpose.filter((_, i) => i !== idx) })} className="text-destructive font-bold px-2">×</button>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <Input
                                id="purpose"
                                placeholder="Enter purpose..."
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        const val = e.currentTarget.value.trim();
                                        if (val) { updateData({ purpose: [...data.purpose, val] }); e.currentTarget.value = ''; }
                                    }
                                }}
                            />
                            <button onClick={() => {
                                const input = document.getElementById('purpose') as HTMLInputElement;
                                if (input.value.trim()) { updateData({ purpose: [...data.purpose, input.value.trim()] }); input.value = ''; }
                            }} className="px-2 py-2 bg-cosmere-blue text-cosmere-gold text-sm border border-cosmere-gold/30 rounded font-display uppercase tracking-widest hover:bg-cosmere-blue-hover transition-colors shadow-sm">
                                Add
                            </button>
                        </div>
                    </div>

                    {/* Obstacle */}
                    <div>
                        <Label>Obstacle</Label>
                        <div className="space-y-2 mb-2">
                            {data.obstacle.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 border border-stone-300 rounded bg-white">
                                    <span>{item}</span>
                                    <button onClick={() => updateData({ obstacle: data.obstacle.filter((_, i) => i !== idx) })} className="text-destructive font-bold px-2">×</button>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <Input
                                id="obstacle"
                                placeholder="Enter obstacle..."
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        const val = e.currentTarget.value.trim();
                                        if (val) { updateData({ obstacle: [...data.obstacle, val] }); e.currentTarget.value = ''; }
                                    }
                                }}
                            />
                            <button onClick={() => {
                                const input = document.getElementById('obstacle') as HTMLInputElement;
                                if (input.value.trim()) { updateData({ obstacle: [...data.obstacle, input.value.trim()] }); input.value = ''; }
                            }} className="px-2 py-2 bg-cosmere-blue text-cosmere-gold text-sm border border-cosmere-gold/30 rounded font-display uppercase tracking-widest hover:bg-cosmere-blue-hover transition-colors shadow-sm">
                                Add
                            </button>
                        </div>
                    </div>

                    {/* Goals */}
                    <div>
                        <Label>Goals</Label>
                        <div className="space-y-2 mb-2">
                            {data.goals.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 border border-stone-300 rounded bg-white">
                                    <div className="flex-1">
                                        <div className="font-medium text-stone-800">{item.text}</div>
                                        <div className="flex gap-1 mt-1">
                                            {[1, 2, 3].map(lvl => (
                                                <button
                                                    key={lvl}
                                                    onClick={() => {
                                                        const newGoals = [...data.goals];
                                                        const newLevel = item.level === lvl ? lvl - 1 : lvl;
                                                        newGoals[idx] = { ...item, level: newLevel as 0 | 1 | 2 | 3 };
                                                        updateData({ goals: newGoals });
                                                    }}
                                                    className={`text-[12px] leading-none transition-colors ${item.level >= lvl ? 'text-stone-800' : 'text-stone-300'}`}
                                                >
                                                    {item.level >= lvl ? "●" : "○"}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <button onClick={() => updateData({ goals: data.goals.filter((_, i) => i !== idx) })} className="text-destructive font-bold px-2 ml-2">×</button>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <Input
                                id="goal"
                                placeholder="Enter goal..."
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        const val = e.currentTarget.value.trim();
                                        if (val) { updateData({ goals: [...data.goals, { text: val, level: 0 }] }); e.currentTarget.value = ''; }
                                    }
                                }}
                            />
                            <button onClick={() => {
                                const input = document.getElementById('goal') as HTMLInputElement;
                                if (input.value.trim()) { updateData({ goals: [...data.goals, { text: input.value.trim(), level: 0 }] }); input.value = ''; }
                            }} className="px-2 py-2 bg-cosmere-blue text-cosmere-gold text-sm border border-cosmere-gold/30 rounded font-display uppercase tracking-widest hover:bg-cosmere-blue-hover transition-colors shadow-sm">
                                Add
                            </button>
                        </div>
                    </div>

                    {/* Connections */}
                    <div>
                        <Label>Connections</Label>
                        <div className="space-y-2 mb-2">
                            {data.connections.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 border border-stone-300 rounded bg-white">
                                    <span>{item}</span>
                                    <button onClick={() => updateData({ connections: data.connections.filter((_, i) => i !== idx) })} className="text-destructive font-bold px-2">×</button>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <Input
                                id="connection"
                                placeholder="Enter connection..."
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        const val = e.currentTarget.value.trim();
                                        if (val) { updateData({ connections: [...data.connections, val] }); e.currentTarget.value = ''; }
                                    }
                                }}
                            />
                            <button onClick={() => {
                                const input = document.getElementById('connection') as HTMLInputElement;
                                if (input.value.trim()) { updateData({ connections: [...data.connections, input.value.trim()] }); input.value = ''; }
                            }} className="px-2 py-2 bg-cosmere-blue text-cosmere-gold text-sm border border-cosmere-gold/30 rounded font-display uppercase tracking-widest hover:bg-cosmere-blue-hover transition-colors shadow-sm">
                                Add
                            </button>
                        </div>
                    </div>

                    {/* Other Talents & Abilities */}
                    <div>
                        <Label>Other Talents & Abilities</Label>
                        <div className="space-y-2 mb-2">
                            {data.otherTalents.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 border border-stone-300 rounded bg-white">
                                    <span>{item}</span>
                                    <button onClick={() => updateData({ otherTalents: data.otherTalents.filter((_, i) => i !== idx) })} className="text-destructive font-bold px-2">×</button>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <Input
                                id="other-talent"
                                placeholder="Enter other talent or ability..."
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        const val = e.currentTarget.value.trim();
                                        if (val) { updateData({ otherTalents: [...data.otherTalents, val] }); e.currentTarget.value = ''; }
                                    }
                                }}
                            />
                            <button onClick={() => {
                                const input = document.getElementById('other-talent') as HTMLInputElement;
                                if (input.value.trim()) { updateData({ otherTalents: [...data.otherTalents, input.value.trim()] }); input.value = ''; }
                            }} className="px-2 py-2 bg-cosmere-blue text-cosmere-gold text-sm border border-cosmere-gold/30 rounded font-display uppercase tracking-widest hover:bg-cosmere-blue-hover transition-colors shadow-sm">
                                Add
                            </button>
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <Label>Notes</Label>
                        <div className="space-y-2 mb-2">
                            {data.notes.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 border border-stone-300 rounded bg-white">
                                    <span>{item}</span>
                                    <button onClick={() => updateData({ notes: data.notes.filter((_, i) => i !== idx) })} className="text-destructive font-bold px-2">×</button>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <Input
                                id="note"
                                placeholder="Enter note..."
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        const val = e.currentTarget.value.trim();
                                        if (val) { updateData({ notes: [...data.notes, val] }); e.currentTarget.value = ''; }
                                    }
                                }}
                            />
                            <button onClick={() => {
                                const input = document.getElementById('note') as HTMLInputElement;
                                if (input.value.trim()) { updateData({ notes: [...data.notes, input.value.trim()] }); input.value = ''; }
                            }} className="px-2 py-2 bg-cosmere-blue text-cosmere-gold text-sm border border-cosmere-gold/30 rounded font-display uppercase tracking-widest hover:bg-cosmere-blue-hover transition-colors shadow-sm">
                                Add
                            </button>
                        </div>
                    </div>

                    {/* Conditions & Injuries */}
                    <div>
                        <Label>Conditions & Injuries</Label>
                        <div className="space-y-2 mb-2">
                            {data.conditions.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 border border-stone-300 rounded bg-white">
                                    <span>{item}</span>
                                    <button onClick={() => updateData({ conditions: data.conditions.filter((_, i) => i !== idx) })} className="text-destructive font-bold px-2">×</button>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <Input
                                id="condition"
                                placeholder="Enter condition or injury..."
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        const val = e.currentTarget.value.trim();
                                        if (val) { updateData({ conditions: [...data.conditions, val] }); e.currentTarget.value = ''; }
                                    }
                                }}
                            />
                            <button onClick={() => {
                                const input = document.getElementById('condition') as HTMLInputElement;
                                if (input.value.trim()) { updateData({ conditions: [...data.conditions, input.value.trim()] }); input.value = ''; }
                            }} className="px-2 py-2 bg-cosmere-blue text-cosmere-gold text-sm border border-cosmere-gold/30 rounded font-display uppercase tracking-widest hover:bg-cosmere-blue-hover transition-colors shadow-sm">
                                Add
                            </button>
                        </div>
                    </div>
                </div>
            </CollapsiblePanel >
            <DividerDecoration />
            <div className="text-center space-y-4 max-w-3xl mx-auto">
                <h4 className="text-sm text-cosmere-blue/70 font-display leading-relaxed">
                    This is unofficial fan content, created and shared for non-commercial use. It has not been reviewed by Dragonsteel Entertainment, LLC or Brotherwise Games, LLC.
                </h4>
                <button
                    onClick={() => setShowStatement(true)}
                    className="text-xs uppercase tracking-widest text-cosmere-gold hover:text-cosmere-blue transition-colors border-b border-transparent hover:border-cosmere-blue font-bold"
                >
                    View Full Legal Statement & Feedback
                </button>
            </div>

            {/* Statement Modal */}
            {
                showStatement && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-cosmere-blue/80 backdrop-blur-sm" onClick={() => setShowStatement(false)}>
                        <div
                            className="bg-[#fdfaf5] border-2 border-cosmere-gold rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Decorative Header */}
                            <div className="sticky top-0 z-10 bg-cosmere-blue text-cosmere-gold p-4 flex items-center justify-between border-b-2 border-cosmere-gold">
                                <h3 className="font-display font-bold uppercase tracking-widest text-lg">About & Legal</h3>
                                <button
                                    onClick={() => setShowStatement(false)}
                                    className="text-cosmere-gold hover:text-white transition-colors text-2xl leading-none font-bold"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="p-8 space-y-8">
                                {/* Legal Section */}
                                <div className="space-y-4">
                                    <h4 className="font-display font-bold text-cosmere-blue text-xl border-b border-cosmere-gold/30 pb-2">Legal Statement</h4>
                                    <div className="text-sm text-stone-700 space-y-2 leading-relaxed">
                                        <p>
                                            This application is an unofficial tool designed to assist players of the <strong>Cosmere RPG</strong>. It is not affiliated with, endorsed, sponsored, or specifically approved by Dragonsteel Entertainment, LLC or Brotherwise Games, LLC.
                                        </p>
                                        <p>
                                            <strong>Cosmere®</strong>, <strong>The Stormlight Archive®</strong>, and <strong>Mistborn®</strong> are registered trademarks of Dragonsteel Entertainment, LLC.
                                        </p>
                                        <p>
                                            All specific artwork, logos, and game mechanics referenced herein are the property of their respective owners. This tool is provided free of charge for community use and does not claim ownership over any official intellectual property.
                                        </p>
                                        <p>
                                            The source code of this application is licensed under the <a href="https://github.com/deafol/cosmere-rpg-character-builder/blob/main/LICENSE" className="text-cosmere-blue hover:text-cosmere-blue-hover underline font-bold" target="_blank" rel="noopener noreferrer">MIT License</a>.
                                        </p>
                                    </div>
                                </div>

                                {/* Feedback Section */}
                                <div className="space-y-4">
                                    <h4 className="font-display font-bold text-cosmere-blue text-xl border-b border-cosmere-gold/30 pb-2">Feedback & Community</h4>
                                    <p className="text-sm text-stone-700 leading-relaxed">
                                        This character builder is a labor of love for the Cosmere community. Whether you&apos;ve found a bug, have a feature request, or just want to share your thoughts, we&apos;d love to hear from you!
                                    </p>

                                    <div className="flex justify-center pt-2">
                                        <a
                                            href="mailto:cosmere@vinyamar.nl"
                                            className="inline-flex items-center gap-2 px-6 py-3 bg-cosmere-blue text-cosmere-gold rounded border border-cosmere-gold hover:bg-cosmere-blue-hover transition-all shadow-md group"
                                        >
                                            <span className="font-display font-bold uppercase tracking-wide">Send Feedback</span>
                                            <span className="group-hover:translate-x-1 transition-transform">→</span>
                                        </a>
                                    </div>
                                    <p className="text-center text-xs text-stone-500 mt-2">
                                        Contact: <span className="text-cosmere-blue font-bold">cosmere@vinyamar.nl</span>
                                    </p>
                                </div>
                            </div>

                            {/* Decorative Footer */}
                            <div className="h-2 bg-gradient-to-r from-cosmere-blue via-cosmere-gold to-cosmere-blue"></div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};
