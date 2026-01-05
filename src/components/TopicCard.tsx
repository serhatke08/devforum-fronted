'use client';

import { Pin, Lock, MoreVertical, Trash2, MessageCircle, Eye, Star } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface TopicCardProps {
  topic: {
    id: string;
    title: string;
    content: string;
    author_id: string;
    author: {
      id: string;
      display_name?: string;
      username?: string;
      avatar_url?: string;
      active_badge_icon?: string | null;
    } | null;
    sub_category: {
      name: string;
      color: string;
      main_category: {
        name: string;
      };
    };
    reply_count: number;
    view_count: number;
    is_pinned: boolean;
    is_locked: boolean;
    created_at: string;
    last_post_at: string;
    is_featured?: boolean;
    featured_position?: number;
    featured_end_date?: string;
  };
  onClick: () => void;
  onViewProfile?: (userId: string) => void;
  onTopicDeleted?: () => void;
  showSubcategory?: boolean;
  compact?: boolean;
}

export function TopicCard({ topic, onClick, onViewProfile, onTopicDeleted, showSubcategory = true, compact = false }: TopicCardProps) {
  const { user } = useAuth();
  const [showMenuForTopic, setShowMenuForTopic] = useState<string | null>(null);

  const handleDeleteTopic = async (topicId: string) => {
    if (!confirm('Bu konuyu silmek istediğinizden emin misiniz?')) return;
    
    try {
      const { error } = await supabase
        .from('topics')
        .delete()
        .eq('id', topicId);
      
      if (error) throw error;
      
      onTopicDeleted?.();
    } catch (error) {
      console.error('Konu silinirken hata:', error);
      alert('Konu silinirken bir hata oluştu');
    }
  };

  return (
    <div
      onClick={onClick}
      className={`relative bg-white border border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all cursor-pointer group ${
        compact ? 'border-t-0 first:border-t border-x-0 last:rounded-b-md first:rounded-t-md' : 'rounded-xl shadow-sm'
      } ${topic.is_featured ? 'border-l-4 border-l-yellow-400' : ''}`}
    >
      <div className={compact ? 'p-3' : 'p-4 sm:p-6'}>
        <div className="flex items-center gap-3">
          {/* Yıldız - Avatar'ın solunda (sadece mobilde) */}
          {topic.is_featured && (
            <div className="flex sm:hidden flex-shrink-0 items-center justify-center bg-gradient-to-r from-yellow-400 to-orange-500 text-white w-5 h-5 rounded">
              <Star className="w-3 h-3 fill-current" />
            </div>
          )}
          
          <div className="flex-shrink-0">
            {topic.author?.avatar_url ? (
              <img
                src={topic.author.avatar_url}
                alt={topic.author.display_name || topic.author.username}
                className={`rounded-full object-cover border border-gray-200 ${
                  compact ? 'w-6 h-6' : 'w-8 h-8'
                }`}
              />
            ) : (
              <div className={`rounded-full bg-gradient-to-br from-[#9c6cfe] to-[#0ad2dd] flex items-center justify-center border border-gray-200 ${
                compact ? 'w-6 h-6' : 'w-8 h-8'
              }`}>
                <span className={`text-white font-semibold ${
                  compact ? 'text-xs' : 'text-sm'
                }`}>
                  {(topic.author?.display_name || topic.author?.username || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            {compact ? (
              /* Compact mod: Mobil için optimize edilmiş düzen - Sadece başlık (mobilde),
                 tablet ve üzeri ekranlarda kullanıcı adı + istatistikler görünsün */
              <div className="flex items-center w-full">
                {/* Başlık - Ana alan */}
                <div className="flex items-center gap-1 flex-1 min-w-0">
                  {topic.is_pinned && (
                    <Pin className="w-3 h-3 text-[#9c6cfe] flex-shrink-0" />
                  )}
                  {topic.is_locked && (
                    <Lock className="w-3 h-3 text-gray-400 flex-shrink-0" />
                  )}
                  {/* PC'de öne çıkan badge - başlığın yanında */}
                  {topic.is_featured && (
                    <div className="hidden sm:flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-0.5 rounded text-xs font-bold flex-shrink-0">
                      <Star className="w-3 h-3 fill-current" />
                      <span>#{topic.featured_position}</span>
                    </div>
                  )}
                  <h3 className="text-xs sm:text-sm font-medium text-gray-900 group-hover:text-[#9c6cfe] transition-colors truncate">
                    {topic.title.length > 85 
                      ? topic.title.charAt(0).toUpperCase() + topic.title.slice(1, 85) + '...'
                      : topic.title.charAt(0).toUpperCase() + topic.title.slice(1)
                    }
                  </h3>
                </div>

                {/* İstatistikler */}
                <div className="flex items-center justify-end gap-1.5 text-[10px] sm:text-xs text-gray-500 flex-shrink-0">
                  <div className="flex items-center gap-0.5">
                    <MessageCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    <span>{topic.reply_count}</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    <span>{topic.view_count}</span>
                  </div>
                </div>
              </div>
            ) : (
              /* Normal mod: Responsive yatay düzen */
              <div className="flex items-center w-full">
                {/* Sol: Konu Başlığı - Mobilde daha fazla alan */}
                <div className="flex-1 flex items-center gap-1 sm:gap-2 pr-1 sm:pr-2 min-w-0">
                  {topic.is_pinned && (
                    <Pin className="w-3 h-3 sm:w-4 sm:h-4 text-[#9c6cfe] flex-shrink-0" />
                  )}
                  {topic.is_locked && (
                    <Lock className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                  )}
                  {/* PC'de öne çıkan badge - başlığın yanında */}
                  {topic.is_featured && (
                    <div className="hidden sm:flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-0.5 rounded text-xs font-bold flex-shrink-0">
                      <Star className="w-3 h-3 fill-current" />
                      <span>#{topic.featured_position}</span>
                    </div>
                  )}
                  <h3 className="text-xs sm:text-sm lg:text-base font-medium text-gray-900 group-hover:text-[#9c6cfe] transition-colors truncate flex-1">
                    {topic.title.charAt(0).toUpperCase() + topic.title.slice(1)}
                  </h3>
                </div>

                {/* Sağ: İstatistikler, Menü ve Kategori */}
                <div className="flex items-center justify-end gap-0.5 sm:gap-1 lg:gap-2 flex-shrink-0">
                  {/* İstatistikler - Mobilde daha kompakt */}
                  <div className="flex items-center gap-0.5 sm:gap-1 lg:gap-2 text-[9px] sm:text-[10px] text-gray-500">
                    <div className="flex items-center gap-0.5">
                      <MessageCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      <span>{topic.reply_count}</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      <span>{topic.view_count}</span>
                    </div>
                  </div>
                
                  {/* 3 Nokta Menüsü */}
                  <div className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center">
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMenuForTopic(showMenuForTopic === topic.id ? null : topic.id);
                        }}
                        className="p-0.5 sm:p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <MoreVertical className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                      
                      {showMenuForTopic === topic.id && (
                        <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]">
                          {/* Silme butonu - sadece konu sahibi görebilir */}
                          {user?.id === topic.author?.id && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTopic(topic.id);
                                setShowMenuForTopic(null);
                              }}
                              className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2 text-sm"
                            >
                              <Trash2 className="w-4 h-4" />
                              Sil
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Kategori - Mobilde gizle, tablet+ göster */}
                  {topic.sub_category && showSubcategory && (
                    <div
                      className="hidden sm:block px-2 py-1 rounded-full text-xs font-medium text-white flex-shrink-0"
                      style={{ backgroundColor: topic.sub_category.color || '#6B7280' }}
                    >
                      {topic.sub_category.name}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
