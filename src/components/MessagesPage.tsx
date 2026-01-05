'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { 
  ArrowLeft, 
  Search, 
  Send, 
  User, 
  Phone,
  Video,
  Info,
  MessageCircle,
  Check,
  CheckCheck,
  Trash2,
  Edit,
  Reply,
  MoreVertical,
  X
} from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  is_read: boolean;
  deleted_for_sender?: boolean;
  deleted_for_receiver?: boolean;
  edited_at?: string | null;
  edited_content?: string | null;
  reply_to_id?: string | null;
  reply_to?: {
    id: string;
    content: string;
    sender: {
      username: string;
      display_name: string | null;
    };
  } | null;
  sender: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  receiver: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

interface Conversation {
  id: string;
  other_user: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  last_message: {
    content: string;
    created_at: string;
    sender_id: string | null;
  };
  unread_count: number;
}

interface MessagesPageProps {
  onBack: () => void;
  onUnreadCountUpdate?: () => void;
  onViewProfile?: (userId: string) => void;
  initialConversationId?: string | null;
}

// Mesaj durum göstergesi bileşeni
function MessageStatus({ message, currentUserId }: { message: Message; currentUserId: string }) {
  const isOwnMessage = message.sender_id === currentUserId;
  
  if (!isOwnMessage) return null;

  // Mesaj durumunu belirle
  const getStatusIcon = () => {
    if (message.is_read) {
      return <CheckCheck className="w-5 h-5 text-blue-700 font-bold" />; // Mavi 2 tik - okundu
    } else {
      return <Check className="w-5 h-5 text-gray-600 font-bold" />; // Gri 1 tik - gönderildi
    }
  };

  return (
    <div className="absolute bottom-1 right-1">
      {getStatusIcon()}
    </div>
  );
}

