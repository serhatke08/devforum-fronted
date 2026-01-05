'use client';
import { Mail, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface EmailVerificationProps {
  email: string;
  onResendSuccess?: () => void;
  onResendError?: (error: string) => void;
}

export function EmailVerification({ email, onResendSuccess, onResendError }: EmailVerificationProps) {
  const [isResending, setIsResending] = useState(false);
  const [resendCount, setResendCount] = useState(0);
  const [lastResendTime, setLastResendTime] = useState<Date | null>(null);

  const handleResendEmail = async () => {
    if (isResending) return;
    
    // 60 saniye cooldown
    if (lastResendTime && Date.now() - lastResendTime.getTime() < 60000) {
      onResendError?.('Lütfen 60 saniye bekleyin');
      return;
    }

    setIsResending(true);
    setResendCount(prev => prev + 1);
    setLastResendTime(new Date());

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: window.location.origin
        }
      });

      if (error) {
        onResendError?.(error.message);
      } else {
        onResendSuccess?.();
      }
    } catch (err: any) {
      onResendError?.(err.message || 'E-posta gönderilemedi');
    } finally {
      setIsResending(false);
    }
  };

  const getCooldownTime = () => {
    if (!lastResendTime) return 0;
    const elapsed = Date.now() - lastResendTime.getTime();
    return Math.max(0, 60000 - elapsed);
  };

  const [cooldown, setCooldown] = useState(0);

  // Cooldown timer
  useState(() => {
    const interval = setInterval(() => {
      const remaining = getCooldownTime();
      setCooldown(remaining);
      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  });

  return (
    <div className="p-6 text-center">
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Mail className="w-8 h-8 text-blue-500" />
      </div>
      
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        E-posta Doğrulama Gerekli
      </h3>
      
      <p className="text-gray-600 mb-6">
        <strong>{email}</strong> adresine doğrulama linki gönderildi.
        <br />
        Lütfen e-postanızı kontrol edin ve doğrulama linkine tıklayın.
      </p>

      <div className="space-y-4">
        <button
          onClick={handleResendEmail}
          disabled={isResending || cooldown > 0}
          className="w-full py-3 bg-gradient-to-r from-[#9c6cfe] to-[#0ad2dd] text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isResending ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Gönderiliyor...
            </>
          ) : cooldown > 0 ? (
            `Tekrar gönder (${Math.ceil(cooldown / 1000)}s)`
          ) : (
            'E-postayı Tekrar Gönder'
          )}
        </button>

        {resendCount > 0 && (
          <p className="text-sm text-gray-500">
            {resendCount} kez tekrar gönderildi
          </p>
        )}

        <div className="text-sm text-gray-500">
          <p>E-posta gelmedi mi?</p>
          <p>• Spam klasörünü kontrol edin</p>
          <p>• E-posta adresini kontrol edin</p>
          <p>• Birkaç dakika bekleyin</p>
        </div>
      </div>
    </div>
  );
}