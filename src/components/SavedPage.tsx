'use client';

import { ArrowLeft, Bookmark, MessageSquare, Eye, Clock, ThumbsUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { formatDistanceToNow } from '../utils/dateUtils';
import type { Database } from '../lib/database.types';

type Topic = Database['public']['Tables']['topics']['Row'];

interface SavedPageProps {
  onBack: () => void;
  onTopicClick: (topicId: string) => void;
  onViewProfile?: (userId: string) => void;
}

interface TopicWithDetails extends Topic {
  author: {
    display_name: string;
    username: string;
    avatar_url?: string;
  };
  sub_category: {
    name: string;
    color: string;
    main_category: {
      name: string;
    };
  };
}

export function SavedPage({ onBack, onTopicClick, onViewProfile }: SavedPageProps) {
  const { user } = useAuth();
  const [topics, setTopics] = useState<TopicWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadSavedTopics();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadSavedTopics = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Kaydedilen konuları getir
      const { data } = await supabase
        .from('saved_topics')
        .select(`
          topic_id,
          topics!inner(
            *,
            author:profiles!topics_author_id_fkey(display_name, username, avatar_url),
            sub_category:sub_categories(
              name, 
              color,
              main_category:main_categories(name)
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data) {
        const savedTopics = data.map((item: any) => item.topics).filter(Boolean);
        setTopics(savedTopics);
      }
    } catch (error) {
      console.error('Kaydedilen konular yüklenirken hata:', error);
      // Hata durumunda boş liste
      setTopics([]);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors md:static fixed top-16 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-3 shadow-sm md:border-0 md:shadow-none md:px-0 md:py-0"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium md:inline">Geri Dön</span>
          </button>
        </div>
        
        <div className="text-center py-12">
          <Bookmark className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Giriş Yapın</h2>
          <p className="text-gray-600 mb-4">Kaydedilen konuları görüntülemek için giriş yapmanız gerekiyor.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#9c6cfe] mx-auto mb-4"></div>
          <p className="text-gray-600">Kaydedilen konular yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Geri Tuşu - Mobilde Header'ın altında tam genişlik */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors md:static fixed top-16 left-0 right-0 z-40 bg-white border-b border-gray-200 px-4 py-3 shadow-sm md:border-0 md:shadow-none md:px-0 md:py-0"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="font-medium md:inline">Geri Dön</span>
      </button>
      
      {/* Mobilde geri tuşu için padding */}
      <div className="md:hidden h-[60px]"></div>
      
      {/* Header */}
      <div className="mb-6">

        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-gradient-to-r from-[#9c6cfe] to-[#0ad2dd] rounded-xl">
            <Bookmark className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Kaydedilen Konular</h1>
            <p className="text-gray-600 mt-1">Daha sonra okumak için kaydettiğiniz konular</p>
          </div>
        </div>
      </div>

      {/* Konular listesi */}
      <div className="bg-white rounded-lg border border-gray-200">
        {topics.length === 0 ? (
          <div className="text-center py-12">
            <Bookmark className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Henüz kaydedilen konu yok</h3>
            <p className="text-gray-600">
              Beğendiğiniz konuları kaydetmek için konu sayfasındaki kaydet butonunu kullanın.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {topics.map((topic) => (
              <div key={topic.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex gap-4">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {topic.author?.avatar_url ? (
                      <img
                        src={topic.author.avatar_url}
                        alt={topic.author.display_name || topic.author.username}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#9c6cfe] to-[#0ad2dd] flex items-center justify-center">
                        <span className="text-white font-semibold text-base">
                          {(topic.author?.display_name || topic.author?.username || 'U').charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 
                            className="text-lg font-semibold text-gray-900 hover:text-[#9c6cfe] transition-colors cursor-pointer line-clamp-2"
                            onClick={() => onTopicClick(topic.id)}
                          >
                            {topic.title.length > 85 
                              ? topic.title.charAt(0).toUpperCase() + topic.title.slice(1, 85) + '...'
                              : topic.title.charAt(0).toUpperCase() + topic.title.slice(1)
                            }
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <button
                            onClick={() => onViewProfile?.(topic.author_id)}
                            className="font-medium text-gray-900 hover:text-[#9c6cfe] transition-colors cursor-pointer"
                          >
                            {topic.author?.display_name || topic.author?.username || 'Bilinmeyen Kullanıcı'}
                          </button>
                          <span className="text-gray-400">•</span>
                          <button
                            onClick={() => onViewProfile?.(topic.author_id)}
                            className="text-gray-500 hover:text-[#9c6cfe] transition-colors cursor-pointer"
                          >
                            @{topic.author?.username || 'unknown'}
                          </button>
                        </div>
                      </div>

                    </div>
                    
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {topic.content}
                    </p>
                    
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="w-4 h-4" />
                        <span>{topic.useful_count || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        <span>{topic.reply_count}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        <span>{topic.view_count}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{formatDistanceToNow(topic.last_post_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}