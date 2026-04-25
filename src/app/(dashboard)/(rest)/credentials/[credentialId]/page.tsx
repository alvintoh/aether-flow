import { requireAuth } from "@/lib/auth-utils";

interface PageProps {
  params: Promise<{
    credentialId: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  await requireAuth();

  const { credentialId } = await params;
  return <p>Credential id: {credentialId}</p>;
}
