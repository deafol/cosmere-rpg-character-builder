import { describe, it, expect, beforeEach } from 'vitest';
import { serializeCharacter } from '../src/utils/characterSerializer';
import { CharacterData, Ancestry, HeroicPath, Weapon, Armor, EquipmentItem } from '@/types/character';

// Test data factories
const createTestAncestry = (overrides?: Partial<Ancestry>): Ancestry => ({
    id: 'anc_human',
    name: 'Human',
    description: 'Versatile and adaptable',
    innate_abilities: ['Flexibility', 'Determination'],
    ...overrides,
});

const createTestPath = (overrides?: Partial<HeroicPath>): HeroicPath => ({
    id: 'path_windrunner',
    name: 'Windrunner',
    description: 'Dedicated to protection and leadership',
    key_attributes: ['Strength', 'Willpower'],
    ...overrides,
});

const createTestCharacter = (overrides?: Partial<CharacterData>): CharacterData => ({
    playerName: 'Alice Player',
    characterName: 'Kaladin Stormblessed',
    level: 3,
    ancestry: createTestAncestry(),
    paths: [createTestPath()],
    radiantIdeal: 2,
    radiantPath: 'path_windrunner',
    sprenName: 'Sylphrena',
    bondRange: 30,
    surges: [],
    attributes: {
        strength: 5,
        speed: 4,
        intellect: 3,
        willpower: 5,
        awareness: 4,
        presence: 3,
    },
    marks: 2,
    skills: [
        { id: 'skill_athletics', name: 'Athletics', attribute: 'Strength', attr_abbrev: 'STR', rank: 3 },
        { id: 'skill_acrobatics', name: 'Acrobatics', attribute: 'Speed', attr_abbrev: 'SPD', rank: 2 },
        { id: 'skill_awareness', name: 'Awareness', attribute: 'Awareness', attr_abbrev: 'AWA', rank: 1 },
        { id: 'skill_stealth', name: 'Stealth', attribute: 'Speed', attr_abbrev: 'SPD', rank: 0 }, // Should not serialize
    ],
    defenses: {
        physical: 14,
        cognitive: 12,
        spiritual: 13,
        deflect: 10,
    },
    health: { current: 28, max: 28 },
    focus: { current: 3, max: 3 },
    investiture: { current: 2, max: 10 },
    movement: 30,
    sensesRange: '60 feet',
    recoveryDie: 'd10',
    liftingCapacity: '300 lbs',
    carryingCapacity: '150 lbs',
    expertises: ['Leadership', 'Swordsmanship'],
    weapons: [
        { id: 'wpn_longsword', name: 'Longsword', category: 'Melee', damage: '3d6', range: 'Melee', properties: ['Versatile'], weight: '3 lbs', price: '15 gp' },
    ],
    armor: [
        { id: 'arm_plate', name: 'Plate Armor', category: 'Heavy', deflect: '18', properties: [], weight: '65 lbs', price: '1500 gp' },
    ],
    equipment: [
        { id: 'eqp_backpack', name: 'Backpack', price: '2 gp', weight: '5 lbs' },
    ],
    talents: [
        { id: 'tal_leadership', name: 'Leadership', path: 'path_windrunner', isKeyTalent: true },
    ],
    otherTalents: ['Custom Talent'],
    purpose: ['Protect those who cannot protect themselves'],
    obstacle: ['Fear of failing those who depend on me'],
    goals: [
        { text: 'Reach Windrunner Ideal 3', level: 0 },
        { text: 'Master the Surgebinding', level: 1 },
    ],
    notes: ['Starting campaign note'],
    connections: ['Connected to Syl'],
    conditions: [],
    appearance: 'Tall, athletic build with dark eyes',
    ...overrides,
});

