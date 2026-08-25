import { CampaignSettings } from "@/components/CampaignSettings";

export default async function CampaignSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CampaignSettings campaignId={id} />;
}
