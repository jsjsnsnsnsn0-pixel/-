// System messages and event notifications service for Toti Chat

export interface SystemNotificationMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: string;
  isMe: boolean;
  type: 'text';
  category?: 'recharge' | 'soulmates_weekly' | 'custom_gift' | 'general';
}

const STORAGE_KEY = 'toti_system_messages_history';

export const getSystemMessages = (): SystemNotificationMessage[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // fallback
  }

  // Clean empty initial system messages list
  return [];
};

export const addSystemMessage = (content: string, category: 'recharge' | 'soulmates_weekly' | 'custom_gift' | 'general' = 'recharge') => {
  const currentList = getSystemMessages();
  const timeNow = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

  const newMessage: SystemNotificationMessage = {
    id: `sys-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    senderId: 'system_official_bot',
    senderName: 'رسائل النظام',
    senderAvatar: '/assets/images/system_bell_icon_1790421934665.jpg',
    content,
    timestamp: timeNow,
    isMe: false,
    type: 'text',
    category,
  };

  const updated = [newMessage, ...currentList];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    // Dispatch window event so open chats / unread counts update in real-time
    window.dispatchEvent(new CustomEvent('toti_system_message_received', { detail: newMessage }));
  } catch {
    // ignore
  }

  return newMessage;
};

// Recharge tier specific notification generator
export const triggerRechargeTierNotification = (amount: number, label: string, itemsDescription: string) => {
  const text = `🎉 تهانينا! لقد وصل شحنك التراكمي إلى (${amount}$) [${label}]! تم بنجاح تفعيل ومنحك مكافأة النشاط الحصرية: ${itemsDescription}. تمنياتنا لك بأوقات ممتعة في توتي شات 👑.`;
  addSystemMessage(text, 'recharge');
};

// Soulmates weekly top 1 (السيبي المرتبة الأولى) notification generator
export const triggerSoulmatesWeeklyWinNotification = (coupleName1: string = 'مدللة خالد', coupleName2: string = 'فداك بحالي') => {
  const text = `🏆 مبروك لتحقيقك ورَفِيق روحك (السيبي) المرتبة الأولى Top 1 في رفقاء الروح الأسبوعية برصيد 13.8M! تم منحكما مكافأة الأسبوع: إطار رفقاء الروح الملكي المجنح بالقلب الياقوتي، بنر حصري بالتطبيق لمدة 7 أيام، وشارة الشرف الإمبراطورية لك ولشريكك 💖.`;
  addSystemMessage(text, 'soulmates_weekly');
};

// Custom gift ($1500) progress or completion notification generator
export const triggerCustomGiftNotification = (currentAmount: number, targetAmount: number = 1500) => {
  if (currentAmount >= targetAmount) {
    const text = `🎁 تهانينا الحارة! لقد حققت شرط الشحن التراكمي الشهري ($1500) بالكامل! تم فتح الهدية المخصصة 3D الحصرية لك الآن، يرجى التواصل مع خدمة العملاء (السيد حمدان) لاعتماد تفاصيل هديتك الخاصة فوراً ✨.`;
    addSystemMessage(text, 'custom_gift');
  } else {
    const remaining = (targetAmount - currentAmount).toFixed(2);
    const text = `📊 نشاط الهدية المخصصة: تم تحديث رصيد شحنك التراكمي الشهري إلى ($${currentAmount.toFixed(2)}). المتبقي لك للحصول على الهدية المخصصة $1500 هو ($${remaining}).`;
    addSystemMessage(text, 'custom_gift');
  }
};
