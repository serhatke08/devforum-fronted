'use client';

import { ToolDetailPage } from '@/components/ToolDetailPage';
import { useRouter } from 'next/navigation';

type Props = {
  params: { toolSlug: string };
};

export default function ToolPage({ params }: Props) {
  const router = useRouter();
  return <ToolDetailPage toolSlug={params.toolSlug} />;
}
