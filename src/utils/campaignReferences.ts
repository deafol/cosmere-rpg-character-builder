/**
 * Reference counting for the campaign settings delete-confirmation flow —
 * surfaces how many other entities or characters point at an id via UUID
 * link before the user removes it, since those links are what drive
 * surge-skill auto-add and key-talent auto-select (consent.md §2.4).
 */
import { CampaignData, CharacterSaveV3 } from '../types/campaign';

export type EntityDomain =
    | 'paths'
    | 'talents'
    | 'surges'
    | 'expertises'
    | 'weapons'
    | 'armor'
    | 'equipment'
    | 'ancestryContent';

export function countReferences(
    data: CampaignData,
    characters: CharacterSaveV3[],
    domain: EntityDomain,
    id: string,
): number {
    switch (domain) {
        case 'paths':
            return (
                data.talents.filter(t => t.pathId === id).length +
                characters.filter(c => c.pathIds.includes(id)).length
            );
        case 'talents':
            return (
                data.paths.filter(p => p.keyTalentId === id).length +
                characters.filter(c => c.talentIds.includes(id)).length
            );
        case 'surges':
            return data.paths.filter(p => (p.surgeIds ?? []).includes(id)).length;
        case 'expertises':
            return characters.filter(c => c.expertiseIds.includes(id)).length;
        case 'weapons':
            return characters.filter(c => c.weaponIds.includes(id)).length;
        case 'armor':
            return characters.filter(c => c.armorIds.includes(id)).length;
        case 'equipment':
            return characters.filter(c => c.equipmentIds.includes(id)).length;
        case 'ancestryContent':
            return characters.filter(c => c.ancestryId === id).length;
    }
}
