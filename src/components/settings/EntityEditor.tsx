"use client";

import { useState } from 'react';
import { CampaignData } from '../../types/campaign';
import { Input, Label, Select, Modal } from '../ui';
import { FieldConfig, FieldType, FormValues } from './entityFieldTypes';

// FieldConfig.type is the only thing that tells us how to read/write a given
// key of T, so the generic <-> FormValues boundary needs explicit casts —
// TS can't verify per-field shape from a runtime type tag.

const emptyFormValue = (type: FieldType): string | boolean | string[] => {
    if (type === 'checkbox') return false;
    if (type === 'multi-entity-select') return [];
    return '';
};

function toFormValues<T>(entry: T, fields: FieldConfig<T>[]): FormValues {
    const values: FormValues = {};
    for (const field of fields) {
        const raw = (entry as Record<string, unknown>)[field.key];
        if (field.type === 'checkbox') {
            values[field.key] = Boolean(raw);
        } else if (field.type === 'stringlist') {
            values[field.key] = ((raw as string[] | undefined) ?? []).join('\n');
        } else if (field.type === 'multi-entity-select') {
            values[field.key] = (raw as string[] | undefined) ?? [];
        } else {
            values[field.key] = (raw as string | undefined) ?? '';
        }
    }
    return values;
}

/** Fields hidden by `showIf` at save time are reset to empty rather than keeping a stale buffered value. */
function fromFormValues<T>(base: T, fields: FieldConfig<T>[], values: FormValues): T {
    const result = { ...base } as Record<string, unknown>;
    for (const field of fields) {
        const visible = !field.showIf || field.showIf(values);
        const value = visible ? values[field.key] : emptyFormValue(field.type);
        if (field.type === 'checkbox') {
            result[field.key] = Boolean(value);
        } else if (field.type === 'stringlist') {
            result[field.key] = String(value).split('\n').map(line => line.trim()).filter(Boolean);
        } else if (field.type === 'multi-entity-select') {
            result[field.key] = Array.isArray(value) ? value : [];
        } else if (field.type === 'entity-select') {
            result[field.key] = value || undefined;
        } else {
            result[field.key] = typeof value === 'string' ? value.trim() : value;
        }
    }
    return result as T;
}

const resolveOptions = (data: CampaignData, options?: string[] | ((data: CampaignData) => string[])): string[] => {
    if (!options) return [];
    return typeof options === 'function' ? options(data) : options;
};

