import ChannelProfileView from "@/components/channel/ChannelProfileView";

export default function UserProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  return <ChannelProfileView params={params} />;
}
