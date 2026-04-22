interface PageProps {
  params: Promise<{
    executionId: string;
  }>;
}

// http://localhost:3000/executions/123

export default async function Page({ params }: PageProps) {
  const { executionId } = await params;
  return <p>Execution id: {executionId}</p>;
}
