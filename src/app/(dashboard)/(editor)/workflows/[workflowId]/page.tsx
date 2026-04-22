interface PageProps {
  params: Promise<{
    workflowId: string;
  }>;
}

// http://localhost:3000/workflows/123

export default async function Page({ params }: PageProps) {
  const { workflowId } = await params;
  return <p>Workflow id: {workflowId}</p>;
}
