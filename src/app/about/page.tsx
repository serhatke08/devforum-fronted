'use client';

import { AboutPage } from '@/components/AboutPage';
import { useRouter } from 'next/navigation';

export default function About() {
  const router = useRouter();
  return <AboutPage onBack={() => router.push('/')} />;
}
