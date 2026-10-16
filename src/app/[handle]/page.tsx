import ChannelProfileView from "@/components/channel/ChannelProfileView";

export default function ChannelProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  return <ChannelProfileView params={params} />;
}
