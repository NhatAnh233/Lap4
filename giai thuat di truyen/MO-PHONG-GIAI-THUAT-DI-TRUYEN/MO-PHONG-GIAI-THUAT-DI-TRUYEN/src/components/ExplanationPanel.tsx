/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Brain, GitMerge, Shuffle, Dna, Target, BarChart2 } from "lucide-react";

const Section = ({ icon: Icon, color, title, children }: { icon: any; color: string; title: string; children: React.ReactNode }) => (
  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-3">
    <div className={`flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800`}>
      <div className={`p-2.5 rounded-xl ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="font-bold text-slate-800 dark:text-white text-base">{title}</h3>
    </div>
    <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed space-y-2">
      {children}
    </div>
  </div>
);

export default function ExplanationPanel() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="theory-panel">
      <Section icon={Brain} color="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400" title="Giải Thuật Di Truyền là gì?">
        <p>
          <strong className="text-slate-800 dark:text-slate-200">Giải thuật di truyền (Genetic Algorithm – GA)</strong> là kỹ thuật tối ưu hóa lấy cảm hứng từ thuyết tiến hóa của Darwin. Thuật toán mô phỏng quá trình <em>chọn lọc tự nhiên</em>, trong đó các cá thể "tốt hơn" có khả năng sinh sản và truyền gen cao hơn.
        </p>
        <p>GA đặc biệt hiệu quả cho các bài toán tổ hợp có không gian tìm kiếm khổng lồ như TSP, lập lịch, thiết kế mạng...</p>
      </Section>

      <Section icon={Dna} color="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" title="Mã hóa Nhiễm sắc thể">
        <p>Mỗi <strong className="text-slate-800 dark:text-slate-200">cá thể (individual)</strong> đại diện cho một lời giải tiềm năng, được mã hóa dưới dạng <em>nhiễm sắc thể (chromosome)</em>.</p>
        <ul className="list-disc pl-5 space-y-1 text-xs">
          <li><strong className="text-slate-700 dark:text-slate-300">Khỉ gõ chữ:</strong> Chuỗi ký tự ngẫu nhiên → đích là câu mục tiêu</li>
          <li><strong className="text-slate-700 dark:text-slate-300">TSP:</strong> Hoán vị thứ tự thành phố → đích là tổng quãng đường ngắn nhất</li>
          <li><strong className="text-slate-700 dark:text-slate-300">Bài tập:</strong> <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">[0,2,9,7,3,1,8,4,5,6]</code> — điểm 0 cố định đầu/cuối</li>
        </ul>
      </Section>

      <Section icon={Target} color="bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400" title="Hàm Thích nghi (Fitness Function)">
        <p>Hàm thích nghi đánh giá chất lượng của mỗi cá thể. GA luôn muốn <em>tối đa hóa</em> giá trị fitness.</p>
        <div className="bg-slate-50 dark:bg-slate-950/50 rounded-xl p-3 font-mono text-xs border border-slate-100 dark:border-slate-800 space-y-1">
          <p className="text-indigo-600 dark:text-indigo-400">// Khỉ gõ chữ</p>
          <p className="text-slate-700 dark:text-slate-300">fitness = số_ký_tự_khớp / độ_dài_chuỗi</p>
          <p className="text-indigo-600 dark:text-indigo-400 mt-2">// TSP Bài tập</p>
          <p className="text-slate-700 dark:text-slate-300">fitness = 1 / tổng_quãng_đường</p>
        </div>
      </Section>

      <Section icon={GitMerge} color="bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400" title="Lai ghép (Crossover)">
        <p>Kết hợp gene từ 2 cha/mẹ được chọn để tạo ra cá thể con kế thừa đặc điểm tốt của cả hai.</p>
        <div className="space-y-2 text-xs">
          <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
            <p className="font-bold text-slate-700 dark:text-slate-300 mb-1">Ordered Crossover (OX) — dùng cho TSP</p>
            <p className="text-slate-500 dark:text-slate-500">Sao chép đoạn [a,b] từ cha, điền phần còn lại theo thứ tự từ mẹ → đảm bảo không trùng thành phố.</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
            <p className="font-bold text-slate-700 dark:text-slate-300 mb-1">Single-point — dùng cho Khỉ gõ chữ</p>
            <p className="text-slate-500 dark:text-slate-500">Cắt tại điểm ngẫu nhiên: nửa đầu từ cha A, nửa sau từ cha B.</p>
          </div>
        </div>
      </Section>

      <Section icon={Shuffle} color="bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400" title="Đột biến (Mutation)">
        <p>Áp dụng thay đổi ngẫu nhiên nhỏ lên cá thể con để duy trì <em>đa dạng gen</em> và tránh hội tụ cục bộ sớm.</p>
        <div className="space-y-2 text-xs">
          <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
            <p className="font-bold text-slate-700 dark:text-slate-300 mb-1">Swap Mutation — TSP Bài tập</p>
            <p className="text-slate-500">Chọn ngẫu nhiên 2 vị trí (trừ đầu/cuối) và hoán đổi — đảm bảo lộ trình vẫn hợp lệ.</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
            <p className="font-bold text-slate-700 dark:text-slate-300 mb-1">Random Char Mutation — Khỉ gõ chữ</p>
            <p className="text-slate-500">Mỗi ký tự có xác suất nhỏ bị thay bằng ký tự ngẫu nhiên từ bảng chữ cái.</p>
          </div>
        </div>
      </Section>

      <Section icon={BarChart2} color="bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400" title="Tham số Bài tập (Đề bài)">
        <div className="grid grid-cols-2 gap-2 text-xs">
          {[
            ["Quần thể", "100 cá thể"],
            ["Thế hệ", "500 thế hệ"],
            ["Crossover", "OX · Rate 0.8"],
            ["Mutation", "Swap · Rate 0.05"],
            ["Selection", "Tournament k=5"],
            ["Fitness", "1 / distance"],
          ].map(([label, val]) => (
            <div key={label} className="bg-slate-50 dark:bg-slate-950/50 rounded-xl p-2.5 border border-slate-100 dark:border-slate-800">
              <p className="text-slate-400 text-xxs uppercase tracking-wide">{label}</p>
              <p className="font-bold font-mono text-slate-700 dark:text-slate-200 mt-0.5">{val}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-2">Tab <strong className="text-slate-700 dark:text-slate-300">Bài Tập GA</strong> chạy đúng 10 địa điểm cố định theo yêu cầu đề bài với console log chi tiết.</p>
      </Section>
    </div>
  );
}
