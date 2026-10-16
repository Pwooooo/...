import ChannelProfileView from "@/components/channel/ChannelProfileView";

export default function ProfileHandlePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  return <ChannelProfileView params={params} />;
}
