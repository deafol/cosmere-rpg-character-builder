import { CampaignData } from '../../types/campaign';

export type FieldType =
    | 'text'
    | 'textarea'
    | 'checkbox'
    | 'select'
    | 'entity-select'
    | 'multi-entity-select'
    | 'stringlist';

export interface EntityOption {
    id: string;
    label: string;
}

/** Form-buffer representation of a field, independent of the entity's own field type. */
export type FormValues = Record<string, string | boolean | string[]>;

export interface FieldConfig<T> {
    key: keyof T & string;
    label: string;
    type: FieldType;
    required?: boolean;
    placeholder?: string;
    /** 'select' options, static list or derived from campaign data (e.g. custom expertise categories). */
    selectOptions?: string[] | ((data: CampaignData) => string[]);
    /** 'text' autocomplete suggestions — lets the user pick an existing value or type a new one. */
    suggestions?: (data: CampaignData) => string[];
    /** 'entity-select' / 'multi-entity-select' choices, resolved from campaign data or a static list. */
    refOptions?: (data: CampaignData) => EntityOption[];
    /** Hide this field unless the predicate over the current form values holds (e.g. radiant-only fields). */
    showIf?: (values: FormValues) => boolean;
}
