'use client';

import { ContactPage } from '@/components/ContactPage';
import { useRouter } from 'next/navigation';

export default function Contact() {
  const router = useRouter();
  return <ContactPage onBack={() => router.push('/')} />;
}