describe('Character Serializer', () => {
    let testCharacter: CharacterData;

    beforeEach(() => {
        testCharacter = createTestCharacter();
    });

    describe('serializeCharacter', () => {
        it('should serialize a complete character correctly', () => {
            const serialized = serializeCharacter(testCharacter);

            expect(serialized).toBeDefined();
            expect(serialized.v).toBe(2);
            expect(serialized.p).toBe('Alice Player');
            expect(serialized.c).toBe('Kaladin Stormblessed');
            expect(serialized.l).toBe(3);
        });

        it('should serialize core character information', () => {
            const serialized = serializeCharacter(testCharacter);

            expect(serialized.p).toBe(testCharacter.playerName);
            expect(serialized.c).toBe(testCharacter.characterName);
            expect(serialized.l).toBe(testCharacter.level);
            expect(serialized.a).toBe('anc_human');
            expect(serialized.h).toContain('path_windrunner');
        });

        it('should serialize attributes correctly', () => {
            const serialized = serializeCharacter(testCharacter);

            expect(serialized.at).toEqual([
                5, // strength
                4, // speed
                3, // intellect
                5, // willpower
                4, // awareness
                3, // presence
            ]);
        });

        it('should serialize only non-zero skill ranks', () => {
            const serialized = serializeCharacter(testCharacter);

            // Should include skills with rank > 0
            expect(serialized.sk).toContainEqual(['skill_athletics', 3]);
            expect(serialized.sk).toContainEqual(['skill_acrobatics', 2]);
            expect(serialized.sk).toContainEqual(['skill_awareness', 1]);

            // Should NOT include skills with rank 0
            expect(serialized.sk).not.toContainEqual(['skill_stealth', 0]);
        });

        it('should serialize defenses array', () => {
            const serialized = serializeCharacter(testCharacter);

            expect(serialized.df).toEqual([14, 12, 13, 10]); // [physical, cognitive, spiritual, deflect]
        });

        it('should serialize resource pools (health, focus, investiture)', () => {
            const serialized = serializeCharacter(testCharacter);

            expect(serialized.hp).toEqual([28, 28]);
            expect(serialized.fo).toEqual([3, 3]);
            expect(serialized.iv).toEqual([2, 10]);
        });

        it('should serialize weapons by ID', () => {
            const serialized = serializeCharacter(testCharacter);

            expect(serialized.wp).toContainEqual(expect.objectContaining({
                id: 'wpn_longsword',
                name: 'Longsword',
            }));
        });

        it('should serialize armor by ID', () => {
            const serialized = serializeCharacter(testCharacter);

            expect(serialized.ar).toContainEqual(expect.objectContaining({
                id: 'arm_plate',
                name: 'Plate Armor',
            }));
        });

        it('should serialize equipment by ID', () => {
            const serialized = serializeCharacter(testCharacter);

            expect(serialized.eq).toContainEqual(expect.objectContaining({
                id: 'eqp_backpack',
                name: 'Backpack',
            }));
        });

        it('should serialize talents with path and key talent flag', () => {
            const serialized = serializeCharacter(testCharacter);

            expect(serialized.ta).toContainEqual(['tal_leadership', 'path_windrunner', true]);
        });

        it('should serialize text arrays correctly', () => {
            const serialized = serializeCharacter(testCharacter);

            expect(serialized.ex).toEqual(['Leadership', 'Swordsmanship']);
            expect(serialized.ot).toEqual(['Custom Talent']);
            expect(serialized.pu).toEqual(['Protect those who cannot protect themselves']);
            expect(serialized.ob).toEqual(['Fear of failing those who depend on me']);
            expect(serialized.cn).toEqual(['Connected to Syl']);
            expect(serialized.no).toEqual(['Starting campaign note']);
        });

        it('should serialize goals with text and level', () => {
            const serialized = serializeCharacter(testCharacter);

            expect(serialized.go).toContainEqual(['Reach Windrunner Ideal 3', 0]);
            expect(serialized.go).toContainEqual(['Master the Surgebinding', 1]);
        });

        it('should handle character with null ancestry', () => {
            testCharacter.ancestry = null;
            const serialized = serializeCharacter(testCharacter);

            expect(serialized.a).toBeNull();
        });

        it('should handle character with no paths', () => {
            testCharacter.paths = [];
            const serialized = serializeCharacter(testCharacter);

            expect(serialized.h).toEqual([]);
        });

        it('should handle character with empty skills', () => {
            testCharacter.skills = [];
            const serialized = serializeCharacter(testCharacter);

            expect(serialized.sk).toEqual([]);
        });

        it('should serialize custom weapons (without ID)', () => {
            const customWeapon: Weapon = {
                name: 'Custom Sword',
                category: 'Melee',
                damage: '2d8',
                range: 'Melee',
                properties: ['Enchanted'],
                weight: '2 lbs',
                price: '500 gp',
            };
            testCharacter.weapons = [customWeapon];

            const serialized = serializeCharacter(testCharacter);

            // Custom items are serialized as full objects, not IDs
            expect(serialized.wp).toContainEqual(expect.objectContaining({
                name: 'Custom Sword',
                damage: '2d8',
            }));
        });

        it('should serialize radiant ideal and shard information', () => {
            const serialized = serializeCharacter(testCharacter);

            expect(serialized.ri).toBe(2);
            expect(serialized.rp).toBe('path_windrunner');
            expect(serialized.sn).toBe('Sylphrena');
            expect(serialized.br).toBe(30);
        });

        it('should serialize appearance string', () => {
            const serialized = serializeCharacter(testCharacter);

            expect(serialized.ap).toBe('Tall, athletic build with dark eyes');
        });
    });
});
