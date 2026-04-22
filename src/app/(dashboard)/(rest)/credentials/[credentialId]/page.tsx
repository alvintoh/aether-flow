interface PageProps {
  params: Promise<{
    credentialId: string;
  }>;
}

// http://localhost:3000/credentials/123

export default async function Page({ params }: PageProps) {
  const { credentialId } = await params;
  return <p>Credential id: {credentialId}</p>;
}
