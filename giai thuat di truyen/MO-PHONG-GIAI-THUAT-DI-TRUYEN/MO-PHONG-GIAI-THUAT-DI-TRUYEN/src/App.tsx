/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Dna,
  Keyboard,
  Map,
  BookOpen,
  Brain,
  GitMerge,
  HeartHandshake,
  GraduationCap,
} from "lucide-react";
import ExplanationPanel from "./components/ExplanationPanel";
import MonkeySimulator from "./components/MonkeySimulator";
import TspSimulator from "./components/TspSimulator";
import TspBaiTap from "./components/TspBaiTap";

type TabType = "monkey" | "tsp" | "baitap" | "theory";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>("baitap");

  const tabs: { id: TabType; icon: any; label: string; accent?: boolean }[] = [
    { id: "monkey", icon: Keyboard, label: "Khỉ gõ chữ" },
    { id: "tsp", icon: Map, label: "Người bán hàng (TSP)" },
    { id: "baitap", icon: GraduationCap, label: "Bài Tập GA", accent: true },
    { id: "theory", icon: BookOpen, label: "Lý thuyết GA" },
  ];

  return (
    <div
      className="min-h-screen bg-[#f8fafc] text-slate-800 antialiased selection:bg-indigo-100 font-sans"
      id="app-root"
    >
      {/* Background gradient */}
      <div className="absolute top-0 right-0 w-full h-[320px] bg-gradient-to-b from-indigo-50/70 to-transparent pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8">

        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20 shrink-0">
              <Dna className="w-7 h-7 animate-[spin_6s_linear_infinite]" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2 flex-wrap">
                GIẢI THUẬT DI TRUYỀN
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-mono font-bold">
                  ALGORITHM PLAYGROUND
                </span>
              </h1>
              <p className="text-xs md:text-sm text-slate-500 mt-1">
                Trực quan hóa sinh động thuật toán mô phỏng Chọn lọc tự nhiên & Tiến hóa Darwin trong Khoa học máy tính.
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/50 self-start md:self-center flex-wrap gap-0.5">
            {tabs.map(({ id, icon: Icon, label, accent }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2 ${
                  activeTab === id
                    ? accent
                      ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20"
                      : "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </header>

        {/* Main content */}
        <main className="min-h-[450px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              {activeTab === "monkey" && <MonkeySimulator />}
              {activeTab === "tsp" && <TspSimulator />}
              {activeTab === "baitap" && <TspBaiTap />}
              {activeTab === "theory" && <ExplanationPanel />}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200/60 pt-8 mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-500">
          <div className="space-y-2">
            <h5 className="font-bold text-slate-700 flex items-center gap-1.5">
              <Brain className="w-4 h-4 text-indigo-500" />
              Tính Chọn lọc & Thích nghi
            </h5>
            <p className="leading-relaxed">
              Các giải pháp tồi hơn bị loại dần qua mỗi chu kỳ sinh học. Các giải pháp tốt liên tục được giữ lại và tổ hợp thành thế hệ rực rỡ hơn.
            </p>
          </div>
          <div className="space-y-2">
            <h5 className="font-bold text-slate-700 flex items-center gap-1.5">
              <GitMerge className="w-4 h-4 text-emerald-500" />
              Lai ghép có trật tự (Ordered OX)
            </h5>
            <p className="leading-relaxed">
              Trong bài toán TSP, OX đảm bảo chuỗi hành trình không trùng lặp — đây là yêu cầu bắt buộc của đề bài thực hành.
            </p>
          </div>
          <div className="space-y-2">
            <h5 className="font-bold text-slate-700 flex items-center gap-1.5">
              <HeartHandshake className="w-4 h-4 text-rose-500" />
              Trực quan hóa giáo dục
            </h5>
            <p className="leading-relaxed">
              Viết hoàn toàn bằng TypeScript và React 19 hiệu năng cao, theo dõi quá trình hội tụ từng thế hệ với console log chi tiết.
            </p>
          </div>
        </footer>

        <div className="text-center text-[10px] text-slate-400 font-mono pt-4">
          Mô phỏng Tiến Hóa Giải Thuật Di Truyền © 2026. Made with Google AI Studio.
        </div>
      </div>
    </div>
  );
}