export function MessagesPage({ onBack, onUnreadCountUpdate, onViewProfile, initialConversationId }: MessagesPageProps) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileMessages, setShowMobileMessages] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [replyingToMessage, setReplyingToMessage] = useState<Message | null>(null);
  const [showMessageMenu, setShowMessageMenu] = useState<string | null>(null);
  const [showConversationMenu, setShowConversationMenu] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'message' | 'conversation'; id: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const mobileMessagesContainerRef = useRef<HTMLDivElement>(null);
  const subscriptionRef = useRef<any>(null);
  const previousMessagesLengthRef = useRef(0);
  const previousConversationRef = useRef<string | null>(null);

  useEffect(() => {
    if (user) {
      loadConversations(true); // İlk yüklemede loading göster
    }
  }, [user]);

  // Dışarı tıklayınca menüleri kapat
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.conversation-menu') && !target.closest('.message-menu')) {
        setShowConversationMenu(null);
        setShowMessageMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // initialConversationId değiştiğinde konuşmayı seç
  useEffect(() => {
    if (initialConversationId) {
      setSelectedConversation(initialConversationId);
    }
  }, [initialConversationId]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
    }
  }, [selectedConversation]);

  // Gerçek zamanlı mesaj dinleme
  useEffect(() => {
    if (!user?.id) return;

    // Önceki subscription'ı temizle
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
    }

    // Yeni mesajları dinle
    const channel = supabase
      .channel('messages-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`
        },
        async (payload) => {
          const newMessage = payload.new as any;
          
          // Eğer seçili konuşmaya ait mesajsa, mesaj listesine ekle
          if (selectedConversation === newMessage.conversation_id) {
            // Mesajın sender bilgilerini al
            const { data: senderData } = await supabase
              .from('profiles')
              .select('id, username, display_name, avatar_url')
              .eq('id', newMessage.sender_id)
              .single();

            const { data: receiverData } = await supabase
              .from('profiles')
              .select('id, username, display_name, avatar_url')
              .eq('id', newMessage.receiver_id)
              .single();

            const messageWithRelations: Message = {
              ...newMessage,
              sender: senderData || {
                id: newMessage.sender_id,
                username: '',
                display_name: null,
                avatar_url: null
              },
              receiver: receiverData || {
                id: newMessage.receiver_id,
                username: '',
                display_name: null,
                avatar_url: null
              }
            };

            setMessages(prev => {
              // Mesaj zaten varsa ekleme
              if (prev.find(m => m.id === messageWithRelations.id)) {
                return prev;
              }
              return [...prev, messageWithRelations];
            });

            // Scroll'u en alta götür
            const scrollToBottom = () => {
              if (messagesContainerRef.current) {
                messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
              }
              if (mobileMessagesContainerRef.current) {
                mobileMessagesContainerRef.current.scrollTop = mobileMessagesContainerRef.current.scrollHeight;
              }
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            };
            setTimeout(scrollToBottom, 50);
            setTimeout(scrollToBottom, 200);

            // Mesajları otomatik okundu olarak işaretle (konuşma açıksa)
            if (selectedConversation === newMessage.conversation_id) {
              markMessagesAsRead(newMessage.conversation_id);
            }
          }

          // Konuşma listesini güncelle (silent mode)
          loadConversations(false);
          
          // Okunmamış mesaj sayacını güncelle (her zaman)
          onUnreadCountUpdate?.();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${user.id}`
        },
        async (payload) => {
          const newMessage = payload.new as any;
          
          // Kendi gönderdiğimiz mesajları da dinle (diğer cihazlardan gönderilmişse)
          if (selectedConversation === newMessage.conversation_id) {
            const { data: senderData } = await supabase
              .from('profiles')
              .select('id, username, display_name, avatar_url')
              .eq('id', newMessage.sender_id)
              .single();

            const { data: receiverData } = await supabase
              .from('profiles')
              .select('id, username, display_name, avatar_url')
              .eq('id', newMessage.receiver_id)
              .single();

            const messageWithRelations: Message = {
              ...newMessage,
              sender: senderData || {
                id: newMessage.sender_id,
                username: '',
                display_name: null,
                avatar_url: null
              },
              receiver: receiverData || {
                id: newMessage.receiver_id,
                username: '',
                display_name: null,
                avatar_url: null
              }
            };

            setMessages(prev => {
              if (prev.find(m => m.id === messageWithRelations.id)) {
                return prev;
              }
              return [...prev, messageWithRelations];
            });

            const scrollToBottom = () => {
              if (messagesContainerRef.current) {
                messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
              }
              if (mobileMessagesContainerRef.current) {
                mobileMessagesContainerRef.current.scrollTop = mobileMessagesContainerRef.current.scrollHeight;
              }
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            };
            setTimeout(scrollToBottom, 50);
            setTimeout(scrollToBottom, 200);
          }

          loadConversations(false);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${user.id}`
        },
        (payload) => {
          // Gönderdiğimiz mesajların okundu durumu güncellendiğinde (karşı taraf okuduğunda)
          const updatedMessage = payload.new as any;
          setMessages(prev =>
            prev.map(msg =>
              msg.id === updatedMessage.id
                ? { ...msg, is_read: updatedMessage.is_read }
                : msg
            )
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`
        },
        (payload) => {
          // Bize gelen mesajların okundu durumu güncellendiğinde
          const updatedMessage = payload.new as any;
          setMessages(prev =>
            prev.map(msg =>
              msg.id === updatedMessage.id
                ? { ...msg, is_read: updatedMessage.is_read }
                : msg
            )
          );
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Gerçek zamanlı mesajlaşma aktif');
        }
      });

    subscriptionRef.current = channel;

    // Cleanup
    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [user?.id, selectedConversation]);

  // Mesajlar yüklendiğinde veya güncellendiğinde scroll'u en alta götür
  // Sadece konuşma değiştiğinde veya mesaj sayısı arttığında scroll yap
  useEffect(() => {
    if (messages.length > 0 && selectedConversation) {
      // Konuşma değiştiyse veya yeni mesaj eklendiyse scroll yap
      const conversationChanged = previousConversationRef.current !== selectedConversation;
      const newMessageAdded = messages.length > previousMessagesLengthRef.current;
      
      if (conversationChanged || newMessageAdded) {
        // Scroll fonksiyonu - container'ın scrollTop'unu ayarlayarak
        const scrollToBottom = () => {
          // Desktop container
          if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
          }
          // Mobil container
          if (mobileMessagesContainerRef.current) {
            mobileMessagesContainerRef.current.scrollTop = mobileMessagesContainerRef.current.scrollHeight;
          }
          // Fallback: scrollIntoView
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'instant', block: 'end' });
          }
        };
        
        // Hemen scroll et
        scrollToBottom();
        
        // Render sonrası tekrar dene (DOM render'ı beklemek için)
        setTimeout(scrollToBottom, 50);
        setTimeout(scrollToBottom, 150);
        setTimeout(scrollToBottom, 300);
      }
      
      // Ref'leri güncelle
      previousMessagesLengthRef.current = messages.length;
      previousConversationRef.current = selectedConversation;
    }
  }, [messages, selectedConversation]);

  const loadConversations = async (showLoading = false) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      
      // Kullanıcının konuşmalarını getir (silinenleri hariç)
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          user1:profiles!conversations_user1_id_fkey(id, username, display_name, avatar_url),
          user2:profiles!conversations_user2_id_fkey(id, username, display_name, avatar_url),
          deleted_for_user1,
          deleted_for_user2
        `)
        .or(`user1_id.eq.${user?.id},user2_id.eq.${user?.id}`)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Silinen konuşmaları filtrele
      const filteredConversations = (data || []).filter((conv: any) => {
        if (!user?.id) return false;
        // User1 ise deleted_for_user1 kontrolü
        if (conv.user1.id === user.id && conv.deleted_for_user1) return false;
        // User2 ise deleted_for_user2 kontrolü
        if (conv.user2.id === user.id && conv.deleted_for_user2) return false;
        return true;
      });

      // Her konuşma için son mesajı ve okunmamış sayısını hesapla
      const conversationsWithDetails = await Promise.all(
        (filteredConversations || []).map(async (conv: any) => {
          // Son mesajı getir (silinenleri hariç)
          const { data: lastMessages } = await supabase
            .from('messages')
            .select('content, created_at, sender_id, deleted_for_sender, deleted_for_receiver')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(10);

          // Silinmemiş son mesajı bul
          const lastMessage = (lastMessages || []).find((msg: any) => {
            if (conv.user1.id === user?.id && msg.deleted_for_user1) return false;
            if (conv.user2.id === user?.id && msg.deleted_for_user2) return false;
            if (msg.sender_id === user?.id && msg.deleted_for_sender) return false;
            if (msg.receiver_id === user?.id && msg.deleted_for_receiver) return false;
            return true;
          });

          // Okunmamış mesaj sayısını hesapla (silinenleri hariç)
          const { data: unreadMessages } = await supabase
            .from('messages')
            .select('id, deleted_for_receiver')
            .eq('conversation_id', conv.id)
            .eq('receiver_id', user?.id || '')
            .eq('is_read', false);

          const unreadCount = (unreadMessages || []).filter((msg: any) => !msg.deleted_for_receiver).length;

          const otherUser = conv.user1.id === user?.id ? conv.user2 : conv.user1;
          return {
            id: conv.id,
            other_user: otherUser,
            last_message: lastMessage || { content: 'Henüz mesaj yok', created_at: conv.created_at, sender_id: null },
            unread_count: unreadCount || 0
          };
        })
      );

      // Sıralama: Önce okunmamış mesajı olanlar (desc), eşitlikte son mesaj zamanı yeni olanlar (desc)
      const sortedConversations = [...conversationsWithDetails].sort((a, b) => {
        if (a.unread_count !== b.unread_count) {
          return b.unread_count - a.unread_count;
        }
        const aTime = new Date(a.last_message.created_at).getTime();
        const bTime = new Date(b.last_message.created_at).getTime();
        return bTime - aTime;
      });

      setConversations(sortedConversations);
    } catch (error) {
      console.error('Konuşmalar yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      // Önce mesajları getir
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(id, username, display_name, avatar_url),
          receiver:profiles!messages_receiver_id_fkey(id, username, display_name, avatar_url)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Reply_to mesajlarını ayrı sorgu ile getir
      const messagesWithReplies = await Promise.all(
        (messagesData || []).map(async (msg: any) => {
          if (msg.reply_to_id) {
            const { data: replyData } = await supabase
              .from('messages')
              .select(`
                id,
                content,
                sender:profiles!messages_sender_id_fkey(username, display_name)
              `)
              .eq('id', msg.reply_to_id)
              .single();

            if (replyData) {
              msg.reply_to = replyData;
            }
          }
          return msg;
        })
      );

      // Silinen mesajları filtrele
      const filteredMessages = messagesWithReplies.filter((msg: any) => {
        if (!user?.id) return false;
        // Gönderen ise deleted_for_sender kontrolü
        if (msg.sender_id === user.id && msg.deleted_for_sender) return false;
        // Alıcı ise deleted_for_receiver kontrolü
        if (msg.receiver_id === user.id && msg.deleted_for_receiver) return false;
        return true;
      });
      
      setMessages(filteredMessages);

      // Mesajları okundu olarak işaretle
      await markMessagesAsRead(conversationId);
      
      // Mesajlar yüklendikten sonra scroll'u en alta götür
      const scrollToBottom = () => {
        // Desktop container
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
        // Mobil container
        if (mobileMessagesContainerRef.current) {
          mobileMessagesContainerRef.current.scrollTop = mobileMessagesContainerRef.current.scrollHeight;
        }
        // Fallback
        messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
      };
      
      // Birkaç kez deneyerek garantile
      setTimeout(scrollToBottom, 100);
      setTimeout(scrollToBottom, 300);
      setTimeout(scrollToBottom, 500);
      setTimeout(scrollToBottom, 800);
    } catch (error) {
      console.error('Mesajlar yüklenirken hata:', error);
    }
  };

  const markMessagesAsRead = async (conversationId: string) => {
    if (!user?.id) return;
    
    try {
      const { error } = await (supabase as any)
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .eq('receiver_id', user.id)
        .eq('is_read', false);
      
      if (error) throw error;
      
      // Konuşma listesini güncelle (silent mode)
      await loadConversations(false);
      
      // State'i de güncelle
      setConversations(prev => prev.map(conv => 
        conv.id === conversationId 
          ? { ...conv, unread_count: 0 }
          : conv
      ));
      
      // Sol menüdeki mesaj sayacını güncelle
      onUnreadCountUpdate?.();
    } catch (error) {
      console.error('Mesajlar okundu olarak işaretlenirken hata:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return;

    const receiverId = conversations.find(c => c.id === selectedConversation)?.other_user.id;
    if (!receiverId) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setSending(true);

    // Optimistic update - Mesajı hemen ekle (geçici ID ile)
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      content: messageContent,
      sender_id: user.id,
      receiver_id: receiverId,
      created_at: new Date().toISOString(),
      is_read: false,
      sender: {
        id: user.id,
        username: user.email?.split('@')[0] || '',
        display_name: null,
        avatar_url: null
      },
      receiver: {
        id: receiverId,
        username: conversations.find(c => c.id === selectedConversation)?.other_user.username || '',
        display_name: conversations.find(c => c.id === selectedConversation)?.other_user.display_name || null,
        avatar_url: conversations.find(c => c.id === selectedConversation)?.other_user.avatar_url || null
      }
    };

    setMessages(prev => [...prev, optimisticMessage]);
    const scrollToBottom = () => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
      if (mobileMessagesContainerRef.current) {
        mobileMessagesContainerRef.current.scrollTop = mobileMessagesContainerRef.current.scrollHeight;
      }
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    setTimeout(scrollToBottom, 50);
    setTimeout(scrollToBottom, 150);

    try {
      const { data, error } = await (supabase as any)
        .from('messages')
        .insert({
          conversation_id: selectedConversation,
          sender_id: user.id,
          receiver_id: receiverId,
          content: messageContent,
          reply_to_id: replyingToMessage?.id || null
        })
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(id, username, display_name, avatar_url),
          receiver:profiles!messages_receiver_id_fkey(id, username, display_name, avatar_url)
        `)
        .single();

      if (error) throw error;

      // Optimistic mesajı gerçek mesajla değiştir
      setMessages(prev =>
        prev.map(msg =>
          msg.id === tempId
            ? data
            : msg
        )
      );

      // Yanıtı temizle
      setReplyingToMessage(null);
      
      // Scroll'u en alta götür (mesaj gönderildikten sonra)
      setTimeout(() => {
        const scrollToBottom = () => {
          if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
          }
          if (mobileMessagesContainerRef.current) {
            mobileMessagesContainerRef.current.scrollTop = mobileMessagesContainerRef.current.scrollHeight;
          }
          messagesEndRef.current?.scrollIntoView({ behavior: 'instant', block: 'end' });
        };
        scrollToBottom();
        setTimeout(scrollToBottom, 100);
        setTimeout(scrollToBottom, 300);
      }, 100);
      
      // Konuşma listesini güncelle (silent mode - loading gösterme)
      loadConversations(false);
    } catch (error) {
      console.error('Mesaj gönderilirken hata:', error);
      
      // Optimistic mesajı geri al
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      setNewMessage(messageContent); // Mesajı geri yükle
      
      alert('Mesaj gönderilemedi. Lütfen tekrar deneyin.');
    } finally {
      setSending(false);
    }
  };

  // Mesaj silme fonksiyonu
  const deleteMessage = async (messageId: string) => {
    if (!user?.id) return;
    
    try {
      const message = messages.find(m => m.id === messageId);
      if (!message) return;

      // Gönderen ise deleted_for_sender, alıcı ise deleted_for_receiver güncelle
      const updateField = message.sender_id === user.id ? 'deleted_for_sender' : 'deleted_for_receiver';
      
      const { error } = await supabase
        .from('messages')
        .update({ [updateField]: true })
        .eq('id', messageId);

      if (error) throw error;

      // Mesajı listeden kaldır
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      setShowMessageMenu(null);
      setDeleteConfirm(null);
      
      // Konuşma listesini güncelle (silent mode)
      loadConversations(false);
    } catch (error) {
      console.error('Mesaj silinirken hata:', error);
      alert('Mesaj silinemedi. Lütfen tekrar deneyin.');
      setDeleteConfirm(null);
    }
  };

  // Mesaj düzenleme fonksiyonu
  const editMessage = async (messageId: string) => {
    if (!user?.id || !editContent.trim()) return;
    
    try {
      const { error } = await supabase
        .from('messages')
        .update({ 
          content: editContent.trim(),
          edited_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .eq('sender_id', user.id); // Sadece gönderen düzenleyebilir

      if (error) throw error;

      // Mesajı güncelle
      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId
            ? { ...msg, content: editContent.trim(), edited_at: new Date().toISOString() }
            : msg
        )
      );

      setEditingMessageId(null);
      setEditContent('');
      setShowMessageMenu(null);
    } catch (error) {
      console.error('Mesaj düzenlenirken hata:', error);
      alert('Mesaj düzenlenemedi. Lütfen tekrar deneyin.');
    }
  };

  // Mesaj yanıtlama fonksiyonu
  const replyToMessage = (message: Message) => {
    setReplyingToMessage(message);
    setShowMessageMenu(null);
  };

  // Yanıtı iptal et
  const cancelReply = () => {
    setReplyingToMessage(null);
  };

  // Sohbet silme fonksiyonu
  const deleteConversation = async (conversationId: string) => {
    if (!user?.id) return;
    
    try {
      const conversation = conversations.find(c => c.id === conversationId);
      if (!conversation) return;

      // Hangi kullanıcı olduğunu bul (user1 mi user2 mi)
      const { data: convData } = await supabase
        .from('conversations')
        .select('user1_id, user2_id')
        .eq('id', conversationId)
        .single();

      if (!convData) return;

      const updateField = convData.user1_id === user.id ? 'deleted_for_user1' : 'deleted_for_user2';
      
      const { error } = await supabase
        .from('conversations')
        .update({ [updateField]: true })
        .eq('id', conversationId);

      if (error) throw error;

      // Konuşmayı listeden kaldır
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      setShowConversationMenu(null);
      setDeleteConfirm(null);
      
      // Eğer seçili konuşma silinmişse, seçimi temizle
      if (selectedConversation === conversationId) {
        setSelectedConversation(null);
        setMessages([]);
        setShowMobileMessages(false);
      }
    } catch (error) {
      console.error('Sohbet silinirken hata:', error);
      alert('Sohbet silinemedi. Lütfen tekrar deneyin.');
      setDeleteConfirm(null);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.other_user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (conv.other_user.display_name && conv.other_user.display_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const selectedConv = conversations.find(c => c.id === selectedConversation);

  // Giriş yapmayan kullanıcılar için uyarı sayfası
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Mesajlar</h1>
          </div>
        </div>

        {/* Giriş Yapma Uyarısı */}
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center max-w-md mx-auto p-8">
            <div className="w-24 h-24 bg-gradient-to-br from-[#9c6cfe] to-[#0ad2dd] rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="w-12 h-12 text-white" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Mesajlaşmak için Giriş Yapın
            </h2>
            
            <p className="text-gray-600 mb-8">
              Diğer kullanıcılarla mesajlaşabilmek için önce hesabınıza giriş yapmanız gerekiyor.
            </p>
            
            <div className="space-y-4">
              <button
                onClick={() => {
                  // Auth modal'ı açmak için parent component'e sinyal gönder
                  window.dispatchEvent(new CustomEvent('showAuthModal'));
                }}
                className="w-full bg-gradient-to-r from-[#9c6cfe] to-[#0ad2dd] text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                Giriş Yap
              </button>
              
              <button
                onClick={onBack}
                className="w-full border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-50 transition-all"
              >
                Geri Dön
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#9c6cfe] mx-auto mb-4"></div>
          <p className="text-gray-600">Mesajlar yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Mesajlar</h1>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Konuşma Listesi */}
        <div className={`w-full md:w-1/3 bg-white border-r border-gray-200 flex flex-col ${showMobileMessages ? 'hidden md:flex' : 'flex'}`}>
          {/* Arama */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Kullanıcı ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9c6cfe] focus:border-transparent"
              />
            </div>
          </div>

          {/* Konuşmalar */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p>Henüz mesajınız yok</p>
                <p className="text-sm mt-2">Başka kullanıcılarla konuşmaya başlayın!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`p-4 hover:bg-gray-50 transition-colors ${
                      selectedConversation === conversation.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                    }`}
                  >
                    <div 
                      onClick={() => {
                        setSelectedConversation(conversation.id);
                        setShowMobileMessages(true);
                      }}
                      className="flex items-center gap-3 cursor-pointer"
                    >
                      {/* Avatar */}
                      <div className="relative">
                        {conversation.other_user.avatar_url ? (
                          <>
                            <img 
                              src={conversation.other_user.avatar_url} 
                              alt="Avatar" 
                              className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                            />
                            {conversation.unread_count > 0 && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                {conversation.unread_count}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-[#9c6cfe] to-[#0ad2dd] rounded-full flex items-center justify-center relative">
                            <User className="w-6 h-6 text-white" />
                            {conversation.unread_count > 0 && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                {conversation.unread_count}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Kullanıcı bilgileri */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {conversation.other_user.display_name || conversation.other_user.username}
                          </h3>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">
                              {new Date(conversation.last_message.created_at).toLocaleDateString('tr-TR')}
                            </span>
                            <div className="relative conversation-menu">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowConversationMenu(showConversationMenu === conversation.id ? null : conversation.id);
                                }}
                                className="p-1 hover:bg-gray-100 rounded transition-colors"
                                title="Daha fazla seçenek"
                              >
                                <MoreVertical className="w-4 h-4 text-gray-600" />
                              </button>
                              
                              {/* Konuşma Menüsü */}
                              {showConversationMenu === conversation.id && (
                                <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[150px] z-10" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeleteConfirm({ type: 'conversation', id: conversation.id });
                                      setShowConversationMenu(null);
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Sil
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 truncate">
                          {conversation.last_message.sender_id === user?.id ? 'Sen: ' : ''}
                          {conversation.last_message.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mesaj Alanı - Desktop */}
        <div className="hidden md:flex flex-1 flex-col min-h-0">
          {selectedConversation ? (
            <>
              {/* Mesaj Header */}
              <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div 
                    className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                    onClick={() => onViewProfile?.(selectedConv?.other_user.id || '')}
                  >
                    {selectedConv?.other_user.avatar_url ? (
                      <img 
                        src={selectedConv.other_user.avatar_url} 
                        alt="Avatar" 
                        className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-[#9c6cfe] to-[#0ad2dd] rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {selectedConv?.other_user.display_name || selectedConv?.other_user.username}
                      </h3>
                      <p className="text-sm text-gray-500">@{selectedConv?.other_user.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <Phone className="w-5 h-5 text-gray-600" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <Video className="w-5 h-5 text-gray-600" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <Info className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Mesajlar */}
              <div ref={messagesContainerRef} className="overflow-y-auto p-4 space-y-4" style={{ height: 'calc(100vh - 300px)' }}>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex group ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className="relative">
                      <div
                        className={`relative max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.sender_id === user?.id
                            ? 'bg-[#9c6cfe] text-white'
                            : 'bg-white border border-gray-200 text-gray-900'
                        }`}
                      >
                        {/* Yanıt gösterimi */}
                        {message.reply_to && (
                          <div className={`mb-2 pb-2 border-l-2 ${
                            message.sender_id === user?.id ? 'border-blue-300' : 'border-gray-300'
                          } pl-2`}>
                            <p className={`text-xs font-semibold ${
                              message.sender_id === user?.id ? 'text-blue-100' : 'text-gray-600'
                            }`}>
                              {message.reply_to.sender?.display_name || message.reply_to.sender?.username}
                            </p>
                            <p className={`text-xs truncate ${
                              message.sender_id === user?.id ? 'text-blue-200' : 'text-gray-500'
                            }`}>
                              {message.reply_to.content}
                            </p>
                          </div>
                        )}

                        {/* Düzenleme modunda mı? */}
                        {editingMessageId === message.id ? (
                          <div className="space-y-2">
                            <textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className="w-full px-2 py-1 text-sm rounded border border-gray-300 text-gray-900"
                              rows={3}
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => editMessage(message.id)}
                                className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                              >
                                Kaydet
                              </button>
                              <button
                                onClick={() => {
                                  setEditingMessageId(null);
                                  setEditContent('');
                                }}
                                className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                              >
                                İptal
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm">{message.content}</p>
                            {message.edited_at && (
                              <p className={`text-xs mt-1 ${
                                message.sender_id === user?.id ? 'text-blue-200' : 'text-gray-400'
                              }`}>
                                (düzenlendi)
                              </p>
                            )}
                          </>
                        )}

                        <div className="flex items-center justify-between mt-1">
                          <p className={`text-xs mr-8 ${
                            message.sender_id === user?.id ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {new Date(message.created_at).toLocaleTimeString('tr-TR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <MessageStatus message={message} currentUserId={user?.id || ''} />

                        {/* Mesaj Menüsü */}
                        {showMessageMenu === message.id && (
                          <div className={`absolute z-10 mt-1 message-menu ${
                            message.sender_id === user?.id ? 'left-0' : 'right-0'
                          } bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[120px]`} onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => replyToMessage(message)}
                              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            >
                              <Reply className="w-4 h-4" />
                              Yanıtla
                            </button>
                            {message.sender_id === user?.id && (
                              <button
                                onClick={() => {
                                  setEditingMessageId(message.id);
                                  setEditContent(message.content);
                                  setShowMessageMenu(null);
                                }}
                                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                              >
                                <Edit className="w-4 h-4" />
                                Düzenle
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setDeleteConfirm({ type: 'message', id: message.id });
                                setShowMessageMenu(null);
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Sil
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Menü Butonu */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMessageMenu(showMessageMenu === message.id ? null : message.id);
                        }}
                        className={`absolute top-1 ${
                          message.sender_id === user?.id ? 'left-1' : 'right-1'
                        } opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-black/10`}
                      >
                        <MoreVertical className={`w-4 h-4 ${
                          message.sender_id === user?.id ? 'text-white' : 'text-gray-600'
                        }`} />
                      </button>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Mesaj Gönderme - Sabit konumda */}
              <div className="bg-white border-t border-gray-200 p-4 flex-shrink-0">
                {/* Yanıt gösterimi */}
                {replyingToMessage && (
                  <div className="mb-2 p-2 bg-gray-50 rounded-lg border-l-2 border-[#9c6cfe] flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-gray-700">
                        {replyingToMessage.sender.display_name || replyingToMessage.sender.username} yanıtlanıyor:
                      </p>
                      <p className="text-xs text-gray-600 truncate">{replyingToMessage.content}</p>
                    </div>
                    <button
                      onClick={cancelReply}
                      className="ml-2 p-1 hover:bg-gray-200 rounded"
                    >
                      <X className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder={replyingToMessage ? `${replyingToMessage.sender.display_name || replyingToMessage.sender.username} yanıtla...` : "Mesajınızı yazın..."}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9c6cfe] focus:border-transparent"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="px-4 py-2 bg-[#9c6cfe] text-white rounded-lg hover:bg-[#8b5cf6] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p>Bir konuşma seçin</p>
                <p className="text-sm mt-2">Mesajlaşmaya başlamak için sol taraftan bir konuşma seçin</p>
              </div>
            </div>
          )}
        </div>

        {/* Mobil Mesaj Görünümü */}
        {showMobileMessages && selectedConversation && (
          <div className="md:hidden fixed inset-0 bg-white z-50 flex flex-col">
            {/* Mobil Mesaj Header */}
            <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowMobileMessages(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div 
                  className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors flex-1"
                  onClick={() => onViewProfile?.(selectedConv?.other_user.id || '')}
                >
                  {selectedConv?.other_user.avatar_url ? (
                    <img 
                      src={selectedConv.other_user.avatar_url} 
                      alt="Avatar" 
                      className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-[#9c6cfe] to-[#0ad2dd] rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {selectedConv?.other_user.display_name || selectedConv?.other_user.username}
                    </h3>
                    <p className="text-sm text-gray-500">@{selectedConv?.other_user.username}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobil Mesajlar */}
            <div ref={mobileMessagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex group ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="relative">
                    <div
                      className={`relative max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender_id === user?.id
                          ? 'bg-[#9c6cfe] text-white'
                          : 'bg-white border border-gray-200 text-gray-900'
                      }`}
                    >
                      {/* Yanıt gösterimi */}
                      {message.reply_to && (
                        <div className={`mb-2 pb-2 border-l-2 ${
                          message.sender_id === user?.id ? 'border-blue-300' : 'border-gray-300'
                        } pl-2`}>
                          <p className={`text-xs font-semibold ${
                            message.sender_id === user?.id ? 'text-blue-100' : 'text-gray-600'
                          }`}>
                            {message.reply_to.sender?.display_name || message.reply_to.sender?.username}
                          </p>
                          <p className={`text-xs truncate ${
                            message.sender_id === user?.id ? 'text-blue-200' : 'text-gray-500'
                          }`}>
                            {message.reply_to.content}
                          </p>
                        </div>
                      )}

                      {/* Düzenleme modunda mı? */}
                      {editingMessageId === message.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full px-2 py-1 text-sm rounded border border-gray-300 text-gray-900"
                            rows={3}
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => editMessage(message.id)}
                              className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                            >
                              Kaydet
                            </button>
                            <button
                              onClick={() => {
                                setEditingMessageId(null);
                                setEditContent('');
                              }}
                              className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                            >
                              İptal
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm">{message.content}</p>
                          {message.edited_at && (
                            <p className={`text-xs mt-1 ${
                              message.sender_id === user?.id ? 'text-blue-200' : 'text-gray-400'
                            }`}>
                              (düzenlendi)
                            </p>
                          )}
                        </>
                      )}

                      <div className="flex items-center justify-between mt-1">
                        <p className={`text-xs mr-8 ${
                          message.sender_id === user?.id ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {new Date(message.created_at).toLocaleTimeString('tr-TR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <MessageStatus message={message} currentUserId={user?.id || ''} />

                      {/* Mesaj Menüsü */}
                      {showMessageMenu === message.id && (
                        <div className={`absolute z-10 mt-1 message-menu ${
                          message.sender_id === user?.id ? 'left-0' : 'right-0'
                        } bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[120px]`} onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => replyToMessage(message)}
                            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          >
                            <Reply className="w-4 h-4" />
                            Yanıtla
                          </button>
                          {message.sender_id === user?.id && (
                            <button
                              onClick={() => {
                                setEditingMessageId(message.id);
                                setEditContent(message.content);
                                setShowMessageMenu(null);
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            >
                              <Edit className="w-4 h-4" />
                              Düzenle
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setDeleteConfirm({ type: 'message', id: message.id });
                              setShowMessageMenu(null);
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Sil
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Menü Butonu */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMessageMenu(showMessageMenu === message.id ? null : message.id);
                      }}
                      className={`absolute top-1 ${
                        message.sender_id === user?.id ? 'left-1' : 'right-1'
                      } opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-black/10`}
                    >
                      <MoreVertical className={`w-4 h-4 ${
                        message.sender_id === user?.id ? 'text-white' : 'text-gray-600'
                      }`} />
                    </button>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Mobil Mesaj Gönderme */}
            <div className="bg-white border-t border-gray-200 p-4 flex-shrink-0">
              {/* Yanıt gösterimi */}
              {replyingToMessage && (
                <div className="mb-2 p-2 bg-gray-50 rounded-lg border-l-2 border-[#9c6cfe] flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-700">
                      {replyingToMessage.sender.display_name || replyingToMessage.sender.username} yanıtlanıyor:
                    </p>
                    <p className="text-xs text-gray-600 truncate">{replyingToMessage.content}</p>
                  </div>
                  <button
                    onClick={cancelReply}
                    className="ml-2 p-1 hover:bg-gray-200 rounded"
                  >
                    <X className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder={replyingToMessage ? `${replyingToMessage.sender.display_name || replyingToMessage.sender.username} yanıtla...` : "Mesajınızı yazın..."}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9c6cfe] focus:border-transparent"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  className="px-4 py-2 bg-[#9c6cfe] text-white rounded-lg hover:bg-[#8b5cf6] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Silme Onay Modalı */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {deleteConfirm.type === 'conversation' ? 'Sohbeti Sil' : 'Mesajı Sil'}
            </h3>
            <p className="text-gray-600 mb-6">
              Bu {deleteConfirm.type === 'conversation' ? 'sohbeti' : 'mesajı'} sadece <strong>sizin için</strong> sileceksiniz. 
              {deleteConfirm.type === 'conversation' ? ' Diğer kullanıcı için görünmeyecek.' : ' Diğer kullanıcı mesajı görmeye devam edecek.'}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={() => {
                  if (deleteConfirm.type === 'conversation') {
                    deleteConversation(deleteConfirm.id);
                  } else {
                    deleteMessage(deleteConfirm.id);
                  }
                }}
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
