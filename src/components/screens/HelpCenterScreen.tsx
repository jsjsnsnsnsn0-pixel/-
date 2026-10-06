import { rpc, backendMessage } from '../../services/backend';
import { usePublicChat } from '../../hooks/usePublicChat';
import { useTimeouts } from '../../hooks/useTimeouts';
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ChevronRight, Headphones, HelpCircle, MessageSquare, ShieldAlert, Send, Check } from 'lucide-react';

export const HelpCenterScreen: React.FC = () => {
  const { setActiveSubScreen, reportError } = useApp();
  const scheduleTimeout = useTimeouts();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const {opening, openChat} = usePublicChat();

  const faqs = [
    {
      q: 'كيف يمكنني شحن رصيد الذهب؟',
      a: 'يمكنك شحن الذهب بالانتقال إلى صفحة المحفظة واختيار الباقة المناسبة، والدفع للوكيل الرسمي المعتمد في بلد حسابك.',
    },
    {
      q: 'كيف أحصل على رتبة VIP وشاراتها؟',
      a: 'يمكن شراء اشتراك VIP من صفحة VIP وفق أسعار الخادم أو استلام مكافأة شحن مستحقة. كل مستوى يمنحك تاجا ملكياً وتأثيرات دخول وهدايا حصرية.',
    },
    {
      q: 'ما هي طريقة قفل مقاعد المايكروفون في غرفتي؟',
      a: 'كمضيف أو مشرف للغرفة، انقر على أي مقعد فارغ واختر "قفل المقعد"، ولن يتمكن أحد من الصعود إلا بدعوة منك.',
    },
    {
      q: 'كيف يمكنني الانضمام لوكالة مضيفين؟',
      a: 'توجه إلى قسم "وكالة" في ملفك الشخصي وأدخل معرف الوكالة (ID) للتواصل مع مدير الوكالة والبدء في استلام العمولات.',
    },
    {
      q: 'هل يمكنني تغيير اسم المستخدم ورقم الـ ID؟',
      a: 'يمكنك تغيير الاسم المستعار في أي وقت من زر تعديل الملف الشخصي، بينما رقم الـ ID فريد وثابت لكل حساب.',
    },
  ];

  const handleSendFeedback = async (e: React.FormEvent) => {
    e.preventDefault(); if (busy || feedback.trim().length < 5) return;
    setBusy(true); setFeedbackSent(false);
    try {
      const id = await rpc<string>('submit_support_ticket', {p_category:'feedback',p_message:feedback.trim()});
      if (!id) throw new Error('ticket not confirmed');
      setFeedbackSent(true); setFeedback('');
      scheduleTimeout(() => setFeedbackSent(false), 3500);
    } catch (error) { reportError(backendMessage(error)); }
    finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 pb-28">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubScreen(null)}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 cursor-pointer"
          >
            <ChevronRight size={22} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <Headphones size={18} />
            </div>
            <h1 className="text-base font-bold text-slate-900">مركز المساعدة والدعم</h1>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Support banner */}
        <div className="rounded-3xl bg-gradient-to-r from-cyan-600 to-teal-600 text-white p-5 shadow-sm">
          <span className="text-xs bg-white/20 text-white px-2.5 py-0.5 rounded-full font-bold inline-block mb-2">
            فريق خدمة العملاء 24/7
          </span>
          <h2 className="text-lg font-black mb-1">كيف يمكننا مساعدتك اليوم؟</h2>
          <p className="text-xs text-white/80 leading-relaxed">
            نحن هنا لضمان تجربة صوتية ممتعة وآمنة لك في جميع غرف التطبيق.
          </p>
        </div>

        {/* FAQs Accordion */}
        <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <HelpCircle size={16} className="text-cyan-600" />
            <h3 className="text-xs font-bold text-slate-900">الأسئلة الشائعة:</h3>
          </div>

          {faqs.map((faq, idx) => (
            <div key={idx} className="border-b border-slate-50 last:border-0 pb-2">
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full text-right py-2 text-xs font-bold text-slate-800 flex items-center justify-between cursor-pointer"
              >
                <span>{faq.q}</span>
                <span className="text-slate-400 text-sm">{openFaq === idx ? '−' : '+'}</span>
              </button>
              {openFaq === idx && (
                <p className="text-[11px] text-slate-500 leading-relaxed pb-2 px-1">
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Feedback / Contact form */}
        <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs">
          <h3 className="text-xs font-bold text-slate-900 mb-1">أرسل اقتراحاً أو أبلغ عن مشكلة</h3>
          <p className="text-[11px] text-slate-500 mb-3">
            يسعدنا سماع آرائك لتطوير المنصة وحل أي صعوبة تواجهك.
          </p>

          {feedbackSent && (
            <div className="mb-3 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
              <Check size={16} className="text-emerald-600" />
              <span>شكراً لك! تم تسجيل ملاحظتك لدى الدعم.</span>
            </div>
          )}

          <form onSubmit={handleSendFeedback} className="space-y-3">
            <textarea
              aria-label="رسالتك إلى الدعم"
              rows={3}
              minLength={5}
              maxLength={2000}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="اكتب رسالتك أو استفسارك هنا بالتفصيل..."
              className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-cyan-500 resize-none"
            />
            <button
              type="submit" aria-busy={busy}
              disabled={busy || feedback.trim().length < 5}
              className="w-full py-2.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center justify-center gap-2 transition-all"
            >
              <Send size={14} />
              <span>إرسال للدعم الفني</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
