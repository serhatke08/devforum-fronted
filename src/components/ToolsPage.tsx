'use client';

import { ArrowLeft, Wrench, Coins, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface ToolsPageProps {
  onBack: () => void;
  onSelectTool: (toolId: string) => void;
}

interface CreditAccount {
  id: string;
  user_id: string;
  balance: number;
  total_earned: number;
  total_spent: number;
}

interface Tool {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  credit_cost: number;
  is_active: boolean;
  icon: string | null;
  color: string;
}

export function ToolsPage({ onBack, onSelectTool }: ToolsPageProps) {
  const { user } = useAuth();
  const [creditAccount, setCreditAccount] = useState<CreditAccount | null>(null);
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchCreditAccount();
      fetchTools();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchCreditAccount = async () => {
    try {
      const { data, error } = await supabase
        .from('user_credit_accounts')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) {
        // 406 hatası veya tablo bulunamadı hatası için varsayılan değer
        if (error.code === 'PGRST116' || error.status === 406) {
          setCreditAccount({ balance: 0, total_earned: 0, total_spent: 0 });
          return;
        }
        throw error;
      }
      
      setCreditAccount(data);
    } catch (error) {
      console.error('Kredi hesabı yükleme hatası:', error);
      // Hata durumunda varsayılan değerler
      setCreditAccount({ balance: 0, total_earned: 0, total_spent: 0 });
    }
  };

  const fetchTools = async () => {
    try {
      const { data, error } = await supabase
        .from('tools')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) throw error;
      
      setTools(data || []);
    } catch (error) {
      console.error('Araçlar yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToolSelect = async (toolSlug: string) => {
    if (!user) {
      alert('Araç kullanmak için giriş yapmanız gerekiyor.');
      return;
    }

    // Araç sayfasına yönlendir (kredi kontrolü araç sayfasında yapılacak)
    onSelectTool(toolSlug);
  };

  const getToolCost = (toolSlug: string) => {
    // Sabit kredi maliyetleri
    const creditCosts: { [key: string]: number } = {
      'pdf-editor-converter': 75,
      'image-dpi-converter-pro': 50,
      'image-dpi-converter': 50,
      'cv-creator': 100,
      'tiktok-downloader': 50,
      'youtube-downloader': 50,
      'instagram-downloader': 50,
      'lock-down-files': 50,
      'clean-work': 0,
      'fenomen-gpt': 0
    };
    return creditCosts[toolSlug] || 0;
  };

  const canAfford = (toolSlug: string) => {
    const cost = getToolCost(toolSlug);
    return creditAccount && creditAccount.balance >= cost;
  };

  const ToolCard = ({ toolSlug, title, description, imageSrc, buttonColor = "from-[#9c6cfe] to-[#0ad2dd]" }: {
    toolSlug: string;
    title: string;
    description: string;
    imageSrc: string;
    buttonColor?: string;
  }) => {
    const cost = getToolCost(toolSlug);
    
    return (
      <div className="text-center group h-full">
        <div className="bg-white rounded-2xl p-8 shadow-sm border-2 border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300 group-hover:scale-105 h-full flex flex-col">
          <img 
            src={imageSrc} 
            alt={title} 
            className="w-40 h-40 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300"
            onClick={() => handleToolSelect(toolSlug)}
          />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600 text-sm mb-4 flex-grow">{description}</p>
          
          {/* Kredi bilgisi kaldırıldı */}
          
          <button
            onClick={() => handleToolSelect(toolSlug)}
            className={`w-full py-2 px-4 rounded-lg font-medium transition-all mt-auto bg-gradient-to-r ${buttonColor} text-white hover:shadow-lg`}
          >
            Kullan
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 py-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="p-2 bg-gradient-to-r from-[#9c6cfe] to-[#0ad2dd] rounded-lg flex-shrink-0">
                <Wrench className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-2xl font-black text-gray-900 truncate">ARAÇLAR</h1>
                <p className="text-xs sm:text-base text-gray-600 truncate">Geliştiriciler için faydalı araçlar</p>
              </div>
            </div>
            
            {/* Kredi Bakiyesi */}
            {user && (
              <div className="ml-auto flex items-center gap-3">
                <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-200">
                  <Coins className="w-5 h-5 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">
                    {creditAccount?.balance || 0} kredi
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Uygulama Logosu */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">DevForum</h1>
          <p className="text-xl text-gray-600">Geliştiriciler için araçlar ve topluluk</p>
        </div>

        {/* Araçlar Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
          <ToolCard
            toolSlug="pdf-editor-converter"
            title="Format Dönüştürücü"
            description="Tüm dosya formatlarınızı kolayca dönüştürün"
            imageSrc="/LOGO/araçlogo/pdfeditorconverter.svg"
          />
          
          <ToolCard
            toolSlug="image-dpi-converter"
            title="Image DPI Converter"
            description="Görsellerinizin DPI değerini değiştirin"
            imageSrc="/image-dpi-converter.svg"
          />
          
          <ToolCard
            toolSlug="cv-creator"
            title="CV Creator"
            description="Profesyonel CV oluşturun"
            imageSrc="/cvcreator.svg"
          />
          
          <ToolCard
            toolSlug="tiktok-downloader"
            title="TikTok Video Downloader"
            description="TikTok videolarını indirin"
            imageSrc="/tiktok-downloader.svg"
          />
          
          <ToolCard
            toolSlug="fenomen-gpt"
            title="Fenomen GPT"
            description="Yapay zeka destekli GPT aracı"
            imageSrc="/fenomen-gpt.svg"
          />
          
          <ToolCard
            toolSlug="youtube-downloader"
            title="YouTube Video Downloader"
            description="YouTube videolarını indirin"
            imageSrc="/youtube-downloader.svg"
          />
          
          <ToolCard
            toolSlug="lock-down-files"
            title="Lock Down Files"
            description="Dosyalarınızı güvenli hale getirin"
            imageSrc="/lock-down-files.svg"
          />
          
          <ToolCard
            toolSlug="clean-work"
            title="Clean Work"
            description="Temiz ve düzenli çalışma ortamı"
            imageSrc="/clean-work.svg"
          />
          
          <ToolCard
            toolSlug="instagram-downloader"
            title="Instagram Video Downloader"
            description="Instagram videolarını indirin"
            imageSrc="/instagram-downloader.svg"
            buttonColor="from-[#E1306C] to-[#833AB4]"
          />
        </div>

        {/* Footer Info */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-[#9c6cfe] to-[#0ad2dd] rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">Daha Fazla Araç Geliyor!</h3>
            <p className="text-white/90 mb-6">
              Geliştiriciler için sürekli yeni araçlar ekliyoruz. 
              Güncel kalmak için takipte kalın!
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <span className="bg-white/20 px-3 py-1 rounded-full">Görsel İşleme</span>
              <span className="bg-white/20 px-3 py-1 rounded-full">Video İndirme</span>
              <span className="bg-white/20 px-3 py-1 rounded-full">AI Araçları</span>
              <span className="bg-white/20 px-3 py-1 rounded-full">Güvenlik</span>
              <span className="bg-white/20 px-3 py-1 rounded-full">Verimlilik</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
