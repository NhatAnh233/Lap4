/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { 
  Play, 
  Pause, 
  SkipForward, 
  RotateCcw, 
  Settings, 
  Sparkles, 
  Award, 
  Users, 
  Percent, 
  Hash, 
  Smile, 
  Activity 
} from "lucide-react";
import { MonkeyIndividual, MonkeyConfig, MonkeyHistoryPoint, SimulationStatus } from "../types";
import { 
  initializeMonkeyPopulation, 
  evolveMonkeyGeneration, 
  calcMonkeyFitness 
} from "../utils/gaMonkey";

export default function MonkeySimulator() {
  // Config state
  const [config, setConfig] = useState<MonkeyConfig>({
    target: "MÔ PHỎNG GIẢI THUẬT DI TRUYỀN",
    populationSize: 200,
    mutationRate: 0.01, // 1%
    selectionMethod: "tournament",
  });

  // State
  const [status, setStatus] = useState<SimulationStatus>("idle");
  const [generation, setGeneration] = useState<number>(0);
  const [bestIndividual, setBestIndividual] = useState<MonkeyIndividual | null>(null);
  const [averageFitness, setAverageFitness] = useState<number>(0);
  const [history, setHistory] = useState<MonkeyHistoryPoint[]>([]);
  const [displayPopulation, setDisplayPopulation] = useState<MonkeyIndividual[]>([]);
  const [simSpeed, setSimSpeed] = useState<number>(50); // Delay between generation steps in ms (0 = fastest)

  // Web Worker or animation loop refs to keep ticks steady and fast without React lag
  const isRunningRef = useRef<boolean>(false);
  const populationRef = useRef<MonkeyIndividual[]>([]);
  const generationRef = useRef<number>(0);
  const historyRef = useRef<MonkeyHistoryPoint[]>([]);
  const lastTickRef = useRef<number>(0);
  const loopHandleRef = useRef<number | null>(null);

  // Synchronize configs with refs when they change at idle
  useEffect(() => {
    if (status === "idle") {
      resetSimulation();
    }
  }, [config.target, config.populationSize]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelLoop();
    };
  }, []);

  const cancelLoop = () => {
    isRunningRef.current = false;
    if (loopHandleRef.current) {
      cancelAnimationFrame(loopHandleRef.current);
      loopHandleRef.current = null;
    }
  };

  const resetSimulation = () => {
    cancelLoop();
    setStatus("idle");
    
    // Seed initial population
    const targetString = config.target.trim() || "HELLO";
    const pop = initializeMonkeyPopulation(targetString, config.populationSize);
    
    // Calculate best
    const sorted = [...pop].sort((a, b) => b.fitness - a.fitness);
    const best = sorted[0];

    let totalFitness = 0;
    for (const ind of pop) {
      totalFitness += ind.fitness;
    }
    const avg = totalFitness / pop.length;

    populationRef.current = pop;
    generationRef.current = 0;
    historyRef.current = [
      {
        generation: 0,
        bestFitness: best.fitness,
        averageFitness: avg,
        bestText: best.genes,
      }
    ];

    setGeneration(0);
    setBestIndividual(best);
    setAverageFitness(avg);
    setHistory(historyRef.current);
    setDisplayPopulation(pop.slice(0, 15)); // show first few on screen
  };

  const handleStep = () => {
    if (status === "completed") return;
    if (status === "running") {
      handlePause();
      return;
    }
    
    setStatus("paused");
    runSingleGenerationStep();
  };

  const runSingleGenerationStep = () => {
    const targetString = config.target.trim() || "HELLO";
    
    const { newPopulation, bestIndividual, averageFitness: avg } = evolveMonkeyGeneration(
      populationRef.current,
      targetString,
      config
    );

    populationRef.current = newPopulation;
    generationRef.current += 1;

    const newHistoryPoint: MonkeyHistoryPoint = {
      generation: generationRef.current,
      bestFitness: bestIndividual.fitness,
      averageFitness: avg,
      bestText: bestIndividual.genes,
    };

    // Keep history manageable
    let updatedHistory = [...historyRef.current, newHistoryPoint];
    if (updatedHistory.length > 500) {
      // Downsample history slightly to avoid massive arrays in long runs
      updatedHistory = updatedHistory.filter((_, idx) => idx % 2 === 0 || idx === updatedHistory.length - 1);
    }
    historyRef.current = updatedHistory;

    // React state updates
    setGeneration(generationRef.current);
    setBestIndividual(bestIndividual);
    setAverageFitness(avg);
    setHistory(historyRef.current);
    
    // Sort slightly to show best performing individuals in the visualization list
    const sortedToDisplay = [...newPopulation].sort((a, b) => b.fitness - a.fitness);
    setDisplayPopulation(sortedToDisplay.slice(0, 18));

    // Check terminal condition
    if (bestIndividual.fitness >= 1.0 || bestIndividual.genes === targetString) {
      setStatus("completed");
      cancelLoop();
      return true; // flag finished
    }
    return false;
  };

  const handleStart = () => {
    if (status === "completed") {
      resetSimulation();
    }
    
    setStatus("running");
    isRunningRef.current = true;
    lastTickRef.current = performance.now();
    
    const loop = (time: number) => {
      if (!isRunningRef.current) return;

      const elapsed = time - lastTickRef.current;
      const delay = simSpeed; // millisecond delay

      if (elapsed >= delay) {
        lastTickRef.current = time;
        const isDone = runSingleGenerationStep();
        if (isDone) return;
      }

      loopHandleRef.current = requestAnimationFrame(loop);
    };

    loopHandleRef.current = requestAnimationFrame(loop);
  };

  const handlePause = () => {
    setStatus("paused");
    cancelLoop();
  };

  // Generate highlight elements for matching characters
  const renderHighlightedString = (genes: string) => {
    const targetString = config.target;
    return (
      <span className="font-mono tracking-wider break-all text-xs md:text-sm">
        {genes.split("").map((char, index) => {
          const isMatch = char === targetString[index];
          return (
            <span 
              key={index} 
              className={isMatch 
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold border-b border-emerald-500" 
                : "text-slate-450 dark:text-slate-500 font-normal"
              }
            >
              {char}
            </span>
          );
        })}
      </span>
    );
  };

  // Helper values for drawing SVG charts
  const maxGenInHistory = history.length > 0 ? Math.max(...history.map(h => h.generation)) : 10;
  const paddingX = 40;
  const paddingY = 30;
  const svgWidth = 500;
  const svgHeight = 200;

  const getSvgCoordinates = (point: MonkeyHistoryPoint) => {
    const x = paddingX + (point.generation / Math.max(1, maxGenInHistory)) * (svgWidth - paddingX * 2);
    // Fitness is 0-1, map 100% to top, 0% to bottom
    const y = svgHeight - paddingY - (point.bestFitness * (svgHeight - paddingY * 2));
    const avgY = svgHeight - paddingY - (point.averageFitness * (svgHeight - paddingY * 2));
    return { x, y, avgY };
  };

  // Build points path
  let bestLinePath = "";
  let avgLinePath = "";
  if (history.length > 1) {
    history.forEach((point, idx) => {
      const { x, y, avgY } = getSvgCoordinates(point);
      if (idx === 0) {
        bestLinePath += `M ${x} ${y}`;
        avgLinePath += `M ${x} ${avgY}`;
      } else {
        bestLinePath += ` L ${x} ${y}`;
        avgLinePath += ` L ${x} ${avgY}`;
      }
    });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="monkey-simulator">
      {/* Configuration column */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
            <Settings className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-slate-800 dark:text-white">Cấu hình tham số</h3>
          </div>

          <div className="p-4 bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl border border-slate-100 dark:border-slate-850 mt-4 text-xs text-slate-505 leading-relaxed">
            <Smile className="w-4 h-4 inline-block mr-1 text-yellow-500" />
            Hệ hỗ trợ viết chữ tiếng Việt hoa, thường, số và dấu cơ bản. Hãy thử chuỗi chữ yêu thích của bạn!
          </div>

          <div className="space-y-5 mt-5">
            {/* Target Phrase Input */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                Chuỗi ký tự đích (Mục tiêu)
              </label>
              <input
                id="input-target-string"
                type="text"
                maxLength={45}
                disabled={status === "running" || status === "paused"}
                value={config.target}
                onChange={(e) => setConfig({ ...config, target: e.target.value.toUpperCase() })}
                placeholder="NHẬP CHUỖI CẦN GÕ..."
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-505 disabled:opacity-50 font-bold dark:text-slate-100"
              />
            </div>

            {/* Population size slider */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Kích thước quần thể
                </label>
                <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded">
                  {config.populationSize}
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="1000"
                step="25"
                disabled={status === "running" || status === "paused"}
                value={config.populationSize}
                onChange={(e) => setConfig({ ...config, populationSize: parseInt(e.target.value) })}
                className="w-full accent-indigo-505 h-1.5 bg-slate-150 rounded"
              />
            </div>

            {/* Mutation rate slider */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Tỉ lệ đột biến gen
                </label>
                <span className="text-xs font-mono font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded">
                  {(config.mutationRate * 100).toFixed(1)}%
                </span>
              </div>
              <input
                type="range"
                min="0.001"
                max="0.15"
                step="0.001"
                disabled={status === "running" || status === "paused"}
                value={config.mutationRate}
                onChange={(e) => setConfig({ ...config, mutationRate: parseFloat(e.target.value) })}
                className="w-full accent-rose-505 h-1.5 bg-slate-150 rounded"
              />
            </div>

            {/* Selection Strategy */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                Cơ chế Chọn lọc tự nhiên
              </label>
              <select
                disabled={status === "running" || status === "paused"}
                value={config.selectionMethod}
                onChange={(e) => setConfig({ ...config, selectionMethod: e.target.value as any })}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-550 focus:border-indigo-500 text-slate-700 dark:text-slate-350"
              >
                <option value="tournament">Đấu loại (Tournament Selection)</option>
                <option value="roulette">Vòng xoay Roulette (Roulette Selection)</option>
                <option value="elitism">Chỉ chọn đội Tinh hoa (Elitism Selection)</option>
              </select>
            </div>

            {/* Simulation Speed */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-slate-400" />
                  Trễ mô phỏng thế hệ
                </label>
                <span className="text-xs font-mono font-bold text-slate-600">
                  {simSpeed === 0 ? "Nhanh nhất (0ms)" : `${simSpeed} ms`}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="300"
                step="10"
                value={simSpeed}
                onChange={(e) => setSimSpeed(parseInt(e.target.value))}
                className="w-full accent-indigo-555 h-1.5 bg-slate-150 rounded"
              />
            </div>
          </div>
        </div>

        {/* Playback Controls Box */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex items-center justify-center gap-3">
          <button
            onClick={resetSimulation}
            className="p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 hover:text-slate-800 dark:text-slate-100 rounded-2xl transition duration-200 flex items-center justify-center text-slate-600"
            title="Đặt lại mô phỏng"
            id="btn-monkey-reset"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          {status === "running" ? (
            <button
              onClick={handlePause}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl transition duration-200 flex items-center gap-2 font-bold shadow-md shadow-amber-500/10 shrink-0 text-sm"
              id="btn-monkey-pause"
            >
              <Pause className="w-5 h-5 fill-current" />
              Tạm dừng
            </button>
          ) : (
            <button
              onClick={handleStart}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl transition duration-200 flex items-center gap-2 font-bold shadow-md shadow-indigo-550/15 shrink-0 text-sm"
              id="btn-monkey-start"
            >
              <Play className="w-5 h-5 fill-current" />
              {status === "completed" ? "Chạy lại" : "Bắt đầu"}
            </button>
          )}

          <button
            onClick={handleStep}
            disabled={status === "running" || status === "completed"}
            className="p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 disabled:opacity-40 rounded-2xl transition duration-200 flex items-center justify-center text-slate-600 dark:text-slate-100"
            title="Tiến hành 1 thế hệ"
            id="btn-monkey-step"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Simulator dashboard visualization */}
      <div className="lg:col-span-8 space-y-6">
        {/* Real-time stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3 shadow-2xs">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
              <Hash className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xxs font-bold text-slate-400 uppercase tracking-widest leading-none">Thế hệ</p>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-1 font-mono">{generation}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3 shadow-2xs">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xxs font-bold text-slate-400 uppercase tracking-widest leading-none">Best Fitness</p>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-1 font-mono">
                {bestIndividual ? `${(bestIndividual.fitness * 100).toFixed(1)}%` : "0%"}
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3 shadow-2xs">
            <div className="p-2.5 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xxs font-bold text-slate-400 uppercase tracking-widest leading-none">Average Fit</p>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-1 font-mono">
                {(averageFitness * 100).toFixed(1)}%
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3 shadow-2xs">
            <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-450 rounded-xl">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xxs font-bold text-slate-400 uppercase tracking-widest leading-none">Trạng thái</p>
              <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200 mt-1.5 flex items-center gap-1 font-sans">
                {status === "idle" && <span className="text-slate-500">Chờ lệnh</span>}
                {status === "running" && <span className="text-indigo-650 animate-pulse">● Đang tiến hóa</span>}
                {status === "paused" && <span className="text-amber-500">Tạm dừng</span>}
                {status === "completed" && <span className="text-emerald-500">Hoàn tất! ✨</span>}
              </p>
            </div>
          </div>
        </div>

        {/* Target vs Best Candidate display */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div>
            <span className="text-xxs font-bold text-slate-400 uppercase tracking-wider block mb-1">Cụm từ mục tiêu</span>
            <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 font-mono text-sm md:text-base font-black tracking-widest text-slate-800 dark:text-slate-100">
              {config.target}
            </div>
          </div>

          <div>
            <span className="text-xxs font-bold text-slate-400 uppercase tracking-wider block mb-1">Cá thể thích nghi tốt nhất hiện tại (Chuỗi gen)</span>
            <div className="bg-indigo-50/40 dark:bg-indigo-950/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 flex flex-col items-start gap-1">
              <div className="w-full flex justify-between items-center text-xxs font-sans text-indigo-500 font-bold">
                <span>NST Ưu tú nhất</span>
                <span className="bg-indigo-100 dark:bg-indigo-900/60 font-mono px-2 py-0.5 rounded-full">
                  Fit: {bestIndividual ? (bestIndividual.fitness * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="text-slate-850 dark:text-slate-50 mt-1 select-all break-all selection:bg-indigo-200">
                {bestIndividual ? renderHighlightedString(bestIndividual.genes) : <span className="text-slate-400 italic">Chưa chạy</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Visualise current live population & chart split */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Evolving candidates list */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
            <h4 className="font-bold text-sm text-slate-800 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800 flex justify-between">
              <span>Một số cá thể nổi bật khác</span>
              <span className="text-xs text-slate-400 font-normal">Hiển thị {displayPopulation.length} mẫu</span>
            </h4>
            <div className="max-h-[220px] overflow-y-auto space-y-1.5 pr-1 md:text-xs">
              {displayPopulation.map((ind, i) => (
                <div 
                  key={ind.id} 
                  className={`px-3 py-1.5 rounded-xl flex items-center justify-between text-xs font-mono bg-slate-50 dark:bg-slate-950/40 border border-slate-150/40 dark:border-slate-850 ${
                    i === 0 ? "border-amber-400 dark:bg-amber-955/10 bg-amber-50/20" : ""
                  }`}
                >
                  <div className="truncate flex-1 pr-4">
                    <span className="text-xxs text-slate-400 mr-2 shrink-0 select-none">#{i+1}</span>
                    {renderHighlightedString(ind.genes)}
                  </div>
                  <span className={`text-xxs shrink-0 font-bold px-1.5 py-0.5 rounded-full ${
                    i === 0 ? "bg-amber-100 text-amber-800" : "bg-slate-200/50 dark:bg-slate-800 text-slate-500"
                  }`}>
                    {(ind.fitness * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Fitness Evolution Chart */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
            <h4 className="font-bold text-sm text-slate-800 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
              Biểu đồ độ thích nghi qua các thế hệ (%)
            </h4>
            
            <div className="h-[180px] w-full flex items-center justify-center relative mt-2 shrink-0">
              {history.length > 1 ? (
                <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
                  {/* Grid Lines */}
                  <line x1={paddingX} y1={paddingY} x2={svgWidth - paddingX} y2={paddingY} stroke="#e2e8f0" strokeDasharray="3,3" className="stroke-slate-200 dark:stroke-slate-800" />
                  <line x1={paddingX} y1={(svgHeight - paddingY * 2) / 2 + paddingY} x2={svgWidth - paddingX} y2={(svgHeight - paddingY * 2) / 2 + paddingY} stroke="#e2e8f0" strokeDasharray="3,3" className="stroke-slate-200 dark:stroke-slate-800" />
                  <line x1={paddingX} y1={svgHeight - paddingY} x2={svgWidth - paddingX} y2={svgHeight - paddingY} stroke="#cbd5e1" className="stroke-slate-350 dark:stroke-slate-700" />
                  <line x1={paddingX} y1={paddingY} x2={paddingX} y2={svgHeight - paddingY} stroke="#cbd5e1" className="stroke-slate-350 dark:stroke-slate-700" />

                  {/* Left Y Axis Labels */}
                  <text x={paddingX - 10} y={paddingY + 4} textAnchor="end" className="fill-slate-400 font-mono text-[9px]">100%</text>
                  <text x={paddingX - 10} y={(svgHeight - paddingY * 2) / 2 + paddingY + 4} textAnchor="end" className="fill-slate-400 font-mono text-[9px]">50%</text>
                  <text x={paddingX - 10} y={svgHeight - paddingY + 4} textAnchor="end" className="fill-slate-400 font-mono text-[9px]">0%</text>

                  {/* Bottom X Axis Labels (Generations) */}
                  <text x={paddingX} y={svgHeight - 10} textAnchor="start" className="fill-slate-400 font-mono text-[9px]">Gen 0</text>
                  <text x={svgWidth - paddingX} y={svgHeight - 10} textAnchor="end" className="fill-slate-400 font-mono text-[9px]">Gen {generation}</text>

                  {/* Best Individual Fitness Line (Solid Indigo) */}
                  <path d={bestLinePath} fill="none" strokeWidth="2.5" strokeLinecap="round" className="stroke-indigo-600 dark:stroke-indigo-400" />

                  {/* Average Fitness Line (Dashed Emerald) */}
                  <path d={avgLinePath} fill="none" strokeWidth="1.5" strokeDasharray="4,3" strokeLinecap="round" className="stroke-emerald-500" />
                </svg>
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400 text-xs">
                  <Smile className="w-10 h-10 mb-2 opacity-50" />
                  <p>Nhấp Bắt đầu để vẽ biểu đồ tiến hóa</p>
                </div>
              )}
            </div>

            <div className="flex justify-center gap-6 mt-2 text-xxs font-sans font-bold">
              <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                <span className="w-3 h-0.5 bg-indigo-600 dark:bg-indigo-400 inline-block rounded"></span>
                <span>Thích nghi tốt nhất (Best Fitness)</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <span className="w-3 h-0.5 border-t border-dashed border-emerald-500 inline-block"></span>
                <span>Thích nghi trung bình (Average)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
