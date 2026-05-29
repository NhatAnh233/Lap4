/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from "react";
import { Play, Pause, RotateCcw, Terminal } from "lucide-react";

const CITIES = [
  { id: 0, name: "Hà Nội",    short: "HN", x: 20, y: 40 },
  { id: 1, name: "Hạ Long",   short: "HL", x: 35, y: 38 },
  { id: 2, name: "Sapa",      short: "SP", x:  5, y: 55 },
  { id: 3, name: "Ninh Bình", short: "NB", x: 18, y: 32 },
  { id: 4, name: "Phong Nha", short: "PN", x: 25, y: 10 },
  { id: 5, name: "Huế",       short: "HU", x: 32, y:  5 },
  { id: 6, name: "Đà Nẵng",   short: "DN", x: 38, y:  2 },
  { id: 7, name: "Mai Châu",  short: "MC", x: 10, y: 38 },
  { id: 8, name: "Cát Bà",    short: "CB", x: 33, y: 35 },
  { id: 9, name: "Hà Giang",  short: "HG", x: 12, y: 58 },
];

const POP_SIZE = 100;
const MAX_GEN = 500;
const CROSSOVER_RATE = 0.8;
const MUTATION_RATE = 0.05;
const TOURNAMENT_K = 5;

function euclidean(a: number, b: number) {
  const dx = CITIES[a].x - CITIES[b].x;
  const dy = CITIES[a].y - CITIES[b].y;
  return Math.sqrt(dx * dx + dy * dy);
}

function calcTotal(route: number[]) {
  let d = 0;
  for (let i = 0; i < route.length - 1; i++) d += euclidean(route[i], route[i + 1]);
  d += euclidean(route[route.length - 1], route[0]);
  return d;
}

function randomChromosome(): number[] {
  const inner = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  for (let i = inner.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [inner[i], inner[j]] = [inner[j], inner[i]];
  }
  return [0, ...inner];
}

function tournamentSelect(pop: number[][]): number[] {
  let best = pop[Math.floor(Math.random() * pop.length)];
  let bestF = 1 / calcTotal(best);
  for (let i = 1; i < TOURNAMENT_K; i++) {
    const ind = pop[Math.floor(Math.random() * pop.length)];
    const f = 1 / calcTotal(ind);
    if (f > bestF) { bestF = f; best = ind; }
  }
  return best;
}

function oxCrossover(p1: number[], p2: number[]): number[] {
  const len = 9;
  const a = 1 + Math.floor(Math.random() * len);
  const b = 1 + Math.floor(Math.random() * len);
  const [lo, hi] = a < b ? [a, b] : [b, a];
  const child = new Array(10).fill(-1);
  child[0] = 0;
  for (let i = lo; i <= hi; i++) child[i] = p1[i];
  let pos = (hi + 1) % 10;
  if (pos === 0) pos = 1;
  for (let i = 0; i < 10; i++) {
    const gene = p2[(hi + 1 + i) % 10];
    if (gene === 0 || child.includes(gene)) continue;
    while (child[pos] !== -1) { pos = (pos % 9) + 1; }
    child[pos] = gene;
    pos = (pos % 9) + 1;
  }
  return child;
}

function swapMutation(route: number[]): number[] {
  const r = [...route];
  const i = 1 + Math.floor(Math.random() * 9);
  const j = 1 + Math.floor(Math.random() * 9);
  [r[i], r[j]] = [r[j], r[i]];
  return r;
}

interface LogEntry {
  type: "info" | "gen" | "route" | "dist" | "final" | "sep";
  text: string;
}

