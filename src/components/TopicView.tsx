'use client';

import { ArrowLeft, MessageSquare, Eye, ThumbsUp, Reply, Trash2, Bookmark, BookmarkCheck, MoreVertical } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { formatDistanceToNow } from '../utils/dateUtils';
import type { Database } from '../lib/database.types';

type Topic = Database['public']['Tables']['topics']['Row'];
type Post = Database['public']['Tables']['posts']['Row'];

interface TopicViewProps {
  topicId: string;
  onBack: () => void;
  onViewProfile?: (userId: string) => void;
  onViewCountUpdate?: (topicId: string) => void;
  onReplyCountUpdate?: (topicId: string) => void;
  onUsefulCountUpdate?: (topicId: string, increment: boolean) => void;
  onSaveToggle?: (topicId: string, isSaved: boolean) => void;
}

interface TopicWithDetails extends Topic {
  author_id: string;
  author: {
    id: string;
    display_name: string;
    username: string;
    avatar_url?: string;
    reputation: number;
  };
  category: {
    name: string;
    color: string;
  };
}

interface PostWithAuthor extends Post {
  author_id: string;
  author: {
    id: string;
    display_name: string;
    username: string;
    avatar_url?: string;
    reputation: number;
  };
  replies?: PostWithAuthor[];
  isLiked?: boolean;
  reply_to_author?: {
    id: string;
    display_name: string;
    username: string;
  };
}

interface ExtendedTopicViewProps extends TopicViewProps {
  preIncremented?: boolean;
}

