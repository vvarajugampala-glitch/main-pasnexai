import { ClientBusinessDetail } from "./ClientBusinessDetail";

export default async function AdminBusinessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <ClientBusinessDetail businessId={id} />;
}
