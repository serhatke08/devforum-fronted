'use client';

import { ToolsPage } from '@/components/ToolsPage';
import { useRouter } from 'next/navigation';

export default function Tools() {
  const router = useRouter();
  return <ToolsPage onBack={() => router.push('/')} onSelectTool={(slug) => router.push(`/tools/${slug}`)} />;
}
