import { PublicReceiptScreen } from "@/components/screens/public-receipt-screen";

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <PublicReceiptScreen token={token} />;
}
