"use client";

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCampaign } from '../context/CampaignContext';
import { useCharacter } from '../context/CharacterContext';
import { initialCharacterData } from '../types/character';
import { generateId } from '../utils/uuid';
import { toCharacterSaveV3, fromCharacterSaveV3 } from '../utils/characterCampaignSerializer';

/**
 * Loads a character from the active campaign's store on mount, or — when
 * charId is "new" — creates one immediately and redirects to its real id
 * (same pattern as campaign creation in CampaignPicker), then autosaves
 * every edit back into campaign.characters. Must be used inside both
 * CampaignProvider and CharacterProvider; CharacterProvider should be
 * remounted (key={charId}) whenever charId changes so this always starts
 * from a clean slate before loading.
 */
export function useCharacterCampaignSync(campaignId: string, charId: string) {
    const router = useRouter();
    const { campaign, addCharacter, updateCharacter } = useCampaign();
    const { data, loadData } = useCharacter();
    const [currentId, setCurrentId] = useState<string | null>(null);
    const [notFound, setNotFound] = useState(false);
    const readyRef = useRef(false);
    // Dev-mode React Strict Mode double-invokes effects on mount without
    // resetting refs — without this guard, "new" would create two blank
    // characters before the redirect lands.
    const createdNewRef = useRef(false);

    useEffect(() => {
        if (!campaign) return;
        readyRef.current = false;

        if (charId === 'new') {
            if (createdNewRef.current) return;
            createdNewRef.current = true;
            const newId = generateId();
            addCharacter(toCharacterSaveV3(initialCharacterData, campaignId, campaign.data, newId));
            setCurrentId(newId);
            setNotFound(false);
            readyRef.current = true;
            router.replace(`/campaign/${campaignId}/character/${newId}`);
            return;
        }

        const existing = campaign.characters.find(c => c.id === charId);
        if (!existing) {
            setNotFound(true);
            setCurrentId(null);
            return;
        }
        loadData(fromCharacterSaveV3(existing, campaign.data));
        setCurrentId(charId);
        setNotFound(false);
        readyRef.current = true;
        // Runs once per character (charId) — re-running on every campaign
        // change would fight with the autosave effect below.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [charId, campaignId, campaign?.id]);

    useEffect(() => {
        if (!readyRef.current || !currentId || !campaign) return;
        updateCharacter(currentId, toCharacterSaveV3(data, campaignId, campaign.data, currentId));
        // Intentionally keyed on `data` alone — see effect above.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data]);

    return { currentId, notFound };
}