export function TopicView({ topicId, onBack, onViewProfile, onViewCountUpdate, onReplyCountUpdate, onUsefulCountUpdate, onSaveToggle, preIncremented = false }: ExtendedTopicViewProps) {
  const { user } = useAuth();
  const [topic, setTopic] = useState<TopicWithDetails | null>(null);
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isUseful, setIsUseful] = useState(false);
  const [usefulCount, setUsefulCount] = useState(0);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyToContent, setReplyToContent] = useState('');
  const [replyingToPost, setReplyingToPost] = useState<PostWithAuthor | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const hasRecordedView = useRef(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportError, setReportError] = useState('');
  const [reportSuccess, setReportSuccess] = useState('');
  const [shareHint, setShareHint] = useState('');
  const [showTopicMenu, setShowTopicMenu] = useState(false);

  useEffect(() => {
    hasRecordedView.current = false;
    loadTopic();
    loadPosts();
    loadUsefulStatus();
    loadSaveStatus();
  }, [topicId]);

  // Kullanıcı giriş yaptığında faydalı durumunu yükle
  useEffect(() => {
    if (user && topicId) {
      loadUsefulStatus();
    }
  }, [user, topicId]);


  useEffect(() => {
    if (topic && !hasRecordedView.current) {
      hasRecordedView.current = true;
      // Eğer listede tıklarken zaten artırıldıysa, burada tekrar artırma
      if (!preIncremented) {
        recordView();
      }
    }
  }, [topic, preIncremented]);

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !topicId) return;
    const reason = reportReason.trim();
    if (reason.length < 5) {
      setReportError('Lütfen en az 5 karakterlik bir gerekçe yazın.');
      return;
    }

    setReportError('');
    setReportSuccess('');
    setReportSubmitting(true);
    try {
      const { error } = await supabase
        .from('topic_reports' as any)
        .insert({ topic_id: topicId, reporter_id: user.id, reason });
      if (error) throw error;

      setReportSuccess('Bildiriminiz alındı. Teşekkürler.');
      setReportReason('');
      setTimeout(() => setShowReportModal(false), 700);
    } catch (err: any) {
      setReportError(err?.message || 'Bildirirken bir hata oluştu');
    } finally {
      setReportSubmitting(false);
    }
  };

  const handleDeleteTopic = async () => {
    if (!confirm('Bu konuyu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve tüm yorumlar da silinecektir.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('topics')
        .delete()
        .eq('id', topicId);
      
      if (error) throw error;
      
      // Ana sayfaya yönlendir
      onBack();
    } catch (error) {
      console.error('Konu silinirken hata:', error);
      alert('Konu silinirken bir hata oluştu');
    }
  };

  const handleShare = async () => {
    try {
      const shareUrl = window.location.href;
      const title = topic?.title || 'DevForum';
      const text = 'Buna bir göz at!';
      if ((navigator as any).share) {
        await (navigator as any).share({ title, text, url: shareUrl });
      } else if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl);
        setShareHint('Bağlantı panoya kopyalandı');
        setTimeout(() => setShareHint(''), 1200);
      } else {
        // Fallback for non-secure contexts
        const el = document.createElement('textarea');
        el.value = shareUrl;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        setShareHint('Bağlantı panoya kopyalandı');
        setTimeout(() => setShareHint(''), 1200);
      }
    } catch (e) {
      setShareHint('Paylaşım başarısız');
      setTimeout(() => setShareHint(''), 1200);
    }
  };

  const loadUsefulStatus = async () => {
    if (!user) {
      setIsUseful(false);
      return;
    }
    
    try {
      // RLS hatası durumunda da false döndür
      const { data, error } = await supabase
        .from('topic_useful')
        .select('id')
        .eq('topic_id', topicId)
        .eq('user_id', user.id)
        .maybeSingle(); // single() yerine maybeSingle() kullan
      
      if (error) {
        console.log('loadUsefulStatus hatası:', error);
        setIsUseful(false);
        return;
      }
      
      setIsUseful(!!data);
    } catch (error) {
      console.log('loadUsefulStatus catch hatası:', error);
      setIsUseful(false);
    }
  };

  const loadSaveStatus = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('saved_topics')
        .select('id')
        .eq('topic_id', topicId)
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Kayıt bulunamadı - kaydedilmemiş
          setIsSaved(false);
        } else {
          console.error('Kaydetme durumu yükleme hatası:', error);
          setIsSaved(false);
        }
      } else {
        setIsSaved(!!data);
      }
    } catch (error) {
      console.error('Kaydetme durumu yükleme genel hatası:', error);
      setIsSaved(false);
    }
  };

  const loadTopic = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('topics')
        .select(`
          *,
          author:profiles!topics_author_id_fkey(id, display_name, username, avatar_url, reputation, active_badge_icon),
          sub_category:sub_categories(name, color, main_category:main_categories(name))
        `)
        .eq('id', topicId)
        .single();

      if (error) throw error;

      if (data) {
        const formattedData = {
          ...data,
          category: {
            name: data.sub_category?.main_category?.name || 'Genel',
            color: data.sub_category?.color || '#9c6cfe'
          }
        };
        setTopic(formattedData as any);
        setUsefulCount((data as any).useful_count || 0);
      }
    } catch (error) {
      console.error('Topic yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('posts')
        .select(`
          *,
          author:profiles!posts_author_id_fkey(id, display_name, username, avatar_url, reputation, active_badge_icon)
        `)
        .eq('topic_id', topicId)
        .is('reply_to_id', null)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data) {
        const postsWithReplies = await Promise.all(
          data.map(async (post: any) => {
            const { data: replies } = await (supabase as any)
              .from('posts')
              .select(`
                *,
                author:profiles!posts_author_id_fkey(id, display_name, username, avatar_url, reputation, active_badge_icon)
              `)
              .eq('reply_to_id', post.id)
              .order('created_at', { ascending: true });

            let isLiked = false;
            if (user) {
              const { data: likeData } = await (supabase as any)
                .from('post_likes')
                .select('id')
                .eq('post_id', post.id)
                .eq('user_id', user.id)
                .single();
              isLiked = !!likeData;
            }

            const repliesWithLikes = await Promise.all(
              (replies || []).map(async (reply: any) => {
                let replyIsLiked = false;
                if (user) {
                  const { data: replyLikeData } = await (supabase as any)
                    .from('post_likes')
                    .select('id')
                    .eq('post_id', reply.id)
                    .eq('user_id', user.id)
                    .single();
                  replyIsLiked = !!replyLikeData;
                }
                
                return { ...reply, isLiked: replyIsLiked };
              })
            );

            return { ...post, isLiked, replies: repliesWithLikes };
          })
        );

        // Yanıtlanan mesaj bilgilerini ekle
        const postsWithReplyInfo = postsWithReplies.map(post => ({
          ...post,
          replies: post.replies?.map((reply: any) => {
            if (reply.reply_to_id) {
              // Ana yorumu bul
              const parentPost = postsWithReplies.find(p => p.id === reply.reply_to_id);
              if (parentPost) {
                return {
                  ...reply,
                  reply_to_author: {
                    id: parentPost.author.id,
                    display_name: parentPost.author.display_name,
                    username: parentPost.author.username
                  }
                };
              }
            }
            return reply;
          })
        }));

        setPosts(postsWithReplyInfo as any);
        
        // Toplam yorum sayısını hesapla ve güncelle
        const totalReplies = postsWithReplies.reduce((total, post) => {
          return total + 1 + (post.replies?.length || 0); // Ana yorum + yanıtları
        }, 0);
        
        // Topic'in reply_count'unu güncelle
        if (topic) {
          setTopic(prev => prev ? { ...prev, reply_count: totalReplies } : null);
        }
      }
    } catch (error) {
      console.error('Posts yüklenirken hata:', error);
    }
  };

  const recordView = async () => {
    try {
      // Atomic artırım için RPC kullan
      await (supabase as any).rpc<any>('increment_topic_view', {
        p_topic_id: topicId
      });

      onViewCountUpdate?.(topicId);
    } catch (error) {
      console.error('View kaydı hatası:', error);
    }
  };

  const handleUseful = async () => {
    if (!user || !topic) return;

    // Kendi gönderimine beğeni verilmesini engelle
    if (topic.author_id === user.id) return;

    try {
      if (isUseful) {
        // Beğeniyi kaldır
        const { error: deleteError } = await supabase
          .from('topic_useful')
          .delete()
          .eq('topic_id', topicId)
          .eq('user_id', user.id);

        if (deleteError) {
          console.log('Beğeni silme hatası:', deleteError);
        }

        // Eksiye düşmesini engelle - minimum 0
        const newCount = Math.max(0, (usefulCount || 0) - 1);
        
        const { error: updateError } = await supabase
          .from('topics')
          .update({ 
            useful_count: newCount,
            updated_at: new Date().toISOString()
          })
          .eq('id', topicId);

        if (updateError) {
          console.log('Topic güncelleme hatası:', updateError);
        }

        setIsUseful(false);
        setUsefulCount(newCount);
        onUsefulCountUpdate?.(topicId, false);
      } else {
        // Beğeni ekle
        const { error: insertError } = await supabase
          .from('topic_useful')
          .insert({
            topic_id: topicId,
            user_id: user.id
          });

        if (insertError) {
          console.log('Beğeni ekleme hatası:', insertError);
        }

        const newCount = (usefulCount || 0) + 1;

        const { error: updateError } = await supabase
          .from('topics')
          .update({ 
            useful_count: newCount,
            updated_at: new Date().toISOString()
          })
          .eq('id', topicId);

        if (updateError) {
          console.log('Topic güncelleme hatası:', updateError);
        }

        setIsUseful(true);
        setUsefulCount(newCount);
        onUsefulCountUpdate?.(topicId, true);
      }
    } catch (error) {
      console.error('Useful işlemi genel hatası:', error);
    }
  };

  const handleSave = async () => {
    if (!user || !topic) return;

    try {
      if (isSaved) {
        // Kaydetmeyi kaldır
        const { error } = await supabase
          .from('saved_topics')
          .delete()
          .eq('topic_id', topicId)
          .eq('user_id', user.id);

        if (error) {
          console.error('Kaydetme kaldırma hatası:', error);
          return;
        }

        setIsSaved(false);
        onSaveToggle?.(topicId, false);
        console.log('Konu kaydedilenlerden kaldırıldı');
      } else {
        // Kaydet
        const { error } = await supabase
          .from('saved_topics')
          .insert({
            topic_id: topicId,
            user_id: user.id
          });

        if (error) {
          console.error('Kaydetme hatası:', error);
          return;
        }

        setIsSaved(true);
        onSaveToggle?.(topicId, true);
        console.log('Konu kaydedildi');
      }
    } catch (error) {
      console.error('Kaydetme genel hatası:', error);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !replyContent.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await (supabase as any)
        .from('posts')
        .insert({
          topic_id: topicId,
          author_id: user.id,
          content: replyContent
        });

      if (error) throw error;

      await (supabase as any)
        .from('topics')
        .update({ 
          reply_count: (topic?.reply_count || 0) + 1,
          last_post_at: new Date().toISOString(),
          last_post_user_id: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', topicId);

      setReplyContent('');
      setReplyingTo(null);
      loadPosts();
      onReplyCountUpdate?.(topicId);
    } catch (error) {
      console.error('Reply ekleme hatası:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReplyToComment = async (e: React.FormEvent, parentPostId: string) => {
    e.preventDefault();
    if (!user || !replyToContent.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await (supabase as any)
        .from('posts')
        .insert({
          topic_id: topicId,
          author_id: user.id,
          content: replyToContent,
          reply_to_id: parentPostId
        });

      if (error) throw error;

      await (supabase as any)
        .from('topics')
        .update({ 
          reply_count: (topic?.reply_count || 0) + 1,
          last_post_at: new Date().toISOString(),
          last_post_user_id: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', topicId);

      setReplyToContent('');
      setReplyingTo(null);
      loadPosts();
      onReplyCountUpdate?.(topicId);
    } catch (error) {
      console.error('Reply ekleme hatası:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikePost = async (postId: string) => {
    if (!user) return;

    try {
      const post = posts.find(p => p.id === postId) || posts.find(p => p.replies?.some(r => r.id === postId))?.replies?.find(r => r.id === postId);
      if (!post) return;

      if (post.isLiked) {
        await (supabase as any)
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        await (supabase as any)
          .from('posts')
          .update({ 
            like_count: (post.like_count || 0) - 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', postId);

        setPosts(prev => prev.map(p => {
          if (p.id === postId) {
            return { ...p, isLiked: false, like_count: (p.like_count || 0) - 1 };
          }
          if (p.replies) {
            return {
              ...p,
              replies: p.replies.map(r => 
                r.id === postId 
                  ? { ...r, isLiked: false, like_count: (r.like_count || 0) - 1 }
                  : r
              )
            };
          }
          return p;
        }));
      } else {
        await (supabase as any)
          .from('post_likes')
          .insert({
            post_id: postId,
            user_id: user.id,
          });

        await (supabase as any)
          .from('posts')
          .update({ 
            like_count: (post.like_count || 0) + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', postId);

        setPosts(prev => prev.map(p => {
          if (p.id === postId) {
            return { ...p, isLiked: true, like_count: (p.like_count || 0) + 1 };
          }
          if (p.replies) {
            return {
              ...p,
              replies: p.replies.map(r => 
                r.id === postId 
                  ? { ...r, isLiked: true, like_count: (r.like_count || 0) + 1 }
                  : r
              )
            };
          }
          return p;
        }));
      }
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!user) return;
    
    if (!confirm('Bu yorumu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
      return;
    }

    try {
      const { error } = await (supabase as any)
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      setPosts(prev => prev.map(p => {
        if (p.replies) {
          return {
            ...p,
            replies: p.replies.filter(r => r.id !== postId)
          };
        }
        return p;
      }));

      onReplyCountUpdate?.(topicId);
    } catch (error) {
      console.error('Yorum silinirken hata:', error);
      alert('Yorum silinirken bir hata oluştu.');
    }
  };

  if (loading || !topic) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#9c6cfe] border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Konu yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-4">
      {/* Geri Tuşu - Mobilde Header'ın altında tam genişlik */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors md:static fixed top-16 left-0 right-0 z-40 bg-white border-b border-gray-200 px-4 py-3 shadow-sm md:border-0 md:shadow-none md:px-0 md:py-0"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="font-medium md:inline">Geri Dön</span>
      </button>
      
      {/* Mobilde geri tuşu için padding */}
      <div className="md:hidden h-[60px]"></div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {/* Topic Header */}
        <div className="p-2 sm:p-4 md:p-6 border-b border-gray-200">
          <div className="flex flex-col gap-2 sm:gap-4">
            {/* Mobilde: Başlık ve kategori üstte */}
            <div className="flex items-start justify-between gap-2 sm:gap-4">
              <h1 className="text-sm sm:text-lg md:text-xl font-bold text-gray-900 break-words flex-1 min-w-0">{topic.title}</h1>
              <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                <span
                  className="px-1.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs md:text-sm font-medium text-white whitespace-nowrap"
                  style={{ backgroundColor: topic.category.color }}
                >
                  {topic.category.name}
                </span>
                
                {/* 3 Nokta Menüsü */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowTopicMenu(!showTopicMenu);
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <MoreVertical className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                  
                  {showTopicMenu && (
                    <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]">
                      {/* Silme butonu - sadece konu sahibi görebilir */}
                      {user?.id === topic.author_id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTopic();
                            setShowTopicMenu(false);
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
            </div>
            
            {/* Profil Bilgileri - Mobilde daha kompakt */}
            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 text-xs sm:text-sm text-gray-600 flex-wrap">
              {/* Profil Fotoğrafı */}
              {topic.author.avatar_url ? (
                <img
                  src={topic.author.avatar_url}
                  alt={topic.author.display_name}
                  className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onViewProfile?.(topic.author_id);
                  }}
                />
              ) : (
                <div 
                  className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-[#9c6cfe] to-[#0ad2dd] flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onViewProfile?.(topic.author_id);
                  }}
                >
                  <span className="text-white font-semibold text-[10px] sm:text-xs md:text-sm">
                    {topic.author.display_name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              
              <span className="font-medium text-gray-900 text-xs sm:text-sm truncate max-w-[100px] sm:max-w-none">
                {topic.author.display_name}
              </span>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onViewProfile?.(topic.author_id);
                }}
                className="text-gray-600 hover:text-[#9c6cfe] transition-colors flex items-center text-xs sm:text-sm"
              >
                <span className="truncate max-w-[80px] sm:max-w-none">@{topic.author.username}</span>
                {topic.author.active_badge_icon && (
                  topic.author.active_badge_icon.endsWith('.svg') ? (
                    <img src={topic.author.active_badge_icon} alt="rozet" className="w-6 h-6 sm:w-8 sm:h-8 md:w-11 md:h-11 -ml-1 sm:-ml-2 flex-shrink-0" />
                  ) : (
                    <span className="text-xs sm:text-base md:text-lg -ml-1 sm:-ml-2 flex-shrink-0">{topic.author.active_badge_icon}</span>
                  )
                )}
              </button>
              {/* Cevap ve Görüntüleme Sayıları - Aynı hizada */}
              <span className="text-gray-400 text-xs sm:text-sm hidden sm:inline"> | </span>
              <div className="flex items-center gap-1 text-gray-600 text-xs sm:text-sm">
                <MessageSquare className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden xs:inline">Cevap</span>
                <span>({topic.reply_count})</span>
              </div>
              
              <span className="text-gray-400 text-xs sm:text-sm hidden sm:inline"> | </span>
              <div className="flex items-center gap-1 text-gray-600 text-xs sm:text-sm">
                <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden xs:inline">Görüntüleme</span>
                <span>({topic.view_count})</span>
              </div>
            </div>
          </div>

          <div className="text-gray-800 whitespace-pre-wrap leading-relaxed text-sm sm:text-base md:text-lg font-normal py-3 sm:py-4" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', lineHeight: '1.7' }}>
            <div className="break-words">
              {topic.content}
            </div>
            <div className="mt-3 sm:mt-4 pt-2 border-t border-gray-100">
              <span className="text-gray-400 text-xs sm:text-sm italic">({formatDistanceToNow(topic.created_at)})</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            {/* Tüm butonlar ve istatistikler aynı satırda */}
            <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-2">
              {/* Faydalı Butonu - Her zaman görünür */}
              {(() => {
                const isOwnTopic = user && topic && topic.author_id === user.id;
                
                if (isOwnTopic) {
                  // Kendi gönderimi - sadece sayıyı göster
                  return (
                    <div className="flex items-center gap-1 px-2 py-1.5 rounded-md bg-gray-50 text-gray-400 cursor-not-allowed text-xs whitespace-nowrap flex-shrink-0">
                      <ThumbsUp className="w-3 h-3" />
                      <span>Faydalı</span>
                      {usefulCount > 0 && <span>({usefulCount})</span>}
                    </div>
                  );
                } else {
                  // Diğer tüm durumlar - aktif buton (giriş yapmamış olsa bile)
                  return (
                    <button
                      onClick={handleUseful}
                      disabled={!user || !topic}
                      className={`flex items-center gap-1 px-2 py-1.5 rounded-md transition-colors text-xs whitespace-nowrap flex-shrink-0 ${
                        !user || !topic
                          ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                          : isUseful
                          ? 'bg-[#9c6cfe] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <ThumbsUp className="w-3 h-3" />
                      <span>Faydalı</span>
                      {usefulCount > 0 && <span>({usefulCount})</span>}
                    </button>
                  );
                }
              })()}

              {/* Ayırıcı çizgi */}
              <div className="w-px h-6 bg-gray-300 mx-1 flex-shrink-0"></div>

              {/* Aksiyon Butonları */}
              {user && (
                <>
                  <button
                    onClick={() => setReplyingTo('main')}
                    className="flex items-center gap-1 px-2 py-1.5 bg-[#0ad2dd] text-white rounded-md hover:bg-[#08c4d1] transition-colors text-xs whitespace-nowrap flex-shrink-0"
                  >
                    <Reply className="w-3 h-3" />
                    <span>Yanıtla</span>
                  </button>
                  
                  <button
                    onClick={handleSave}
                    className={`flex items-center gap-1 px-2 py-1.5 rounded-md transition-colors text-xs whitespace-nowrap flex-shrink-0 ${
                      isSaved
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {isSaved ? (
                      <BookmarkCheck className="w-3 h-3" />
                    ) : (
                      <Bookmark className="w-3 h-3" />
                    )}
                    <span>{isSaved ? 'Kaydedildi' : 'Kaydet'}</span>
                  </button>

                  <button
                    onClick={() => setShowReportModal(true)}
                    className="flex items-center gap-1 px-2 py-1.5 rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition-colors text-xs whitespace-nowrap flex-shrink-0"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
                      <line x1="4" y1="22" x2="4" y2="15"/>
                    </svg>
                    <span>Bildir</span>
                  </button>

                  <button
                    onClick={handleShare}
                    className="flex items-center gap-1 px-2 py-1.5 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors text-xs whitespace-nowrap flex-shrink-0"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                      <circle cx="18" cy="5" r="3"/>
                      <circle cx="6" cy="12" r="3"/>
                      <circle cx="18" cy="19" r="3"/>
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                    </svg>
                    <span>Paylaş</span>
                  </button>
                </>
              )}

            </div>
          </div>
        </div>

        {/* Reply Form - Ana konu için */}
        {user && replyingTo === 'main' && (
          <div className="p-3 sm:p-4 md:p-6 border-b border-gray-200">
            <form onSubmit={handleReply} className="space-y-4">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Cevabınızı yazın..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9c6cfe] focus:border-transparent resize-none text-sm sm:text-base"
                rows={4}
                required
              />
              <div className="flex flex-col sm:flex-row justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setReplyingTo(null);
                    setReplyContent('');
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm sm:text-base"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={submitting || !replyContent.trim()}
                  className="px-4 sm:px-6 py-2 bg-[#9c6cfe] text-white rounded-lg hover:bg-[#8b5cf6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  {submitting ? 'Gönderiliyor...' : 'Cevap Gönder'}
                </button>
              </div>
            </form>
          </div>
        )}

        {shareHint && (
          <div className="fixed bottom-6 right-6 z-50 bg-black text-white text-sm px-3 py-2 rounded-lg opacity-90">
            {shareHint}
          </div>
        )}

        {/* Report Modal */}
        {showReportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white w-full max-w-md rounded-xl shadow-xl">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Konuyu Bildir</h3>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleReportSubmit} className="p-4 space-y-4">
                {reportError && (
                  <div className="p-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">{reportError}</div>
                )}
                {reportSuccess && (
                  <div className="p-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg">{reportSuccess}</div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gerekçe</label>
                  <textarea
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    rows={5}
                    placeholder="Neden bildiriyorsunuz? Kısa bir açıklama yazın."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c6cfe] focus:border-transparent resize-none"
                  />
                </div>
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={reportSubmitting}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {reportSubmitting ? 'Gönderiliyor...' : 'Gönder'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Posts */}
        <div className="divide-y divide-gray-200">
          {posts.map((post) => (
            <div key={post.id} className="p-3 sm:p-4 md:p-6">
              <div className="flex gap-3 sm:gap-4">
                <div className="flex-shrink-0">
                  {post.author.avatar_url ? (
                    <img
                      src={post.author.avatar_url}
                      alt={post.author.display_name}
                      className="w-10 h-10 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onViewProfile?.(post.author_id);
                      }}
                    />
                  ) : (
                    <div 
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-[#9c6cfe] to-[#0ad2dd] flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onViewProfile?.(post.author_id);
                      }}
                    >
                      <span className="text-white font-semibold text-sm">
                        {post.author.display_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-2">
                    <span className="font-semibold text-gray-900 text-sm sm:text-base">
                      {post.author.display_name}
                    </span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onViewProfile?.(post.author_id);
                      }}
                      className="text-gray-500 hover:text-[#9c6cfe] transition-colors text-xs sm:text-sm flex items-center"
                    >
                      @{post.author.username}
                      {post.author.active_badge_icon && (
                        post.author.active_badge_icon.endsWith('.svg') ? (
                          <img src={post.author.active_badge_icon} alt="rozet" className="w-8 h-8 sm:w-11 sm:h-11 -ml-1 sm:-ml-2" />
                        ) : (
                          <span className="text-sm sm:text-base -ml-1 sm:-ml-2">{post.author.active_badge_icon}</span>
                        )
                      )}
                    </button>
                    <span className="text-gray-400 hidden sm:inline">•</span>
                    <span className="text-gray-500 text-xs sm:text-sm">{formatDistanceToNow(post.created_at)}</span>
                  </div>

                  <div className="text-gray-700 whitespace-pre-wrap mb-4 text-sm sm:text-base break-words">
                    {post.content}
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    <button 
                      onClick={() => handleLikePost(post.id)}
                      className={`flex items-center gap-1 text-xs transition-colors px-2 py-1 rounded-md whitespace-nowrap flex-shrink-0 ${
                        post.isLiked 
                          ? 'text-[#9c6cfe] bg-purple-50' 
                          : 'text-gray-600 hover:text-[#9c6cfe] hover:bg-gray-50'
                      }`}
                    >
                      <ThumbsUp className={`w-3 h-3 ${post.isLiked ? 'fill-current' : ''}`} />
                      <span>({post.like_count || 0})</span>
                    </button>
                    <button 
                      onClick={() => {
                        setReplyingTo(replyingTo === post.id ? null : post.id);
                        setReplyingToPost(replyingTo === post.id ? null : post);
                      }}
                      className="flex items-center gap-1 text-xs text-gray-600 hover:text-[#0ad2dd] hover:bg-blue-50 transition-colors px-2 py-1 rounded-md whitespace-nowrap flex-shrink-0"
                    >
                      <Reply className="w-3 h-3" />
                      <span className="hidden xs:inline">Yanıtla</span>
                    </button>
                  </div>

                  {/* Reply Form */}
                  {replyingTo === post.id && user && (
                    <div className="mt-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
                      {/* Yanıtlanan Mesaj Bilgisi */}
                      {replyingToPost && (
                        <div className="mb-3 p-2 sm:p-3 bg-white border-l-4 border-[#9c6cfe] rounded-r-lg">
                          <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600 mb-1">
                            <span className="font-medium">{replyingToPost.author.display_name}</span>
                            <span className="hidden sm:inline">•</span>
                            <span>@{replyingToPost.author.username}</span>
                            <span className="text-[#9c6cfe]">↩️</span>
                          </div>
                          <p className="text-gray-700 text-xs sm:text-sm line-clamp-2 break-words">{replyingToPost.content}</p>
                        </div>
                      )}
                      
                      <form onSubmit={(e) => handleReplyToComment(e, post.id)} className="space-y-3">
                        <textarea
                          value={replyToContent}
                          onChange={(e) => setReplyToContent(e.target.value)}
                          placeholder="Yanıtınızı yazın..."
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9c6cfe] focus:border-transparent resize-none text-sm sm:text-base"
                          rows={3}
                          required
                        />
                        <div className="flex flex-col sm:flex-row justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setReplyingTo(null);
                              setReplyToContent('');
                              setReplyingToPost(null);
                            }}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm sm:text-base"
                          >
                            İptal
                          </button>
                          <button
                            type="submit"
                            disabled={submitting || !replyToContent.trim()}
                            className="px-4 py-2 bg-[#9c6cfe] text-white rounded-lg hover:bg-[#8b5cf6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                          >
                            {submitting ? 'Gönderiliyor...' : 'Yanıtla'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Replies */}
                  {post.replies && post.replies.length > 0 && (
                    <div className="mt-4 ml-2 sm:ml-4 md:ml-6 space-y-3 sm:space-y-4">
                      {post.replies.map((reply) => (
                        <div key={reply.id} className="flex gap-2 sm:gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg">
                          {reply.author.avatar_url ? (
                            <img
                              src={reply.author.avatar_url}
                              alt={reply.author.display_name}
                              className="w-8 h-8 rounded-full object-cover flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onViewProfile?.(reply.author_id);
                              }}
                            />
                          ) : (
                            <div 
                              className="w-8 h-8 rounded-full bg-gradient-to-br from-[#9c6cfe] to-[#0ad2dd] flex items-center justify-center flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onViewProfile?.(reply.author_id);
                              }}
                            >
                              <span className="text-white font-semibold text-xs">
                                {reply.author.display_name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1">
                              <span className="font-semibold text-gray-900 text-xs sm:text-sm">
                                {reply.author.display_name}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  onViewProfile?.(reply.author_id);
                                }}
                                className="text-gray-500 hover:text-[#9c6cfe] transition-colors cursor-pointer text-xs flex items-center"
                              >
                                @{reply.author.username}
                                {reply.author.active_badge_icon && (
                                  reply.author.active_badge_icon.endsWith('.svg') ? (
                                    <img src={reply.author.active_badge_icon} alt="rozet" className="w-6 h-6 sm:w-8 sm:h-8 -ml-1" />
                                  ) : (
                                    <span className="text-xs sm:text-sm -ml-1">{reply.author.active_badge_icon}</span>
                                  )
                                )}
                              </button>
                              <span className="text-gray-400 hidden sm:inline">•</span>
                              <span className="text-gray-500 text-xs">{formatDistanceToNow(reply.created_at)}</span>
                            </div>

                            {/* Yanıtlanan Mesaj Bilgisi */}
                            {reply.reply_to_author && (
                              <div className="mb-2 p-2 bg-gray-100 border-l-2 border-[#9c6cfe] rounded-r text-xs">
                                <div className="flex items-center gap-1 text-gray-600">
                                  <span className="text-[#9c6cfe]">↩️</span>
                                  <span className="font-medium">{reply.reply_to_author.display_name}</span>
                                  <span>@{reply.reply_to_author.username}</span>
                                </div>
                              </div>
                            )}

                            <div className="text-gray-700 whitespace-pre-wrap text-xs sm:text-sm mb-2 break-words">
                              {reply.content}
                            </div>

                            <div className="flex items-center gap-2 overflow-x-auto pb-1">
                              <button 
                                onClick={() => handleLikePost(reply.id)}
                                className={`flex items-center gap-1 text-xs transition-colors px-2 py-1 rounded-md whitespace-nowrap flex-shrink-0 ${
                                  reply.isLiked 
                                    ? 'text-[#9c6cfe] bg-purple-50' 
                                    : 'text-gray-600 hover:text-[#9c6cfe] hover:bg-gray-50'
                                }`}
                              >
                                <ThumbsUp className={`w-3 h-3 ${reply.isLiked ? 'fill-current' : ''}`} />
                                <span>({reply.like_count || 0})</span>
                              </button>
                              
                              {/* Silme butonu - sadece yorum sahibi görebilir */}
                              {user?.id === reply.author.id && (
                                <button 
                                  onClick={() => handleDeletePost(reply.id)}
                                  className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors px-2 py-1 rounded-md whitespace-nowrap flex-shrink-0"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span className="hidden xs:inline">Sil</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}