export default function TspBaiTap() {
  const [running, setRunning] = useState(false);
  const [generation, setGeneration] = useState(0);
  const [bestDist, setBestDist] = useState<number | null>(null);
  const [initDist, setInitDist] = useState<number | null>(null);
  const [bestRoute, setBestRoute] = useState<number[] | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([
    { type: "info", text: "▸ Nhấn \"Chạy GA\" để bắt đầu thuật toán..." },
  ]);

  const runningRef = useRef(false);
  const popRef = useRef<number[][]>([]);
  const bestRouteRef = useRef<number[] | null>(null);
  const bestDistRef = useRef(Infinity);
  const genRef = useRef(0);
  const loopRef = useRef<number | null>(null);
  const initDistRef = useRef<number | null>(null);
  const logRef = useRef<LogEntry[]>([]);
  const consoleEl = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => { if (loopRef.current) cancelAnimationFrame(loopRef.current); };
  }, []);

  useEffect(() => {
    if (consoleEl.current) consoleEl.current.scrollTop = consoleEl.current.scrollHeight;
  }, [logs]);

  const addLog = (entry: LogEntry) => {
    logRef.current = [...logRef.current, entry];
    setLogs([...logRef.current]);
  };

  const reset = () => {
    runningRef.current = false;
    if (loopRef.current) cancelAnimationFrame(loopRef.current);
    setRunning(false);
    setGeneration(0);
    setBestDist(null);
    setInitDist(null);
    setBestRoute(null);
    popRef.current = [];
    bestDistRef.current = Infinity;
    bestRouteRef.current = null;
    genRef.current = 0;
    initDistRef.current = null;
    logRef.current = [{ type: "info", text: "▸ Nhấn \"Chạy GA\" để bắt đầu..." }];
    setLogs([...logRef.current]);
  };

  const startGA = () => {
    runningRef.current = true;
    setRunning(true);
    genRef.current = 0;
    bestDistRef.current = Infinity;
    initDistRef.current = null;
    logRef.current = [];
    setLogs([]);

    const sep = "═".repeat(52);
    addLog({ type: "sep", text: sep });
    addLog({ type: "info", text: "▸ Khởi tạo quần thể: 100 cá thể ngẫu nhiên" });
    addLog({ type: "info", text: "▸ Selection: Tournament (k=5) | Crossover: OX (0.8)" });
    addLog({ type: "info", text: "▸ Mutation: Swap (0.05) | Điều kiện dừng: 500 thế hệ" });
    addLog({ type: "sep", text: sep });

    popRef.current = Array.from({ length: POP_SIZE }, randomChromosome);

    const CHUNK = 5;

    const step = () => {
      if (!runningRef.current) return;

      for (let c = 0; c < CHUNK && genRef.current < MAX_GEN; c++) {
        genRef.current++;

        // Evaluate
        let genBest = popRef.current[0];
        let genBestD = calcTotal(genBest);
        for (const ind of popRef.current) {
          const d = calcTotal(ind);
          if (d < genBestD) { genBestD = d; genBest = ind; }
        }
        if (genBestD < bestDistRef.current) {
          bestDistRef.current = genBestD;
          bestRouteRef.current = genBest;
        }
        if (genRef.current === 1) {
          initDistRef.current = genBestD;
          setInitDist(genBestD);
        }

        // Log
        const gen = genRef.current;
        if (gen === 1) {
          addLog({ type: "gen", text: `► Thế hệ 1` });
          addLog({ type: "route", text: `  Lộ trình: ${genBest.map(i => CITIES[i].short).join("→")}→HN` });
          addLog({ type: "dist", text: `  Tổng quãng đường: ${genBestD.toFixed(4)}` });
        } else if (gen % 50 === 0) {
          addLog({ type: "gen", text: `── Thế hệ ${gen}` });
          addLog({ type: "route", text: `  Best: ${bestRouteRef.current!.map(i => CITIES[i].short).join("→")}→HN` });
          addLog({ type: "dist", text: `  Khoảng cách: ${bestDistRef.current.toFixed(4)}` });
        }

        // Evolve
        const newPop: number[][] = [];
        newPop.push([...bestRouteRef.current!]); // elitism
        while (newPop.length < POP_SIZE) {
          const p1 = tournamentSelect(popRef.current);
          const p2 = tournamentSelect(popRef.current);
          let child = Math.random() < CROSSOVER_RATE ? oxCrossover(p1, p2) : [...p1];
          if (Math.random() < MUTATION_RATE) child = swapMutation(child);
          newPop.push(child);
        }
        popRef.current = newPop;
      }

      setGeneration(genRef.current);
      setBestDist(bestDistRef.current);
      setBestRoute(bestRouteRef.current ? [...bestRouteRef.current] : null);

      if (genRef.current >= MAX_GEN) {
        const sep = "═".repeat(52);
        addLog({ type: "sep", text: sep });
        addLog({ type: "final", text: "✦ KẾT QUẢ TỐI ƯU CUỐI CÙNG (Thế hệ 500)" });
        const routeNames = bestRouteRef.current!.map(i => CITIES[i].name).join(" → ");
        addLog({ type: "final", text: `  ${routeNames} → Hà Nội` });
        addLog({ type: "final", text: `  Tổng quãng đường: ${bestDistRef.current.toFixed(4)} đơn vị` });
        addLog({ type: "sep", text: sep });
        runningRef.current = false;
        setRunning(false);
        return;
      }

      loopRef.current = requestAnimationFrame(step);
    };

    loopRef.current = requestAnimationFrame(step);
  };

  const handlePause = () => {
    runningRef.current = false;
    if (loopRef.current) cancelAnimationFrame(loopRef.current);
    setRunning(false);
  };

  const handleResume = () => {
    if (genRef.current >= MAX_GEN) return;
    runningRef.current = true;
    setRunning(true);
    const CHUNK = 5;
    const step = () => {
      if (!runningRef.current) return;
      for (let c = 0; c < CHUNK && genRef.current < MAX_GEN; c++) {
        genRef.current++;
        let genBest = popRef.current[0], genBestD = calcTotal(genBest);
        for (const ind of popRef.current) {
          const d = calcTotal(ind);
          if (d < genBestD) { genBestD = d; genBest = ind; }
        }
        if (genBestD < bestDistRef.current) { bestDistRef.current = genBestD; bestRouteRef.current = genBest; }
        const gen = genRef.current;
        if (gen % 50 === 0) {
          addLog({ type: "gen", text: `── Thế hệ ${gen}` });
          addLog({ type: "route", text: `  Best: ${bestRouteRef.current!.map(i => CITIES[i].short).join("→")}→HN` });
          addLog({ type: "dist", text: `  Khoảng cách: ${bestDistRef.current.toFixed(4)}` });
        }
        const newPop: number[][] = [];
        newPop.push([...bestRouteRef.current!]);
        while (newPop.length < POP_SIZE) {
          const p1 = tournamentSelect(popRef.current), p2 = tournamentSelect(popRef.current);
          let child = Math.random() < CROSSOVER_RATE ? oxCrossover(p1, p2) : [...p1];
          if (Math.random() < MUTATION_RATE) child = swapMutation(child);
          newPop.push(child);
        }
        popRef.current = newPop;
      }
      setGeneration(genRef.current);
      setBestDist(bestDistRef.current);
      setBestRoute(bestRouteRef.current ? [...bestRouteRef.current] : null);
      if (genRef.current >= MAX_GEN) {
        const sep = "═".repeat(52);
        addLog({ type: "sep", text: sep });
        addLog({ type: "final", text: "✦ KẾT QUẢ TỐI ƯU CUỐI CÙNG (Thế hệ 500)" });
        addLog({ type: "final", text: `  ${bestRouteRef.current!.map(i => CITIES[i].name).join(" → ")} → Hà Nội` });
        addLog({ type: "final", text: `  Tổng quãng đường: ${bestDistRef.current.toFixed(4)} đơn vị` });
        addLog({ type: "sep", text: sep });
        runningRef.current = false; setRunning(false); return;
      }
      loopRef.current = requestAnimationFrame(step);
    };
    loopRef.current = requestAnimationFrame(step);
  };

  const progress = (generation / MAX_GEN) * 100;
  const improvement = initDist && bestDist ? ((initDist - bestDist) / initDist * 100) : null;

  // Map drawing: convert city coords (0-43 range) to SVG viewBox
  const toSVG = (x: number, y: number, W = 400, H = 300) => {
    const minX = 5, maxX = 38, minY = 2, maxY = 58;
    const pad = 30;
    return {
      sx: pad + ((x - minX) / (maxX - minX)) * (W - pad * 2),
      sy: H - pad - ((y - minY) / (maxY - minY)) * (H - pad * 2),
    };
  };

  const logColors: Record<string, string> = {
    info: "text-slate-400",
    gen: "text-indigo-500 dark:text-indigo-400 font-semibold",
    route: "text-slate-600 dark:text-slate-300",
    dist: "text-emerald-600 dark:text-emerald-400",
    final: "text-amber-600 dark:text-amber-400 font-bold",
    sep: "text-slate-300 dark:text-slate-700 select-none",
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="baitap-simulator">
      {/* Left: params + controls */}
      <div className="lg:col-span-4 space-y-5">
        {/* Fixed params */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
            Tham số cố định (đề bài)
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              ["Quần thể", "100"],
              ["Thế hệ", "500"],
              ["P(Crossover)", "0.8"],
              ["P(Mutation)", "0.05"],
              ["Tournament k", "5"],
              ["Crossover", "OX"],
            ].map(([k, v]) => (
              <div key={k} className="bg-slate-50 dark:bg-slate-950/50 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
                <p className="text-xxs text-slate-400 uppercase tracking-wide">{k}</p>
                <p className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm mt-0.5">{v}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-3 text-center shadow-2xs">
            <p className="font-mono font-bold text-lg text-emerald-600 dark:text-emerald-400">
              {bestDist ? bestDist.toFixed(1) : "—"}
            </p>
            <p className="text-xxs text-slate-400 mt-0.5">Best (km)</p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-3 text-center shadow-2xs">
            <p className="font-mono font-bold text-lg text-indigo-600 dark:text-indigo-400">{generation}</p>
            <p className="text-xxs text-slate-400 mt-0.5">Thế hệ</p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-3 text-center shadow-2xs">
            <p className="font-mono font-bold text-lg text-amber-500">
              {improvement ? improvement.toFixed(1) + "%" : "—"}
            </p>
            <p className="text-xxs text-slate-400 mt-0.5">Cải thiện</p>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 rounded-2xl transition text-slate-600 dark:text-slate-200"
            title="Reset"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          {generation === 0 ? (
            <button
              onClick={startGA}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl transition flex items-center gap-2 font-bold shadow-md shadow-indigo-500/15 text-sm"
            >
              <Play className="w-5 h-5 fill-current" />
              Chạy GA
            </button>
          ) : running ? (
            <button
              onClick={handlePause}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl transition flex items-center gap-2 font-bold text-sm"
            >
              <Pause className="w-5 h-5 fill-current" />
              Tạm dừng
            </button>
          ) : generation < MAX_GEN ? (
            <button
              onClick={handleResume}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl transition flex items-center gap-2 font-bold text-sm"
            >
              <Play className="w-5 h-5 fill-current" />
              Tiếp tục
            </button>
          ) : (
            <button
              onClick={reset}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl transition flex items-center gap-2 font-bold text-sm"
            >
              <RotateCcw className="w-5 h-5" />
              Chạy lại
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-2xs">
          <div className="flex justify-between text-xs text-slate-500 mb-2">
            <span>Tiến độ</span>
            <span className="font-mono">{generation} / {MAX_GEN}</span>
          </div>
          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Right: map + console */}
      <div className="lg:col-span-8 space-y-5">
        {/* Map */}
        <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden relative">
          <div className="absolute top-3 left-3 z-10 flex gap-2">
            <span className="px-2.5 py-1 bg-slate-900/95 border border-slate-800 rounded-lg text-xxs font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${running ? "bg-emerald-500 animate-ping" : generation >= MAX_GEN ? "bg-amber-500" : "bg-slate-600"}`} />
              {running ? "ĐANG TÌM ĐƯỜNG TỐI ƯU" : generation >= MAX_GEN ? "HOÀN TẤT" : generation === 0 ? "SẴN SÀNG" : "TẠM DỪNG"}
            </span>
          </div>

          <svg viewBox="0 0 400 300" className="w-full" style={{ minHeight: 240 }}>
            <defs>
              <pattern id="btgrid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(51,65,85,0.12)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="400" height="300" fill="#080b12" />
            <rect width="400" height="300" fill="url(#btgrid)" />

            {/* Route lines */}
            {bestRoute && bestRoute.length > 0 && (() => {
              const full = [...bestRoute, bestRoute[0]];
              return full.slice(0, -1).map((id, idx) => {
                const a = toSVG(CITIES[id].x, CITIES[id].y);
                const b = toSVG(CITIES[full[idx + 1]].x, CITIES[full[idx + 1]].y);
                return (
                  <line
                    key={`l${idx}`}
                    x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy}
                    stroke="#f5a623" strokeWidth="1.5" opacity="0.6" strokeLinecap="round"
                  />
                );
              });
            })()}

            {/* Cities */}
            {CITIES.map((city) => {
              const { sx, sy } = toSVG(city.x, city.y);
              const isHome = city.id === 0;
              const routePos = bestRoute ? bestRoute.indexOf(city.id) : -1;
              return (
                <g key={city.id}>
                  <circle cx={sx} cy={sy} r={isHome ? 12 : 8} fill="transparent"
                    stroke={isHome ? "rgba(61,214,140,0.25)" : "rgba(79,142,247,0.2)"} strokeWidth="2.5" />
                  <circle cx={sx} cy={sy} r={isHome ? 6 : 4}
                    fill={isHome ? "#3dd68c" : "#4f8ef7"} stroke="#080b12" strokeWidth="1.5" />
                  {routePos >= 0 && (
                    <text x={sx} y={sy + 1} textAnchor="middle" dominantBaseline="middle"
                      fill="#080b12" fontSize="7" fontWeight="bold">
                      {routePos === 0 ? "★" : routePos}
                    </text>
                  )}
                  <text x={sx} y={sy - (isHome ? 10 : 8)} textAnchor="middle"
                    fill={isHome ? "#3dd68c" : "#94a3b8"} fontSize="9" fontWeight="500">
                    {city.name}
                  </text>
                </g>
              );
            })}
          </svg>

          {bestRoute && (
            <div className="px-4 py-3 border-t border-slate-800 flex flex-wrap gap-1.5 bg-slate-900/60">
              {bestRoute.map((id, i) => (
                <span key={i} className={`px-2 py-0.5 rounded-full text-xxs font-bold font-mono ${id === 0 ? "bg-emerald-900/60 text-emerald-400 border border-emerald-700/50" : "bg-slate-800 text-slate-300 border border-slate-700/40"}`}>
                  {CITIES[id].short}
                </span>
              ))}
              <span className="px-2 py-0.5 rounded-full text-xxs font-bold font-mono bg-emerald-900/60 text-emerald-400 border border-emerald-700/50">HN</span>
            </div>
          )}
        </div>

        {/* Console */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-950/30">
            <Terminal className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Console Output</span>
            <span className={`w-2 h-2 rounded-full ml-auto ${running ? "bg-emerald-500 animate-pulse" : "bg-slate-300 dark:bg-slate-600"}`} />
          </div>
          <div
            ref={consoleEl}
            className="h-52 overflow-y-auto p-4 font-mono text-xs leading-relaxed bg-slate-50/30 dark:bg-slate-950/20 space-y-0.5"
          >
            {logs.map((log, i) => (
              <div key={i} className={logColors[log.type] || "text-slate-500"}>
                {log.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
