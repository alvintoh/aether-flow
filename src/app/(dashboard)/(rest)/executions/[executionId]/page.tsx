interface PageProps {
  params: Promise<{
    executionId: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { executionId } = await params;
  return <p>Execution id: {executionId}</p>;
}
