"use client";

import { useEffect, useState } from 'react';
import { useCampaign } from '../context/CampaignContext';

/**
 * Ensures the campaign matching `id` is the active campaign in
 * CampaignContext, loading it from localStorage on mount / id change if
 * it isn't already. Used by every route nested under /campaign/[id] so a
 * direct link or refresh still resolves the right campaign.
 */
export function useLoadedCampaign(id: string) {
    const { campaign, loadCampaign } = useCampaign();
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        if (campaign?.id === id) {
            return;
        }
        const loaded = loadCampaign(id);
        setNotFound(!loaded);
        // Only re-run when the requested id changes — loadCampaign already
        // no-ops (via the guard above) once the right campaign is active.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    return {
        campaign: campaign?.id === id ? campaign : null,
        notFound,
    };
}
