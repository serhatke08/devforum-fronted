'use client';

import { FAQPage } from '@/components/FAQPage';
import { useRouter } from 'next/navigation';

export default function FAQ() {
  const router = useRouter();
  return <FAQPage onBack={() => router.push('/')} />;
}
