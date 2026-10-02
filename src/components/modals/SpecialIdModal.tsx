import React from 'react';
import { X, ZoomIn } from 'lucide-react';

interface SpecialIdModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SpecialIdModal: React.FC<SpecialIdModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      {/* Modal Container */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg max-h-[96vh] bg-[#000000] border-2 border-[#d4af37] rounded-2xl shadow-[0_0_50px_rgba(212,175,55,0.4)] overflow-hidden flex flex-col"
      >
        {/* Top Control Bar: Close & Title */}
        <div className="relative py-2.5 px-4 bg-gradient-to-r from-[#1a1505] via-[#2a220a] to-[#1a1505] border-b border-[#d4af37]/60 flex items-center justify-between z-10">
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 border border-[#d4af37]/50 text-[#f5d77f] hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95"
            title="إغلاق"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-[#f5d77f] tracking-wide" dir="rtl">
              🌿 المعرف الجميل 🌿
            </span>
          </div>

          <div className="w-8" />
        </div>

        {/* Pure Scrollable Image View - Exactly As-Is with Perfect Quality */}
        <div className="overflow-y-auto flex-1 bg-black flex flex-col items-center p-1 sm:p-2 scrollbar-thin scrollbar-thumb-amber-600/40">
          {/* Exact Render of the "المعرف الجميل" Table */}
          <div className="w-full flex justify-center">
            <div className="w-full max-w-[480px] bg-black text-center select-none font-sans border-2 border-[#caa43b] shadow-2xl relative">
              {/* Top Ornate Header */}
              <div className="bg-gradient-to-b from-[#111] via-[#1a1608] to-black pt-3 pb-2 px-2 relative border-b border-[#b89230]">
                {/* Meander Greek Key Greek Border Pattern Top */}
                <div className="w-full h-2 mb-2 opacity-80" style={{
                  backgroundImage: 'repeating-linear-gradient(90deg, #d4af37 0px, #d4af37 6px, transparent 6px, transparent 10px, #d4af37 10px, #d4af37 12px, transparent 12px, transparent 16px)',
                  backgroundSize: '16px 8px'
                }} />

                {/* Left & Right Laurel Wreaths + Golden Calligraphy Title */}
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl filter drop-shadow-[0_2px_4px_rgba(212,175,55,0.8)]">🌿</span>
                  <h1
                    className="text-2xl sm:text-3xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-[#fff6cc] via-[#f7d568] to-[#b38515] drop-shadow-[0_2px_8px_rgba(212,175,55,0.9)]"
                    style={{ fontFamily: "'Scheherazade New', 'Amiri', 'Traditional Arabic', serif" }}
                  >
                    المعرف الجميل
                  </h1>
                  <span className="text-2xl filter drop-shadow-[0_2px_4px_rgba(212,175,55,0.8)] transform -scale-x-100">🌿</span>
                </div>

                {/* Golden Center Filigree Divider */}
                <div className="flex items-center justify-center gap-2 mt-1">
                  <div className="h-[1px] w-16 bg-gradient-to-r from-transparent to-[#d4af37]" />
                  <span className="text-[#d4af37] text-xs">✤ ❖ ✤</span>
                  <div className="h-[1px] w-16 bg-gradient-to-l from-transparent to-[#d4af37]" />
                </div>
              </div>

              {/* Exact Table Content */}
              <div className="overflow-x-auto" dir="ltr">
                <table className="w-full border-collapse text-[10px] sm:text-[11px] font-bold">
                  {/* Table Header with Warm Gold Background */}
                  <thead>
                    <tr className="bg-gradient-to-b from-[#fcd34d] via-[#fbbf24] to-[#f59e0b] text-black font-black text-center border-b-2 border-black">
                      <th className="border-r border-black py-1.5 px-1 whitespace-nowrap">Level</th>
                      <th className="border-r border-black py-1.5 px-1 whitespace-nowrap">Letter</th>
                      <th className="border-r border-black py-1 px-0.5 whitespace-nowrap">1 Digital</th>
                      <th className="border-r border-black py-1 px-0.5 whitespace-nowrap">2 Digital</th>
                      <th className="border-r border-black py-1 px-0.5 whitespace-nowrap">3 Digital</th>
                      <th className="border-r border-black py-1 px-0.5 whitespace-nowrap">4 Digital</th>
                      <th className="border-r border-black py-1 px-0.5 whitespace-nowrap">5 Digital</th>
                      <th className="border-r border-black py-1 px-0.5 whitespace-nowrap">6 Digital</th>
                      <th className="py-1 px-0.5 whitespace-nowrap">7 Digital</th>
                    </tr>
                  </thead>

                  {/* Table Body with Exact Rows and Gold Grid Lines */}
                  <tbody className="bg-black text-white divide-y divide-[#caa43b]">
                    {/* Row ≥99 */}
                    <tr className="border-b border-[#caa43b]">
                      <td className="bg-black font-black text-white border-r border-[#caa43b] py-1.5 px-1">≥99</td>
                      <td className="border-r border-[#caa43b] px-1 text-[9px] whitespace-nowrap text-slate-100">≥ 2 different letters</td>
                      <td className="border-r border-[#caa43b] px-0.5 text-amber-300 font-black">A</td>
                      <td className="border-r border-[#caa43b] px-0.5"></td>
                      <td className="border-r border-[#caa43b] px-0.5"></td>
                      <td className="border-r border-[#caa43b] px-0.5"></td>
                      <td className="border-r border-[#caa43b] px-0.5"></td>
                      <td className="border-r border-[#caa43b] px-0.5"></td>
                      <td className="px-0.5"></td>
                    </tr>

                    {/* Row ≥95 */}
                    <tr className="border-b border-[#caa43b]">
                      <td className="bg-black font-black text-white border-r border-[#caa43b] py-1.5 px-1">≥95</td>
                      <td className="border-r border-[#caa43b] px-1 text-[9px] whitespace-nowrap text-slate-100">≥ 3 different letters</td>
                      <td className="border-r border-[#caa43b] px-0.5"></td>
                      <td className="border-r border-[#caa43b] px-0.5 leading-tight text-amber-300 font-bold">
                        <div>AB</div>
                        <div>AA</div>
                      </td>
                      <td className="border-r border-[#caa43b] px-0.5"></td>
                      <td className="border-r border-[#caa43b] px-0.5"></td>
                      <td className="border-r border-[#caa43b] px-0.5"></td>
                      <td className="border-r border-[#caa43b] px-0.5"></td>
                      <td className="px-0.5"></td>
                    </tr>

                    {/* Row ≥90 */}
                    <tr className="border-b border-[#caa43b]">
                      <td className="bg-black font-black text-white border-r border-[#caa43b] py-1.5 px-1">≥90</td>
                      <td className="border-r border-[#caa43b] px-1 text-[9px] whitespace-nowrap text-slate-100">≥ 4-10 letters</td>
                      <td className="border-r border-[#caa43b] px-0.5"></td>
                      <td className="border-r border-[#caa43b] px-0.5"></td>
                      <td className="border-r border-[#caa43b] px-0.5 text-amber-300 font-bold">AAA</td>
                      <td className="border-r border-[#caa43b] px-0.5"></td>
                      <td className="border-r border-[#caa43b] px-0.5"></td>
                      <td className="border-r border-[#caa43b] px-0.5"></td>
                      <td className="px-0.5"></td>
                    </tr>

                    {/* Row ≥80 */}
                    <tr className="border-b border-[#caa43b]">
                      <td className="bg-black font-black text-white border-r border-[#caa43b] py-1.5 px-1">≥80</td>
                      <td className="border-r border-[#caa43b] px-1 text-[8px] whitespace-nowrap text-slate-100">≥ 4-10 different letters</td>
                      <td className="border-r border-[#caa43b] px-0.5"></td>
                      <td className="border-r border-[#caa43b] px-0.5"></td>
                      <td className="border-r border-[#caa43b] px-0.5 leading-tight font-bold text-amber-200">
                        <div>ABB</div>
                        <div>BAA</div>
                        <div>ABA</div>
                      </td>
                      <td className="border-r border-[#caa43b] px-0.5 text-amber-300 font-bold">AAAA</td>
                      <td className="border-r border-[#caa43b] px-0.5 text-amber-300 font-bold">AAAAA</td>
                      <td className="border-r border-[#caa43b] px-0.5"></td>
                      <td className="px-0.5"></td>
                    </tr>

                    {/* Row ≥70 */}
                    <tr className="border-b border-[#caa43b]">
                      <td className="bg-black font-black text-white border-r border-[#caa43b] py-1.5 px-1">≥70</td>
                      <td className="border-r border-[#caa43b] px-1"></td>
                      <td className="border-r border-[#caa43b] px-0.5"></td>
                      <td className="border-r border-[#caa43b] px-0.5"></td>
                      <td className="border-r border-[#caa43b] px-0.5"></td>
                      <td className="border-r border-[#caa43b] px-0.5 leading-tight text-[9px] font-bold text-slate-100">
                        <div>AABA</div>
                        <div>AAAB</div>
                        <div>30301</div>
                        <div>ABBA</div>
                        <div>ABBB</div>
                        <div>ABAB</div>
                        <div>ABCC</div>
                        <div>AABC</div>
                        <div>BCBB</div>
                        <div>ABCD</div>
                        <div>ABCB</div>
                      </td>
                      <td className="border-r border-[#caa43b] px-0.5 leading-tight text-[9px] font-bold text-slate-100">
                        <div>AABBB</div>
                      </td>
                      <td className="border-r border-[#caa43b] px-0.5"></td>
                      <td className="px-0.5"></td>
                    </tr>

                    {/* Row ≥60 */}
                    <tr className="border-b border-[#caa43b]">
                      <td className="bg-black font-black text-white border-r border-[#caa43b] py-1.5 px-1">≥60</td>
                      <td className="border-r border-[#caa43b] px-1"></td>
                      <td className="border-r border-[#caa43b] px-0.5"></td>
                      <td className="border-r border-[#caa43b] px-0.5"></td>
                      <td className="border-r border-[#caa43b] px-0.5"></td>
                      <td className="border-r border-[#caa43b] px-0.5"></td>
                      <td className="border-r border-[#caa43b] px-0.5 leading-tight text-[9px] font-bold text-slate-100">
                        <div>ABBBA</div>
                        <div>AAAABB</div>
                        <div>AAAABC</div>
                        <div>AABBC</div>
                        <div>ABCCC</div>
                        <div>AABBB</div>
                      </td>
                      <td className="border-r border-[#caa43b] px-0.5 text-amber-300 font-bold text-[9px]">AAAAAA</td>
                      <td className="px-0.5"></td>
                    </tr>

                    {/* Row ≥55 */}
                    <tr className="border-b border-[#caa43b]">
                      <td className="bg-black font-black text-white border-r border-[#caa43b] py-1.5 px-1">≥55</td>
                      <td className="border-r border-[#caa43b] px-1"></td>
                      <td className="border-r border-[#caa43b] px-0.5"></td>
                      <td className="border-r border-[#caa43b] px-0.5"></td>
                      <td className="border-r border-[#caa43b] px-0.5"></td>
                      <td className="border-r border-[#caa43b] px-0.5 leading-tight text-[9px] font-bold text-slate-100">
                        <div>ABCDE</div>
                        <div>ABCBB</div>
                        <div>AABBC</div>
                      </td>
                      <td className="border-r border-[#caa43b] px-0.5 leading-tight text-[9px] font-bold text-slate-100">
                        <div>AAAAAB</div>
                        <div>ABCDEF</div>
                        <div>AAABBB</div>
                        <div>ABBBBB</div>
                      </td>
                      <td className="border-r border-[#caa43b] px-0.5 leading-tight text-[9px] font-bold text-slate-100">
                        <div>AAAAAAA</div>
                        <div>ABCDEFG</div>
                      </td>
                      <td className="px-0.5"></td>
                    </tr>

                    {/* Row ≥50 */}
                    <tr className="border-b border-[#caa43b]">
                      <td className="bg-black font-black text-white border-r border-[#caa43b] py-1.5 px-1">≥50</td>
                      <td className="border-r border-[#caa43b] px-1"></td>
                      <td className="border-r border-[#caa43b] px-0.5"></td>
                      <td className="border-r border-[#caa43b] px-0.5"></td>
                      <td className="border-r border-[#caa43b] px-0.5"></td>
                      <td className="border-r border-[#caa43b] px-0.5 leading-tight text-[9px] font-bold text-slate-100">
                        <div>AABCC</div>
                        <div>ABCAA</div>
                        <div>ABBBC</div>
                      </td>
                      <td className="border-r border-[#caa43b] px-0.5 leading-tight text-[9px] font-bold text-slate-100">
                        <div>AAAAAB</div>
                        <div>AAAABC</div>
                        <div>ABBABB</div>
                        <div>ABBBBA</div>
                      </td>
                      <td className="border-r border-[#caa43b] px-0.5 text-amber-300 font-bold text-[9px]">ABBBBBB</td>
                      <td className="px-0.5"></td>
                    </tr>

                    {/* Row ≥45 */}
                    <tr className="border-b border-[#caa43b]">
                      <td className="bg-black font-black text-white border-r border-[#caa43b] py-1.5 px-1">≥45</td>
                      <td className="border-r border-[#caa43b] px-1"></td>
                      <td className="border-r border-[#caa43b] px-0.5"></td>
                      <td className="border-r border-[#caa43b] px-0.5"></td>
                      <td className="border-r border-[#caa43b] px-0.5"></td>
                      <td className="border-r border-[#caa43b] px-0.5 leading-tight text-[9px] font-bold text-slate-100">
                        <div>ABABA</div>
                        <div>ABCDD</div>
                      </td>
                      <td className="border-r border-[#caa43b] px-0.5 leading-tight text-[9px] font-bold text-slate-100">
                        <div>AAABBC</div>
                        <div>AABBCC</div>
                        <div>ABBBBC</div>
                        <div>ABCABC</div>
                        <div>AABBBA</div>
                      </td>
                      <td className="border-r border-[#caa43b] px-0.5 text-amber-300 font-bold text-[9px]">AAAAAAB</td>
                      <td className="px-0.5"></td>
                    </tr>

                    {/* Row ≥40 */}
                    <tr className="border-b border-[#caa43b]">
                      <td className="bg-black font-black text-white border-r border-[#caa43b] py-1.5 px-1">≥40</td>
                      <td className="border-r border-[#caa43b] px-1"></td>
                      <td className="border-r border-[#caa43b] px-0.5"></td>
                      <td className="border-r border-[#caa43b] px-0.5"></td>
                      <td className="border-r border-[#caa43b] px-0.5"></td>
                      <td className="border-r border-[#caa43b] px-0.5 leading-tight text-[9px] font-bold text-slate-100">
                        <div>ABCBA</div>
                        <div>ABCDB</div>
                      </td>
                      <td className="border-r border-[#caa43b] px-0.5 leading-tight text-[9px] font-bold text-slate-100">
                        <div>ABCBBB</div>
                        <div>AABCCC</div>
                        <div>CCAAB</div>
                        <div>AABAAC</div>
                        <div>ABABAA</div>
                        <div>AABDBA</div>
                        <div>AACCCA</div>
                      </td>
                      <td className="border-r border-[#caa43b] px-0.5 leading-tight text-[9px] font-bold text-slate-100">
                        <div>AAAAAABB</div>
                        <div>AAAAABBB</div>
                        <div>AAABBBB</div>
                        <div>BBAAAAAA</div>
                      </td>
                      <td className="px-0.5"></td>
                    </tr>

                    {/* Row ≥35 */}
                    <tr className="border-b border-[#caa43b]">
                      <td className="bg-black font-black text-white border-r border-[#caa43b] py-1.5 px-1">≥35</td>
                      <td className="border-r border-[#caa43b] px-1"></td>
                      <td className="border-r border-[#caa43b] px-0.5"></td>
                      <td className="border-r border-[#caa43b] px-0.5"></td>
                      <td className="border-r border-[#caa43b] px-0.5"></td>
                      <td className="border-r border-[#caa43b] px-0.5 leading-tight text-[9px] font-bold text-slate-100">
                        <div>ABACCC</div>
                        <div>ACCCAB</div>
                        <div>AABDBD</div>
                        <div>AABBBC</div>
                        <div>AABDBC</div>
                        <div>ACCCBA</div>
                        <div>ABCCAB</div>
                      </td>
                      <td className="border-r border-[#caa43b] px-0.5 leading-tight text-[9px] font-bold text-slate-100">
                        <div>ABABABA</div>
                        <div>ACBBBBB</div>
                        <div>ABCCCBA</div>
                        <div>ACCCCCB</div>
                        <div>ACCCCAA</div>
                        <div>ABBABBA</div>
                        <div>AAABBCC</div>
                      </td>
                      <td className="border-r border-[#caa43b] px-0.5"></td>
                      <td className="px-0.5"></td>
                    </tr>

                    {/* Row ≥30 */}
                    <tr className="border-b border-[#caa43b]">
                      <td className="bg-black font-black text-white border-r border-[#caa43b] py-1.5 px-1">≥30</td>
                      <td className="border-r border-[#caa43b] px-1"></td>
                      <td className="border-r border-[#caa43b] px-0.5"></td>
                      <td className="border-r border-[#caa43b] px-0.5"></td>
                      <td className="border-r border-[#caa43b] px-0.5"></td>
                      <td className="border-r border-[#caa43b] px-0.5 leading-tight text-[9px] font-bold text-slate-100">
                        <div>ABABAC</div>
                        <div>ABABAD</div>
                      </td>
                      <td className="border-r border-[#caa43b] px-0.5 leading-tight text-[9px] font-bold text-slate-100">
                        <div>ABCBBBB</div>
                        <div>ABBBBAC</div>
                        <div>ABBCCAA</div>
                        <div>ABCCCAB</div>
                        <div>ACCCCAB</div>
                      </td>
                      <td className="border-r border-[#caa43b] px-0.5"></td>
                      <td className="px-0.5"></td>
                    </tr>

                    {/* Row ≥25 */}
                    <tr>
                      <td className="bg-black font-black text-white border-r border-[#caa43b] py-1.5 px-1">≥25</td>
                      <td className="border-r border-[#caa43b] px-1"></td>
                      <td className="border-r border-[#caa43b] px-0.5"></td>
                      <td className="border-r border-[#caa43b] px-0.5"></td>
                      <td className="border-r border-[#caa43b] px-0.5"></td>
                      <td className="border-r border-[#caa43b] px-0.5"></td>
                      <td className="border-r border-[#caa43b] px-0.5"></td>
                      <td className="border-r border-[#caa43b] px-0.5 leading-tight text-[9px] font-bold text-slate-100">
                        <div>ABCDABC</div>
                        <div>ABCADDA</div>
                        <div>ABABADA</div>
                      </td>
                      <td className="px-0.5"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
