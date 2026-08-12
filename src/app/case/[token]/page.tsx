import { PublicCaseScreen } from "@/components/screens/public-case-screen";

export default async function PublicCasePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <PublicCaseScreen token={token} />;
}
