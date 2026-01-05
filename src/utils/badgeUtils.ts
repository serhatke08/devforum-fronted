import { supabase } from '../lib/supabase';

export interface Badge {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string;
  category: string;
  earned_at?: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  badges: Badge;
}

// Rozet kazanma fonksiyonları
export const badgeUtils = {
  // Kullanıcıya rozet ver
  async awardBadge(userId: string, badgeName: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Önce rozet ID'sini bul
      const { data: badge, error: badgeError } = await supabase
        .from('badges')
        .select('id')
        .eq('name', badgeName)
        .single();

      if (badgeError || !badge) {
        return { success: false, error: 'Rozet bulunamadı' };
      }

      // Kullanıcının bu rozeti zaten var mı kontrol et
      const { data: existingBadge } = await supabase
        .from('user_badges')
        .select('id')
        .eq('user_id', userId)
        .eq('badge_id', badge.id)
        .single();

      if (existingBadge) {
        return { success: true }; // Zaten var, hata değil
      }

      // Rozeti ver
      const { error: awardError } = await supabase
        .from('user_badges')
        .insert({
          user_id: userId,
          badge_id: badge.id,
        });

      if (awardError) {
        return { success: false, error: awardError.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Beklenmeyen hata' };
    }
  },

  // Kullanıcının rozetlerini getir
  async getUserBadges(userId: string): Promise<{ data: UserBadge[] | null; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('user_badges')
        .select(`
          id,
          user_id,
          badge_id,
          earned_at,
          badges (
            id,
            name,
            description,
            icon,
            color,
            category
          )
        `)
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data as UserBadge[] };
    } catch (error) {
      return { data: null, error: 'Beklenmeyen hata' };
    }
  },

  // Kullanıcının belirli bir rozeti var mı kontrol et
  async hasBadge(userId: string, badgeName: string): Promise<boolean> {
    try {
      const { data } = await supabase
        .from('user_badges')
        .select(`
          badges!inner(name)
        `)
        .eq('user_id', userId)
        .eq('badges.name', badgeName)
        .single();

      return !!data;
    } catch {
      return false;
    }
  },

  // İlk gönderi rozeti kontrol et ve ver
  async checkFirstPostBadge(userId: string): Promise<void> {
    const hasFirstPost = await this.hasBadge(userId, 'İlk Gönderi');
    if (!hasFirstPost) {
      await this.awardBadge(userId, 'İlk Gönderi');
    }
  },

  // İlk yorum rozeti kontrol et ve ver
  async checkFirstCommentBadge(userId: string): Promise<void> {
    const hasFirstComment = await this.hasBadge(userId, 'İlk Yorum');
    if (!hasFirstComment) {
      await this.awardBadge(userId, 'İlk Yorum');
    }
  },

  // Aktif katılımcı rozetlerini kontrol et ve ver
  async checkActivityBadges(userId: string, postCount: number, commentCount: number): Promise<void> {
    const totalActivity = postCount + commentCount;

    if (totalActivity >= 50 && !(await this.hasBadge(userId, 'Aktif Katılımcı'))) {
      await this.awardBadge(userId, 'Aktif Katılımcı');
    }

    if (totalActivity >= 100 && !(await this.hasBadge(userId, 'Süper Aktif'))) {
      await this.awardBadge(userId, 'Süper Aktif');
    }

    if (totalActivity >= 500 && !(await this.hasBadge(userId, 'Efsane'))) {
      await this.awardBadge(userId, 'Efsane');
    }
  },

  // Beğeni rozeti kontrol et ve ver
  async checkLikesBadge(userId: string, postId: string): Promise<void> {
    try {
      // Gönderinin beğeni sayısını kontrol et
      const { data: post } = await supabase
        .from('topics')
        .select('likes_count')
        .eq('id', postId)
        .eq('author_id', userId)
        .single();

      if (post && post.likes_count >= 10 && !(await this.hasBadge(userId, 'Beğeni Alan'))) {
        await this.awardBadge(userId, 'Beğeni Alan');
      }
    } catch (error) {
      console.error('Beğeni rozeti kontrol hatası:', error);
    }
  },

  // Yardımcı rozeti kontrol et ve ver
  async checkHelperBadge(userId: string): Promise<void> {
    try {
      // Kullanıcının çözüm seçilen yorum sayısını kontrol et
      const { data: solutions } = await supabase
        .from('comments')
        .select('id')
        .eq('author_id', userId)
        .eq('is_solution', true);

      if (solutions && solutions.length >= 10 && !(await this.hasBadge(userId, 'Yardımcı'))) {
        await this.awardBadge(userId, 'Yardımcı');
      }
    } catch (error) {
      console.error('Yardımcı rozeti kontrol hatası:', error);
    }
  },

  // Mentor rozeti kontrol et ve ver
  async checkMentorBadge(userId: string): Promise<void> {
    try {
      // Kullanıcının toplam yorum sayısını kontrol et
      const { data: profile } = await supabase
        .from('profiles')
        .select('total_comments')
        .eq('id', userId)
        .single();

      if (profile && profile.total_comments >= 100 && !(await this.hasBadge(userId, 'Mentor'))) {
        await this.awardBadge(userId, 'Mentor');
      }
    } catch (error) {
      console.error('Mentor rozeti kontrol hatası:', error);
    }
  }
};
