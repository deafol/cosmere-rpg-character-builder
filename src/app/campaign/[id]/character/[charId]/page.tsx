import { CampaignCharacterPage } from "@/components/CampaignCharacterPage";

export default async function CharacterPage({ params }: { params: Promise<{ id: string; charId: string }> }) {
  const { id, charId } = await params;
  return <CampaignCharacterPage campaignId={id} charId={charId} />;
}
