
import fontkit from '@pdf-lib/fontkit';
import { PDFDocument, PDFPage, PDFFont } from 'pdf-lib';
import heroicTalents from '../data/heroic_talents.json';
import radiantTalents from '../data/radiant_talents.json';
import surgesData from '../data/surges.json';
import { CharacterData, Talent } from '../types/character';

// Type for talent lookup data structure
interface TalentDataEntry {
    name: string;
    specialty?: string;
    activation?: string;
    description?: string;
}

interface PathTalentData {
    keyTalent?: string;
    talents: TalentDataEntry[];
}

type TalentsDataMap = Record<string, PathTalentData>;

// Type for skill with originalCategory
interface ExtraSkill {
    name: string;
    attribute: string;
    attr_abbrev: string;
    originalCategory?: string;
}

// Extended talent with activation
interface TalentWithActivation extends Talent {
    activation?: string;
}

const talentsData: TalentsDataMap = { ...heroicTalents, ...radiantTalents };

export async function exportToPdf(data: CharacterData) {
    try {
        // 1. Load the RAW TEMPLATE
        const existingPdfBytes = await fetch('/character-sheet-template.pdf').then(res => res.arrayBuffer());
        const pdfDoc = await PDFDocument.load(existingPdfBytes);
        pdfDoc.registerFontkit(fontkit);

        // Load Custom Symbol-supporting Font
        const fontBytes = await fetch('/fonts/CosmereFont.ttf').then(res => {
            if (!res.ok) throw new Error("Font fetch failed");
            return res.arrayBuffer();
        });

        // Debug check (optional, but good for robustness)
        // const header = new Uint8Array(fontBytes).slice(0, 4);
        // console.log("Font Header:", header);

        const customFont = await pdfDoc.embedFont(fontBytes, { subset: false });

        const form = pdfDoc.getForm();
        const page = pdfDoc.getPages()[0];

        // Ensure Page 2
        let page2 = pdfDoc.getPages()[1];
        if (!page2) {
            const { width, height } = page.getSize();
            page2 = pdfDoc.addPage([width, height]);
        }

        // Ensure Page 3
        let page3 = pdfDoc.getPages()[2];
        if (!page3) {
            const { width, height } = page.getSize();
            page3 = pdfDoc.addPage([width, height]);
        }

        // 2. Define Field Creation Logic
        const addField = (targetPage: PDFPage, name: string, x: number, y: number, width: number, height: number = 15, size: number = 10) => {
            const field = form.createTextField(name);
            field.setText('');
            field.addToPage(targetPage, { x, y, width, height, borderWidth: 0 });
            field.setFontSize(size);
        };

        const addCheckBox = (targetPage: PDFPage, name: string, x: number, y: number, width: number = 9, height: number = 9) => {
            const checkBox = form.createCheckBox(name);
            checkBox.addToPage(targetPage, { x, y, width, height, borderWidth: 0.1 });
        };

        const addArea = (targetPage: PDFPage, name: string, x: number, y: number, w: number, h: number, fontSize: number = 10) => {
            const field = form.createTextField(name);
            field.addToPage(targetPage, { x, y, width: w, height: h, borderWidth: 0 });
            field.setFontSize(fontSize);
            field.enableMultiline();
        };

        // Header Helper
        const createHeader = (pg: PDFPage, prefix: string = "") => {
            const firstRowY = 747;
            const secondRowY = 715;
            const thirdRowY = 685;
            addField(pg, `${prefix}characterName`, 260, firstRowY, 240);
            addField(pg, `${prefix}level`, 515, firstRowY, 25);
            addField(pg, `${prefix}paths`, 260, thirdRowY, 240, 30);
            addField(pg, `${prefix}ancestry`, 515, secondRowY, 80);
            addField(pg, `${prefix}playerName`, 35, thirdRowY, 150);
        };
        // Attributes Helper
        const createAttributes = (pg: PDFPage, prefix: string = "") => {
            const attrY = 620;
            addField(pg, `${prefix}attr_str`, 35, attrY, 30, 20, 15);
            addField(pg, `${prefix}attr_spd`, 145, attrY, 30, 20, 15);
            addField(pg, `${prefix}attr_int`, 235, attrY, 30, 20, 15);
            addField(pg, `${prefix}attr_wil`, 345, attrY, 30, 20, 15);
            addField(pg, `${prefix}attr_awa`, 435, attrY, 30, 20, 15);
            addField(pg, `${prefix}attr_pre`, 545, attrY, 30, 20, 15);
        };

        // --- PAGE 1 ---

        createHeader(page);
        createAttributes(page);

        // Defenses
        const defY = 619;
        addField(page, 'def_phy', 95, defY, 25, 25, 20);
        addField(page, 'def_cog', 295, defY, 25, 25, 20);
        addField(page, 'def_spi', 495, defY, 25, 25, 20);

        // Resources
        const resY = 571;
        addField(page, 'res_hea_max', 35, resY, 30);
        addField(page, 'res_defl', 160, resY + 7, 30);
        addField(page, 'res_foc_max', 255, resY, 30);
        addField(page, 'res_inv_max', 455, resY, 30);

        // Skills (Checkboxes)
        const skillStartY = 541;
        const skillGap = 23;

        const addSkillRow = (prefix: string, startX: number, startY: number, extraSkills: ExtraSkill[] = []) => {
            const skills = prefix === 'phy'
                ? ['agility', 'athletics', 'hvy_weap', 'lgt_weap', 'stealth', 'thievery']
                : prefix === 'cog'
                    ? ['crafting', 'deduction', 'discipline', 'intimidation', 'lore', 'medicine']
                    : ['deception', 'insight', 'leadership', 'perception', 'persuasion', 'survival'];

            // Standard Skills
            skills.forEach((s, i) => {
                const y = startY - (i * skillGap);
                addField(page, `skill_attr_${s}`, startX - 130, y - 2, 15, 12, 10);
                for (let r = 1; r <= 5; r++) {
                    const fName = `skill_${s}_${r}`;
                    const x = startX + ((r - 1) * 8);
                    addCheckBox(page, fName, x, y);
                }
            });

            // Extra Skills (Surges)
            extraSkills.forEach((s, i) => {
                const index = skills.length + i;
                const y = startY - (index * skillGap);

                // Draw Name and Abbr
                // const abbr = s.attribute === 'Speed' ? 'SPD' : s.attribute.substring(0, 3).toUpperCase();
                page.drawText(`${s.name}`, { x: startX - 105, y: y + 2, size: 9 });
                page.drawText(`${s.attr_abbrev}`, { x: startX - 33, y: y + 2, size: 7 });

                // Draw Arrow if moved
                // Layout X: Phy=155, Cog=355, Spi=555
                // Direction: 
                //   If current=Phy (155) and orig=Cog/Spi -> Point Right
                //   If current=Cog (355) and orig=Phy -> Point Left
                //   If current=Cog (355) and orig=Spi -> Point Right
                //   If current=Spi (555) and orig=Phy/Cog -> Point Left

                if (s.originalCategory && s.originalCategory !== prefix) {
                    const orig = s.originalCategory;
                    let pointRight = false;

                    if (prefix === 'phy') pointRight = true; // Must be to right
                    else if (prefix === 'spi') pointRight = false; // Must be to left
                    else if (prefix === 'cog') {
                        // If orig is Phy (Left), point Left. If orig is Spi (Right), point Right.
                        pointRight = (orig === 'spi');
                    }

                    const arrowX = startX - 140;
                    const arrowY = y + 5;
                    const arrowLen = 8;

                    // Draw Line
                    page.drawLine({
                        start: { x: arrowX, y: arrowY },
                        end: { x: arrowX + arrowLen, y: arrowY },
                        thickness: 1,
                    });

                    // Draw Tip
                    if (pointRight) {
                        // > tip at arrowX + arrowLen
                        page.drawLine({ start: { x: arrowX + arrowLen, y: arrowY }, end: { x: arrowX + arrowLen - 3, y: arrowY + 2 }, thickness: 1 });
                        page.drawLine({ start: { x: arrowX + arrowLen, y: arrowY }, end: { x: arrowX + arrowLen - 3, y: arrowY - 2 }, thickness: 1 });
                    } else {
                        // < tip at arrowX
                        page.drawLine({ start: { x: arrowX, y: arrowY }, end: { x: arrowX + 3, y: arrowY + 2 }, thickness: 1 });
                        page.drawLine({ start: { x: arrowX, y: arrowY }, end: { x: arrowX + 3, y: arrowY - 2 }, thickness: 1 });
                    }
                }

                // Attribute Value
                // Use s.name as key (sanitize if needed, but simple names are fine)
                const safeName = s.name.replace(/\s+/g, '_');
                addField(page, `skill_attr_${safeName}`, startX - 130, y - 2, 15, 12, 10);

                for (let r = 1; r <= 5; r++) {
                    const fName = `skill_${safeName}_${r}`;
                    const x = startX + ((r - 1) * 8);
                    addCheckBox(page, fName, x, y);
                }
            });
        };



        const getCategory = (attr: string) => {
            if (attr === 'Strength' || attr === 'Speed') return 'phy';
            if (attr === 'Intellect' || attr === 'Willpower') return 'cog';
            return 'spi';
        };

        const standardNames = new Set([
            "Agility", "Athletics", "Heavy Weaponry", "Light Weaponry", "Stealth", "Thievery",
            "Crafting", "Deduction", "Discipline", "Intimidation", "Lore", "Medicine",
            "Deception", "Insight", "Leadership", "Perception", "Persuasion", "Survival"
        ]);
        const extraSkills = data.skills.filter(s => !standardNames.has(s.name));

        // Bucket extra skills
        const buckets: Record<string, ExtraSkill[]> = { phy: [], cog: [], spi: [] };
        data.skills.filter(s => !standardNames.has(s.name)).forEach(s => {
            buckets[getCategory(s.attribute)].push({ ...s, originalCategory: getCategory(s.attribute) });
        });

        // Balance buckets (Simple 1-pass: move from >1 to 0)
        // Order of check: move to adjacent if possible?
        // Layout: Phy (Left) - Cog (Mid) - Spi (Right)

        const move = (from: string, to: string) => {
            const s = buckets[from].pop();
            if (s) buckets[to].push(s);
        };

        // 1. Balance Cog (Middle) overflow
        if (buckets.cog.length > 1) {
            if (buckets.phy.length === 0) move('cog', 'phy');
            else if (buckets.spi.length === 0) move('cog', 'spi');
        }

        // 2. Balance Spi (Right) overflow
        if (buckets.spi.length > 1) {
            if (buckets.cog.length === 0) move('spi', 'cog'); // Prefer middle
            else if (buckets.phy.length === 0) move('spi', 'phy');
        }

        // 3. Balance Phy (Left) overflow
        if (buckets.phy.length > 1) {
            if (buckets.cog.length === 0) move('phy', 'cog');
            else if (buckets.spi.length === 0) move('phy', 'spi');
        }

        // Add Rows
        addSkillRow('phy', 155, skillStartY, buckets.phy);
        addSkillRow('cog', 355, skillStartY, buckets.cog);
        addSkillRow('spi', 555, skillStartY, buckets.spi);

        // Derived Stats
        const statY = 350;
        addField(page, 'stat_lift', 30, statY + 5, 40);
        addField(page, 'stat_carry', 30, statY - 15, 40);
        addField(page, 'stat_move', 140, statY, 30, 15, 12);
        addField(page, 'stat_rec_die', 285, statY, 40, 15, 12);
        addField(page, 'stat_senses', 475, statY, 40, 15, 12);

        // Text Areas
        addArea(page, 'txt_conditions', 30, 262, 150, 45);
        addArea(page, 'txt_expertises', 230, 255, 350, 50);
        addArea(page, 'txt_weapons', 30, 30, 150, 200);
        addArea(page, 'txt_talents', 230, 30, 350, 200);

        // --- PAGE 2 ---

        createHeader(page2, "p2_");
        createAttributes(page2, "p2_");

        // Defenses
        addField(page2, 'p2_def_phy', 95, defY, 25, 25, 20);
        addField(page2, 'p2_def_cog', 295, defY, 25, 25, 20);
        addField(page2, 'p2_def_spi', 495, defY, 25, 25, 20);

        // Armor & Equipment (Left Col Top)
        addArea(page2, 'txt_p2_armor_equip', 230, 305, 155, 275);
        addField(page2, 'val_marks', 250, 278, 135, 17, 10);

        // Details: Notes, Purpose, Obstacle (Right Col Bottom)
        addField(page2, 'txt_p2_purpose', 425, 550, 160, 30, 8);
        addField(page2, 'txt_p2_obstacle', 425, 497, 160, 30, 8);

        // Goals
        const goalYStart = 460;
        for (let g = 0; g < data.goals.length; g++) {
            const y = goalYStart - (g * 23);
            addField(page2, `goal_text_${g}`, 425, y, 135, 15);
            for (let c = 1; c <= 3; c++) {
                addCheckBox(page2, `goal_check_${g}_${c}`, 558 + (c * 8), y + 1);
            }
        }

        addArea(page2, 'txt_p2_other_talents', 30, 30, 150, 315);
        addArea(page2, 'txt_p2_notes', 230, 30, 155, 215);
        addArea(page2, 'txt_p2_connections', 425, 30, 160, 215);

        // 3. FILL FIELDS WITH DATA
        const fill = (name: string, val: string | number) => {
            try {
                const field = form.getTextField(name);
                if (field) field.setText(String(val));
            } catch { /* ignore */ }
        };

        // Special fill for Unicode content - uses custom font with optional size
        const fillWithFont = (name: string, val: string, font: PDFFont, fontSize?: number) => {
            try {
                const field = form.getTextField(name);
                if (field) {
                    if (fontSize) field.setFontSize(fontSize);
                    field.setText(val);
                    field.updateAppearances(font);
                }
            } catch (e) { console.error('fillWithFont error:', e); }
        };

        const fillHeader = (prefix: string = "") => {
            fill(`${prefix}playerName`, data.playerName);
            fill(`${prefix}characterName`, data.characterName);
            fill(`${prefix}level`, data.level);
            fill(`${prefix}ancestry`, data.ancestry?.name || "");
            fill(`${prefix}paths`, data.paths.map(p => p.name).join(", "));
        };
        fillHeader();
        fillHeader("p2_");

        const fillAttr = (prefix: string = "") => {
            fill(`${prefix}attr_str`, data.attributes.strength);
            fill(`${prefix}attr_spd`, data.attributes.speed);
            fill(`${prefix}attr_int`, data.attributes.intellect);
            fill(`${prefix}attr_wil`, data.attributes.willpower);
            fill(`${prefix}attr_awa`, data.attributes.awareness);
            fill(`${prefix}attr_pre`, data.attributes.presence);
        };
        fillAttr();
        fillAttr("p2_");

        // Page 1 Specifics
        fill('def_phy', data.defenses.physical);
        fill('def_cog', data.defenses.cognitive);
        fill('def_spi', data.defenses.spiritual);

        fill('res_hea_max', data.health.max);
        fill('res_defl', data.defenses.deflect);
        fill('res_foc_max', data.focus.max);
        fill('res_inv_max', data.investiture.max);

        // Skills filling
        const fillSkill = (pdfName: string, name: string) => {
            const skillObj = data.skills.find(s => s.name === name);
            const rank = skillObj?.rank || 0;
            if (skillObj && skillObj.attribute) {
                const attrKey = skillObj.attribute.toLowerCase() as keyof typeof data.attributes;
                const attrVal = data.attributes[attrKey];

                const standardNames = new Set([
                    "Agility", "Athletics", "Heavy Weaponry", "Light Weaponry", "Stealth", "Thievery",
                    "Crafting", "Deduction", "Discipline", "Intimidation", "Lore", "Medicine",
                    "Deception", "Insight", "Leadership", "Perception", "Persuasion", "Survival"
                ]);
                const isSurge = !standardNames.has(name);

                const uniqueSuffix = pdfName.replace('skill_', '');

                if (isSurge) {
                    // Attribute Box: Value if trained, else '-'
                    const val = rank > 0 ? attrVal : ' --';
                    fill(`skill_attr_${uniqueSuffix}`, val);
                } else {
                    fill(`skill_attr_${uniqueSuffix}`, attrVal);
                }
            }
            for (let r = 1; r <= 5; r++) {
                if (r <= rank) {
                    try {
                        const cb = form.getCheckBox(`${pdfName}_${r}`);
                        if (cb) cb.check();
                    } catch { /* ignore */ }
                }
            }
        };

        fillSkill('skill_agility', 'Agility');
        fillSkill('skill_athletics', 'Athletics');
        fillSkill('skill_hvy_weap', 'Heavy Weaponry');
        fillSkill('skill_lgt_weap', 'Light Weaponry');
        fillSkill('skill_stealth', 'Stealth');
        fillSkill('skill_thievery', 'Thievery');

        fillSkill('skill_crafting', 'Crafting');
        fillSkill('skill_deduction', 'Deduction');
        fillSkill('skill_discipline', 'Discipline');
        fillSkill('skill_intimidation', 'Intimidation');
        fillSkill('skill_lore', 'Lore');
        fillSkill('skill_medicine', 'Medicine');

        fillSkill('skill_deception', 'Deception');
        fillSkill('skill_insight', 'Insight');
        fillSkill('skill_leadership', 'Leadership');
        fillSkill('skill_perception', 'Perception');
        fillSkill('skill_persuasion', 'Persuasion');

        fillSkill('skill_survival', 'Survival');

        // Fill Extra skills
        extraSkills.forEach(s => {
            const safeName = s.name.replace(/\s+/g, '_');
            fillSkill(`skill_${safeName}`, s.name);
        });

        fill('stat_lift', data.liftingCapacity + "");
        fill('stat_carry', data.carryingCapacity + "");
        fill('stat_move', `${data.movement} ft`);
        fill('stat_rec_die', data.recoveryDie);
        fill('stat_senses', data.sensesRange);

        // Page 1 Text
        fill('txt_conditions', data.conditions.join('\n'));

        const expertisesText = data.expertises.join(' • ');
        fill('txt_expertises', expertisesText);

        const weaponsText = data.weapons.map(w => `• ${w.name}(${w.damage} - ${w.range})`).join('\n');
        fill('txt_weapons', weaponsText);

        // Filter talents into General and Surge-Specific
        const surgeNames = new Set(surgesData.surges.map(s => s.name));
        const surgeTalentsMap = new Map<string, TalentWithActivation[]>();
        const generalTalents: TalentWithActivation[] = [];

        data.talents.forEach(t => {
            // Lookup specialty and activation in talentsData
            let specialty = "";
            let activation = "";
            const pathData = talentsData[t.path];
            if (pathData) {
                const tData = pathData.talents.find((td) => td.name === t.name);
                if (tData) {
                    specialty = tData.specialty || "";
                    activation = tData.activation || "";
                }
            }
            // Create talent with activation for display
            const talentWithActivation: TalentWithActivation = { ...t, activation };

            if (surgeNames.has(specialty)) {
                if (!surgeTalentsMap.has(specialty)) surgeTalentsMap.set(specialty, []);
                surgeTalentsMap.get(specialty)!.push(talentWithActivation);
            } else {
                generalTalents.push(talentWithActivation);
            }
        });

        const sortedGeneralTalents = [...generalTalents].sort((a, b) => {
            if (a.isKeyTalent && !b.isKeyTalent) return -1;
            if (!a.isKeyTalent && b.isKeyTalent) return 1;
            return 0;
        });

        const talentsText = sortedGeneralTalents.map(t => {
            const prefix = t.isKeyTalent ? "[KEY] " : "";
            const act = t.activation ? `${t.activation} ` : "";
            return `${prefix}${act}${t.name}: ${t.description || ''}`;
        }).join('\n');
        fillWithFont('txt_talents', talentsText, customFont, 9);

        // Page 2 Fill
        fill('p2_def_phy', data.defenses.physical);
        fill('p2_def_cog', data.defenses.cognitive);
        fill('p2_def_spi', data.defenses.spiritual);
        const armorText = data.armor.map(a => `• ${a.name}(Deflect: ${a.deflect})`).join('\n');
        const equipText = data.equipment.map(e => `• ${e.name} (${e.price || '-'}, ${e.weight || '-'})`).join('\n');
        fill('txt_p2_armor_equip', "ARMOR:\n" + armorText + "\n\nEQUIPMENT:\n" + equipText);
        fill('val_marks', data.marks);
        fill('txt_p2_purpose', data.purpose.join(', '));
        fill('txt_p2_obstacle', data.obstacle.join(', '));

        // Goals
        data.goals.forEach((g, i) => {
            if (i < 3) {
                fill(`goal_text_${i}`, g.text);
                for (let c = 1; c <= 3; c++) {
                    if (c <= g.level) {
                        try {
                            const cb = form.getCheckBox(`goal_check_${i}_${c}`);
                            if (cb) cb.check();
                        } catch { /* ignore */ }
                    }
                }
            }
        });

        fillWithFont('txt_p2_other_talents', data.otherTalents.map(t => `• ${t}`).join('\n'), customFont, 9);
        fill('txt_p2_notes', data.notes.map(n => `• ${n}`).join('\n'));
        fill('txt_p2_connections', data.connections.map(c => `• ${c}`).join('\n'));

        // Page 3: Surges
        if (data.surges && data.surges.length > 0) {
            const sideMargin = 25;

            // Radiant Order + Ideals
            const radiantY = 693;
            addField(page3, 'radiant_order_field', sideMargin + 75, radiantY - 15, 100, 15, 12);
            fill('radiant_order_field', data.radiantPath || "");
            for (let i = 1; i <= 5; i++) {
                const cbX = sideMargin - 5;
                const cbY = radiantY - (i * 40);
                const cbName = `radiant_ideal_chk_${i}`;
                addCheckBox(page3, cbName, cbX, cbY, 12, 12);
                if ((data.radiantIdeal || 0) >= i) {
                    try { form.getCheckBox(cbName).check(); } catch { /* ignore */ }
                }
            }

            // Spren Info
            addField(page3, 'spren_name_field', sideMargin + 300, 635, 150, 15, 12);
            fill('spren_name_field', data.sprenName || "");
            addField(page3, 'bond_range_field', sideMargin + 330, 470, 50, 15, 12);
            fill('bond_range_field', (data.bondRange || 30) + " ft");

            // Surges
            data.surges.forEach((surge, idx) => {
                addField(page3, `surge_name_${idx}`, sideMargin + 40 + (idx * 295), 425, 150, 15, 12);
                fill(`surge_name_${idx}`, surge.name || "");

                const surgeEffectY = 380;
                const surgeEffectX = sideMargin + 155 + (idx * 295);
                addField(page3, `surge_modifier_${idx}`, surgeEffectX, surgeEffectY, 25, 15, 10);
                fill(`surge_modifier_${idx}`, `+${surge.modifier}`);
                addField(page3, `surge_size_${idx}`, surgeEffectX + 40, surgeEffectY, 35, 15, 10);
                fill(`surge_size_${idx}`, surge.size);
                addField(page3, `surge_die_${idx}`, surgeEffectX + 85, surgeEffectY, 20, 15, 10);
                fill(`surge_die_${idx}`, surge.die);

                let surgeDescription = "";
                const surgeInfo = surgesData.surges.find(s => s.name === surge.name);
                if (surgeInfo) {
                    if (surgeInfo.short_description) surgeDescription += `${surgeInfo.short_description}\n\n`;
                    if (surgeInfo.activation) {
                        surgeDescription += `${surgeInfo.activation.join('\n')}`;
                    }
                }
                addArea(page3, `surge_desc_${idx}`, sideMargin + (idx * 295), 255, 260, 100);
                fillWithFont(`surge_desc_${idx}`, surgeDescription, customFont, 8);

                const surgeTalents = surgeTalentsMap.get(surge.name)?.map(t => {
                    const act = t.activation ? `${t.activation} ` : "";
                    return `${act}${t.name}: ${t.description}`;
                }).join('\n') || "";
                addArea(page3, `surge_talents_${idx}`, sideMargin + (idx * 295), 31, 260, 200);
                fillWithFont(`surge_talents_${idx}`, surgeTalents, customFont, 8);

            });
        }

        // Serialize
        const pdfBytes = await pdfDoc.save();

        // Open
        const blob = new Blob([pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength) as ArrayBuffer], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');

    } catch (e) {
        console.error("PDF Export failed:", e);
        alert("Failed to generate PDF. Ensure 'character-sheet-template.pdf' is available.");
    }
}