function FieldInput<T>({
    field,
    values,
    campaignData,
    onChange,
}: {
    field: FieldConfig<T>;
    values: FormValues;
    campaignData: CampaignData;
    onChange: (key: string, value: string | boolean | string[]) => void;
}) {
    const value = values[field.key];

    if (field.type === 'checkbox') {
        return (
            <label className="flex items-center gap-2 text-sm text-cosmere-blue font-bold">
                <input type="checkbox" checked={Boolean(value)} onChange={e => onChange(field.key, e.target.checked)} />
                {field.label}
            </label>
        );
    }

    if (field.type === 'textarea' || field.type === 'stringlist') {
        return (
            <div>
                <Label>
                    {field.label}
                    {field.type === 'stringlist' && (
                        <span className="normal-case font-normal text-stone-400"> (one per line)</span>
                    )}
                </Label>
                <textarea
                    value={String(value ?? '')}
                    onChange={e => onChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    rows={field.type === 'stringlist' ? 3 : 4}
                    className="border-b-2 border-cosmere-gold/50 bg-cosmere-parchment px-4 py-2 w-full focus:outline-none focus:border-cosmere-gold focus:bg-white transition-all placeholder:text-stone-400 font-ui text-cosmere-blue shadow-sm resize-y"
                />
            </div>
        );
    }

    if (field.type === 'select') {
        const options = resolveOptions(campaignData, field.selectOptions);
        return (
            <div>
                <Label>{field.label}</Label>
                <Select value={String(value ?? '')} onChange={e => onChange(field.key, e.target.value)}>
                    {!field.required && <option value="">—</option>}
                    {options.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </Select>
            </div>
        );
    }

    if (field.type === 'entity-select') {
        const options = field.refOptions ? field.refOptions(campaignData) : [];
        return (
            <div>
                <Label>{field.label}</Label>
                <Select value={String(value ?? '')} onChange={e => onChange(field.key, e.target.value)} disabled={options.length === 0}>
                    <option value="">{options.length === 0 ? 'None available yet' : '—'}</option>
                    {options.map(opt => (
                        <option key={opt.id} value={opt.id}>{opt.label}</option>
                    ))}
                </Select>
            </div>
        );
    }

    if (field.type === 'multi-entity-select') {
        const options = field.refOptions ? field.refOptions(campaignData) : [];
        const selected = Array.isArray(value) ? value : [];
        const toggle = (id: string) => {
            onChange(field.key, selected.includes(id) ? selected.filter(v => v !== id) : [...selected, id]);
        };
        return (
            <div>
                <Label>{field.label}</Label>
                {options.length === 0 ? (
                    <p className="text-xs text-stone-400 italic px-1">None available yet.</p>
                ) : (
                    <div className="border border-cosmere-gold/30 rounded max-h-32 overflow-y-auto p-2 space-y-1 bg-white/50">
                        {options.map(opt => (
                            <label key={opt.id} className="flex items-center gap-2 text-sm text-cosmere-blue">
                                <input type="checkbox" checked={selected.includes(opt.id)} onChange={() => toggle(opt.id)} />
                                {opt.label}
                            </label>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // text
    const suggestions = field.suggestions ? field.suggestions(campaignData) : undefined;
    const listId = suggestions ? `${field.key}-suggestions` : undefined;
    return (
        <div>
            <Label>{field.label}</Label>
            <Input
                value={String(value ?? '')}
                onChange={e => onChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                list={listId}
            />
            {suggestions && (
                <datalist id={listId}>
                    {suggestions.map(s => <option key={s} value={s} />)}
                </datalist>
            )}
        </div>
    );
}

export interface EntityEditorProps<T> {
    /** Singular display name, e.g. "Path" — used in the add button and modal titles. */
    entityName: string;
    entries: T[];
    fields: FieldConfig<T>[];
    campaignData: CampaignData;
    getId: (entry: T) => string;
    getLabel: (entry: T) => string;
    createDefault: () => T;
    onSave: (entry: T) => void;
    onDelete: (id: string) => void;
    /** Returns a warning to show before deleting (e.g. "referenced by 3 other entries"), or null if safe. */
    referenceWarning?: (entry: T) => string | null;
    emptyLabel: string;
}

export function EntityEditor<T>({
    entityName,
    entries,
    fields,
    campaignData,
    getId,
    getLabel,
    createDefault,
    onSave,
    onDelete,
    referenceWarning,
    emptyLabel,
}: EntityEditorProps<T>) {
    const [editing, setEditing] = useState<T | null>(null);
    const [isNew, setIsNew] = useState(false);
    const [formValues, setFormValues] = useState<FormValues>({});
    const [pendingDelete, setPendingDelete] = useState<T | null>(null);

    const openForm = (entry: T, asNew: boolean) => {
        setEditing(entry);
        setIsNew(asNew);
        setFormValues(toFormValues(entry, fields));
    };

    const closeForm = () => {
        setEditing(null);
        setFormValues({});
    };

    const handleFieldChange = (key: string, value: string | boolean | string[]) => {
        setFormValues(prev => ({ ...prev, [key]: value }));
    };

    const visibleFields = fields.filter(f => !f.showIf || f.showIf(formValues));

    const missingRequired = visibleFields.some(f => {
        if (!f.required) return false;
        const value = formValues[f.key];
        if (f.type === 'multi-entity-select') return !(Array.isArray(value) && value.length > 0);
        return !value || (typeof value === 'string' && value.trim() === '');
    });

    const handleSave = () => {
        if (!editing || missingRequired) return;
        onSave(fromFormValues(editing, fields, formValues));
        closeForm();
    };

    const handleDeleteConfirmed = () => {
        if (pendingDelete) {
            onDelete(getId(pendingDelete));
            setPendingDelete(null);
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-stone-500">
                    {entries.length === 0 ? emptyLabel : `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}`}
                </p>
                <button
                    onClick={() => openForm(createDefault(), true)}
                    className="bg-cosmere-gold text-cosmere-blue hover:brightness-90 px-4 py-2 rounded text-xs uppercase font-bold tracking-wider shadow-md transition-all"
                >
                    Add {entityName}
                </button>
            </div>

            {entries.length > 0 && (
                <ul className="divide-y divide-cosmere-gold/30">
                    {entries.map(entry => (
                        <li key={getId(entry)} className="py-3 flex items-center justify-between gap-4">
                            <span className="text-cosmere-blue font-bold">{getLabel(entry)}</span>
                            <div className="flex gap-2 shrink-0">
                                <button
                                    onClick={() => openForm(entry, false)}
                                    className="border border-cosmere-blue/40 text-cosmere-blue hover:bg-cosmere-blue/10 px-3 py-1.5 rounded text-xs uppercase font-bold tracking-wider transition-colors"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => setPendingDelete(entry)}
                                    className="border border-red-400 text-red-500 hover:bg-red-50 px-3 py-1.5 rounded text-xs uppercase font-bold tracking-wider transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            <Modal
                isOpen={editing !== null}
                title={isNew ? `New ${entityName}` : `Edit ${entityName}`}
                onConfirm={handleSave}
                onCancel={closeForm}
                confirmText="Save"
                confirmDisabled={missingRequired}
                size="lg"
            >
                <div className="space-y-4">
                    {visibleFields.map(field => (
                        <FieldInput key={field.key} field={field} values={formValues} campaignData={campaignData} onChange={handleFieldChange} />
                    ))}
                </div>
            </Modal>

            <Modal
                isOpen={pendingDelete !== null}
                title={`Delete ${entityName}?`}
                message={(() => {
                    if (!pendingDelete) return '';
                    const warning = referenceWarning?.(pendingDelete);
                    return warning
                        ? `${warning} Delete anyway?`
                        : `Remove "${getLabel(pendingDelete)}" from this campaign? This cannot be undone here.`;
                })()}
                confirmText="Delete"
                onConfirm={handleDeleteConfirmed}
                onCancel={() => setPendingDelete(null)}
                variant="warning"
            />
        </div>
    );
}
