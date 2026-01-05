import type { Metadata } from 'next';
import { HomePage } from '@/components/HomePage';

export const metadata: Metadata = {
  title: 'DevForum - Türkiye\'nin En Büyük Yazılım ve Teknoloji Forumu',
  description: 'Yazılım geliştiriciler, freelancerlar ve teknoloji meraklıları için Türkiye\'nin en aktif forum platformu',
  alternates: {
    canonical: 'https://devforum.xyz/'
  },
  openGraph: {
    title: 'DevForum - Türkiye\'nin En Büyük Yazılım ve Teknoloji Forumu',
    description: 'Yazılım geliştiriciler, freelancerlar ve teknoloji meraklıları için Türkiye\'nin en aktif forum platformu',
    url: 'https://devforum.xyz/',
    type: 'website'
  }
};

export default function Home() {
  return <HomePage />;
}
