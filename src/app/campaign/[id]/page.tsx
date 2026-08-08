import { CampaignDashboard } from "@/components/CampaignDashboard";

export default async function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CampaignDashboard campaignId={id} />;
}
