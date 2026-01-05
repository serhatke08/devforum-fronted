'use client';

import { ArrowLeft, HelpCircle, MessageSquare, FileText, Send, Plus, LifeBuoy } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface SupportPageProps {
  onBack: () => void;
  isSidebarCollapsed?: boolean;
}

interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_id: string | null;
  content: string;
  is_admin_message: boolean;
  created_at: string;
}

interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  category: string;
  status: string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  last_message?: {
    content: string;
    created_at: string;
  };
}

export function SupportPage({ onBack, isSidebarCollapsed = false }: SupportPageProps) {
  // Sidebar açıkken margin-left yok, kapalıyken var
  const sidebarOffsetClass = isSidebarCollapsed ? 'lg:ml-16 sm:lg:ml-20' : '';
  const leftPadding = isSidebarCollapsed ? 'pl-2 lg:pl-4' : 'pl-4 lg:pl-6';
  const { user } = useAuth();
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    subject: '',
    category: 'genel',
    message: ''
  });

  const supportCategories = [
    { id: 'genel', label: 'Genel Destek', icon: HelpCircle },
    { id: 'hesap', label: 'Hesap Sorunları', icon: MessageSquare },
    { id: 'odeme', label: 'Ödeme Sorunları', icon: FileText },
    { id: 'teknik', label: 'Teknik Destek', icon: HelpCircle },
  ];

  useEffect(() => {
    if (user) {
      loadTickets();
    }
  }, [user]);

  useEffect(() => {
    if (selectedTicket) {
      loadMessages(selectedTicket);
      setShowNewTicketForm(false);
      setIsTyping(false); // Ticket seçildiğinde typing indicator'ı sıfırla
    }
  }, [selectedTicket]);

  // Mesajlar değiştiğinde scroll'u en alta götür
  useEffect(() => {
    if (messages.length > 0) {
      // Scroll'u en alta götür - hem scrollTop hem de scrollIntoView kullan
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'auto', block: 'end' });
        }
      }, 50);
    }
  }, [messages]);

  // Ticket seçildiğinde scroll'u en alta götür
  useEffect(() => {
    if (selectedTicket) {
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'auto', block: 'end' });
        }
      }, 200);
    }
  }, [selectedTicket]);

  // Gerçek zamanlı mesaj dinleme
  useEffect(() => {
    if (!user?.id || !selectedTicket) return;

    const channel = supabase
      .channel(`support-messages-${selectedTicket}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `ticket_id=eq.${selectedTicket}`
        },
        (payload) => {
          const newMessage = payload.new as SupportMessage;
          setMessages(prev => {
            if (prev.find(m => m.id === newMessage.id)) {
              return prev;
            }
            return [...prev, newMessage];
          });
          // Admin mesajı geldiğinde typing indicator'ı kapat
          if (newMessage.is_admin_message) {
            setIsTyping(false);
          }
          loadTickets(); // Ticket listesini güncelle
          
          // Yeni mesaj geldiğinde scroll'u en alta götür
          setTimeout(() => {
            if (messagesContainerRef.current) {
              messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
            }
            if (messagesEndRef.current) {
              messagesEndRef.current.scrollIntoView({ behavior: 'auto', block: 'end' });
            }
          }, 150);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedTicket, user]);

  const loadTickets = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      // Her ticket için son mesajı al
      const ticketsWithLastMessage = await Promise.all(
        (data || []).map(async (ticket) => {
          const { data: lastMsg } = await supabase
            .from('support_messages')
            .select('content, created_at')
            .eq('ticket_id', ticket.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            ...ticket,
            last_message: lastMsg || undefined
          };
        })
      );

      setTickets(ticketsWithLastMessage);
    } catch (error) {
      console.error('Destek talepleri yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (ticketId: string) => {
    try {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Mesajlar yükleme hatası:', error);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setSending(true);
    try {
      // Ticket oluştur
      const { data: ticket, error: ticketError } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user.id,
          subject: formData.subject,
          category: formData.category,
          status: 'open'
        })
        .select()
        .single();

      if (ticketError) throw ticketError;

      // İlk mesajı gönder
      const { error: messageError } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: ticket.id,
          sender_id: user.id,
          content: formData.message,
          is_admin_message: false
        });

      if (messageError) throw messageError;

      // Formu temizle ve ticket'ı seç
      setFormData({ subject: '', category: 'genel', message: '' });
      setShowNewTicketForm(false);
      setSelectedTicket(ticket.id);
      await loadTickets();
    } catch (error) {
      console.error('Destek talebi oluşturma hatası:', error);
      alert('Destek talebi oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setSending(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !user?.id || !newMessage.trim()) return;

    setSending(true);
    const messageContent = newMessage.trim();
    setNewMessage(''); // Input'u hemen temizle
    
    try {
      const { error } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: selectedTicket,
          sender_id: user.id,
          content: messageContent,
          is_admin_message: false
        });

      if (error) throw error;

      // Mesajları yeniden yükle
      await loadMessages(selectedTicket);
      await loadTickets();
      
      // Scroll'u en alta götür
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'auto', block: 'end' });
        }
      }, 150);
      
      // Typing indicator'ı göster (sadece ilk mesajda - daha önce admin mesajı yoksa)
      // Kısa bir delay ile kontrol et (trigger'ın çalışması için zaman tanı)
      setTimeout(async () => {
        const { data: currentMessages } = await supabase
          .from('support_messages')
          .select('*')
          .eq('ticket_id', selectedTicket)
          .order('created_at', { ascending: true });
        
        const hasAdminMessage = (currentMessages || []).some(m => m.is_admin_message);
        
        if (!hasAdminMessage) {
          setIsTyping(true);
          const typingDuration = 2000 + Math.random() * 2000; // 2-4 saniye
          setTimeout(() => {
            setIsTyping(false);
            // Typing bitince scroll'u tekrar en alta götür
            setTimeout(() => {
              if (messagesContainerRef.current) {
                messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
              }
              if (messagesEndRef.current) {
                messagesEndRef.current.scrollIntoView({ behavior: 'auto', block: 'end' });
              }
            }, 100);
          }, typingDuration);
        }
      }, 500); // Trigger'ın çalışması için 500ms bekle
    } catch (error) {
      console.error('Mesaj gönderme hatası:', error);
      alert('Mesaj gönderilirken bir hata oluştu. Lütfen tekrar deneyin.');
      setNewMessage(messageContent); // Hata durumunda mesajı geri koy
    } finally {
      setSending(false);
    }
  };

  const getCategoryLabel = (categoryId: string) => {
    return supportCategories.find(c => c.id === categoryId)?.label || 'Genel Destek';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Açık';
      case 'in_progress': return 'İşlemde';
      case 'resolved': return 'Çözüldü';
      case 'closed': return 'Kapalı';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Az önce';
    if (minutes < 60) return `${minutes} dakika önce`;
    if (hours < 24) return `${hours} saat önce`;
    if (days < 7) return `${days} gün önce`;
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  };

  const selectedTicketData = tickets.find(t => t.id === selectedTicket);

  return (
    <div className={`min-h-screen bg-gray-50 ${sidebarOffsetClass} flex flex-col`}>
      {/* Header */}
      <div className={`bg-white border-b border-gray-200 py-4 flex items-center justify-between ${leftPadding} pr-4 lg:pr-6 flex-shrink-0`}>
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Geri Dön</span>
          </button>
          <div className="flex items-center gap-2">
            <LifeBuoy className="w-6 h-6 text-purple-600" />
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Destek</h1>
          </div>
        </div>
      </div>

      <div className={`flex-1 flex overflow-hidden w-full ${leftPadding} pr-4 lg:pr-6 min-h-0`}>
        {/* Sol Panel - Talep Listesi */}
        <div className="w-full sm:w-80 lg:w-96 border-r border-gray-200 bg-white flex flex-col flex-shrink-0">
          {/* Talep Gönder Butonu */}
          <div className="p-4 border-b border-gray-200">
            <button
              onClick={() => {
                setShowNewTicketForm(true);
                setSelectedTicket(null);
              }}
              className="w-full bg-gradient-to-r from-[#9c6cfe] to-[#0ad2dd] text-white px-4 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span>Yeni Talep Gönder</span>
            </button>
          </div>

          {/* Talep Listesi */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            ) : showNewTicketForm ? (
              <div className="p-4">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Yeni Destek Talebi</h3>
                  
                  <form onSubmit={handleCreateTicket} className="space-y-4">
                    {/* Kategori */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">Kategori</label>
                      <div className="grid grid-cols-2 gap-2">
                        {supportCategories.map((category) => {
                          const Icon = category.icon;
                          return (
                            <button
                              key={category.id}
                              type="button"
                              onClick={() => setFormData({ ...formData, category: category.id })}
                              className={`p-2 rounded-lg border-2 transition-all text-center ${
                                formData.category === category.id
                                  ? 'border-purple-500 bg-purple-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="flex flex-col items-center gap-1">
                                <Icon className={`w-4 h-4 ${formData.category === category.id ? 'text-purple-600' : 'text-gray-500'}`} />
                                <span className={`text-xs font-medium ${formData.category === category.id ? 'text-purple-900' : 'text-gray-700'}`}>
                                  {category.label}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Konu */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Konu</label>
                      <input
                        type="text"
                        required
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Destek talebi konusu"
                      />
                    </div>

                    {/* Mesaj */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Mesaj</label>
                      <textarea
                        required
                        rows={4}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                        placeholder="Sorununuzu veya sorunuzu detaylı bir şekilde açıklayın..."
                      />
                    </div>

                    {/* Butonlar */}
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={sending}
                        className="flex-1 bg-gradient-to-r from-[#9c6cfe] to-[#0ad2dd] text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                      >
                        {sending ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Gönderiliyor...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span>Gönder</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewTicketForm(false);
                          setFormData({ subject: '', category: 'genel', message: '' });
                        }}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                      >
                        İptal
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            ) : tickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <LifeBuoy className="w-12 h-12 text-gray-400 mb-4" />
                <p className="text-gray-600 text-sm">Henüz destek talebiniz yok</p>
                <p className="text-gray-500 text-xs mt-1">Yeni bir talep oluşturmak için yukarıdaki butona tıklayın</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {tickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket.id)}
                    className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                      selectedTicket === ticket.id ? 'bg-purple-50 border-l-4 border-purple-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-sm text-gray-900 line-clamp-1">{ticket.subject}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                        {getStatusLabel(ticket.status)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-500">{getCategoryLabel(ticket.category)}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">{formatDate(ticket.last_message_at)}</span>
                    </div>
                    {ticket.last_message && (
                      <p className="text-xs text-gray-600 line-clamp-2 mt-1">
                        {ticket.last_message.content}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sağ Panel - Sohbet Görünümü */}
        {selectedTicket && selectedTicketData && (
          <div className="flex-1 flex flex-col bg-white">
            {/* Ticket Header */}
            <div className="border-b border-gray-200 p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-1">{selectedTicketData.subject}</h2>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <span>{getCategoryLabel(selectedTicketData.category)}</span>
                    <span>•</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedTicketData.status)}`}>
                      {getStatusLabel(selectedTicketData.status)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Mesajlar */}
            <div 
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 min-h-0"
            >
              {messages.map((message) => {
                const isUserMessage = !message.is_admin_message && message.sender_id === user?.id;
                return (
                  <div
                    key={message.id}
                    className={`flex ${isUserMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] sm:max-w-[70%] rounded-lg p-3 ${
                        isUserMessage
                          ? 'bg-gradient-to-r from-[#9c6cfe] to-[#0ad2dd] text-white'
                          : 'bg-white border border-gray-200 text-gray-900'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                      <p className={`text-xs mt-1 ${isUserMessage ? 'text-white/70' : 'text-gray-500'}`}>
                        {formatDate(message.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
              
              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded-lg p-3 max-w-[80px] shadow-sm">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Mesaj Gönderme Formu */}
            {selectedTicketData.status !== 'closed' && (
              <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-4 bg-white flex-shrink-0">
                <div className="flex gap-2">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                    placeholder="Mesajınızı yazın..."
                    rows={2}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    className="px-4 py-2 bg-gradient-to-r from-[#9c6cfe] to-[#0ad2dd] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {sending ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Seçili ticket yoksa boş durum */}
        {!selectedTicket && !showNewTicketForm && (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <LifeBuoy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Destek Talebi Seçin</h3>
              <p className="text-sm text-gray-600">
                Sol taraftan bir destek talebi seçin veya yeni bir talep oluşturun
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
