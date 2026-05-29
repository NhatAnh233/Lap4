/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { 
  Play, 
  Pause, 
  SkipForward, 
  RotateCcw, 
  MapPin, 
  Users, 
  Percent, 
  Hash, 
  HelpCircle, 
  Plus, 
  Settings, 
  Milestone, 
  Navigation,
  Compass
} from "lucide-react";
import { City, TspIndividual, TspConfig, TspHistoryPoint, SimulationStatus } from "../types";
import { 
  generateRandomCities, 
  initializeTspPopulation, 
  evolveTspGeneration, 
  getPathDistance,
  VIET_CITIES 
} from "../utils/gaTsp";

export default function TspSimulator() {
  // Config state
  const [config, setConfig] = useState<TspConfig>({
    cityCount: 15,
    populationSize: 150,
    mutationRate: 0.05, // 5% mutation rate
    crossoverRate: 0.90,
    elitismCount: 3,
  });

  // Simulator state
  const [cities, setCities] = useState<City[]>([]);
  const [status, setStatus] = useState<SimulationStatus>("idle");
  const [generation, setGeneration] = useState<number>(0);
  const [bestIndividual, setBestIndividual] = useState<TspIndividual | null>(null);
  const [averageDistance, setAverageDistance] = useState<number>(0);
  const [history, setHistory] = useState<TspHistoryPoint[]>([]);
  const [simSpeed, setSimSpeed] = useState<number>(10); // delay in ms

  // Optimal overall route discovered so far (persistent regardless of current generation)
  const [recordBests, setRecordBests] = useState<{ path: City[]; distance: number } | null>(null);

  // Animation & loop refs
  const isRunningRef = useRef<boolean>(false);
  const citiesRef = useRef<City[]>([]);
  const populationRef = useRef<TspIndividual[]>([]);
  const generationRef = useRef<number>(0);
  const historyRef = useRef<TspHistoryPoint[]>([]);
  const lastTickRef = useRef<number>(0);
  const loopHandleRef = useRef<number | null>(null);
  const recordBestsRef = useRef<{ path: City[]; distance: number } | null>(null);

  // Initialize raw cities when component mounts or city count slider moves in idle
  useEffect(() => {
    if (status === "idle") {
      const generated = generateRandomCities(config.cityCount);
      setCities(generated);
    }
  }, [config.cityCount]);

  // Keep references updated when cities changes
  useEffect(() => {
    citiesRef.current = cities;
    resetWithCities(cities);
  }, [cities]);

  // Cleanup loop
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

  const resetWithCities = (activeCities: City[]) => {
    cancelLoop();
    setStatus("idle");

    if (activeCities.length < 3) {
      setBestIndividual(null);
      setRecordBests(null);
      recordBestsRef.current = null;
      return;
    }

    const pop = initializeTspPopulation(activeCities, config.populationSize);
    const sorted = [...pop].sort((a, b) => a.distance - b.distance);
    const best = sorted[0];

    let total = 0;
    for (const ind of pop) {
      total += ind.distance;
    }
    const avg = total / pop.length;

    populationRef.current = pop;
    generationRef.current = 0;
    
    const initialHistory: TspHistoryPoint[] = [
      {
        generation: 0,
        bestDistance: best.distance,
        averageDistance: avg,
        bestFitness: best.fitness,
      }
    ];
    historyRef.current = initialHistory;
    recordBestsRef.current = { path: best.path, distance: best.distance };

    setGeneration(0);
    setBestIndividual(best);
    setAverageDistance(avg);
    setHistory(initialHistory);
    setRecordBests(recordBestsRef.current);
  };

  const handleReset = () => {
    // Generate new set of cities completely
    const generated = generateRandomCities(config.cityCount);
    setCities(generated);
  };

  const handleClearCities = () => {
    cancelLoop();
    setStatus("idle");
    setCities([]);
    setBestIndividual(null);
    setRecordBests(null);
    recordBestsRef.current = null;
    setHistory([]);
    setGeneration(0);
  };

  // Click on SVG Canvas to create a city at exact proportional coordinates
  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (status === "running") {
      handlePause();
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newIndex = cities.length;
    const cityName = VIET_CITIES[newIndex % VIET_CITIES.length] + (newIndex >= VIET_CITIES.length ? ` ${Math.floor(newIndex / VIET_CITIES.length) + 1}` : "");
    const newCity: City = {
      id: `city_${Math.random().toString(36).substring(2, 6)}_${newIndex}`,
      name: cityName,
      x,
      y,
    };

    const newCitiesList = [...cities, newCity];
    
    // Update config slider value if we manually clicked to exceed
    if (newCitiesList.length > 50) return; // limit maps
    
    setCities(newCitiesList);
    setConfig(prev => ({ ...prev, cityCount: newCitiesList.length }));
  };

  const runSingleGenerationStep = () => {
    if (citiesRef.current.length < 3) return true;

    const { newPopulation, bestIndividual, averageDistance: avg } = evolveTspGeneration(
      populationRef.current,
      config
    );

    populationRef.current = newPopulation;
    generationRef.current += 1;

    // Check if we found a record-breaker distance
    if (!recordBestsRef.current || bestIndividual.distance < recordBestsRef.current.distance) {
      recordBestsRef.current = { path: bestIndividual.path, distance: bestIndividual.distance };
    }

    const newHistoryPoint: TspHistoryPoint = {
      generation: generationRef.current,
      bestDistance: bestIndividual.distance,
      averageDistance: avg,
      bestFitness: bestIndividual.fitness,
    };

    let updatedHistory = [...historyRef.current, newHistoryPoint];
    if (updatedHistory.length > 500) {
      updatedHistory = updatedHistory.filter((_, idx) => idx % 2 === 0 || idx === updatedHistory.length - 1);
    }
    historyRef.current = updatedHistory;

    // React state synchronization
    setGeneration(generationRef.current);
    setBestIndividual(bestIndividual);
    setAverageDistance(avg);
    setHistory(historyRef.current);
    setRecordBests(recordBestsRef.current);

    return false;
  };

  const handleStep = () => {
    if (cities.length < 3) return;
    if (status === "running") {
      handlePause();
      return;
    }
    setStatus("paused");
    runSingleGenerationStep();
  };

  const handleStart = () => {
    if (cities.length < 3) return;

    setStatus("running");
    isRunningRef.current = true;
    lastTickRef.current = performance.now();

    const loop = (time: number) => {
      if (!isRunningRef.current) return;

      const elapsed = time - lastTickRef.current;
      if (elapsed >= simSpeed) {
        lastTickRef.current = time;
        runSingleGenerationStep();
      }

      loopHandleRef.current = requestAnimationFrame(loop);
    };

    loopHandleRef.current = requestAnimationFrame(loop);
  };

  const handlePause = () => {
    setStatus("paused");
    cancelLoop();
  };

  // Graph rendering variables (Distance shortening chart)
  const maxGenInHistory = history.length > 0 ? Math.max(...history.map(h => h.generation)) : 10;
  const listDistances = history.map(h => h.bestDistance);
  const listAvgDistances = history.map(h => h.averageDistance);
  const maxDistanceRef = history.length > 0 ? Math.max(...listDistances, ...listAvgDistances) : 1000;
  const minDistanceRef = history.length > 0 ? Math.min(...listDistances) : 0;
  
  const valueDelta = Math.max(1, maxDistanceRef - minDistanceRef);

  const paddingX = 40;
  const paddingY = 30;
  const svgWidth = 500;
  const svgHeight = 200;

  const getChartCoordinates = (point: TspHistoryPoint) => {
    const x = paddingX + (point.generation / Math.max(1, maxGenInHistory)) * (svgWidth - paddingX * 2);
    // distance decreasing is plotted descending. Max distance is at bottom of chart, min is at top-ish
    const scaleY = svgHeight - paddingY * 2;
    const y = svgHeight - paddingY - ((point.bestDistance - minDistanceRef) / valueDelta) * scaleY;
    const avgY = svgHeight - paddingY - ((point.averageDistance - minDistanceRef) / valueDelta) * scaleY;
    return { x, y: isNaN(y) ? paddingY : y, avgY: isNaN(avgY) ? paddingY : avgY };
  };

  let recordLinePath = "";
  let avgLinePath = "";
  if (history.length > 1) {
    history.forEach((point, idx) => {
      const { x, y, avgY } = getChartCoordinates(point);
      if (idx === 0) {
        recordLinePath += `M ${x} ${y}`;
        avgLinePath += `M ${x} ${avgY}`;
      } else {
        recordLinePath += ` L ${x} ${y}`;
        avgLinePath += ` L ${x} ${avgY}`;
      }
    });
  }

  // Draw cities connections path coordinates for SVG map
  // Select which path to draw: overall record or current generation's best
  const activePathDrawn = recordBests?.path || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="tsp-simulator">
      {/* Parameter configs */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800 text-slate-800 dark:text-white">
            <Settings className="w-5 h-5 text-indigo-550" />
            <h3 className="font-bold">Tham số bản đồ & di truyền</h3>
          </div>

          <div className="p-4 bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl border border-slate-100 dark:border-slate-850 mt-4 text-xs text-slate-505 leading-relaxed">
            <Plus className="w-4 h-4 inline-block mr-1 text-indigo-505" />
            <strong>Tương tác trực tiếp:</strong> Bạn có thể nhấp chuột trực tiếp lên khung bản đồ bên phải để tự thêm thành phố theo vị trí ưa thích!
          </div>

          <div className="space-y-5 mt-5">
            {/* City count */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Số lượng thành phố ngẫu nhiên
                </label>
                <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/55 px-2 py-0.5 rounded">
                  {config.cityCount}
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="35"
                step="1"
                disabled={status === "running" || status === "paused"}
                value={config.cityCount}
                onChange={(e) => setConfig({ ...config, cityCount: parseInt(e.target.value) })}
                className="w-full accent-indigo-555 h-1.5 bg-slate-150 rounded"
              />
              <div className="flex justify-between items-center mt-2">
                <button
                  onClick={handleReset}
                  disabled={status === "running"}
                  className="px-2.5 py-1 text-xxs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 rounded transition"
                >
                  Xáo trộn bản đồ mới
                </button>
                <button
                  onClick={handleClearCities}
                  disabled={status === "running" || cities.length === 0}
                  className="px-2.5 py-1 text-xxs font-bold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400 rounded transition"
                >
                  Xóa tất cả
                </button>
              </div>
            </div>

            {/* Population size */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Kích thước quần thể (Số lộ trình)
                </label>
                <span className="text-xs font-mono font-bold text-indigo-650 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded">
                  {config.populationSize}
                </span>
              </div>
              <input
                type="range"
                min="15"
                max="400"
                step="5"
                disabled={status === "running" || status === "paused"}
                value={config.populationSize}
                onChange={(e) => setConfig({ ...config, populationSize: parseInt(e.target.value) })}
                className="w-full accent-indigo-505 h-1.5 bg-slate-150 rounded"
              />
            </div>

            {/* Mutation rate */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Xác suất đột biến hoán đổi
                </label>
                <span className="text-xs font-mono font-bold text-rose-555 bg-rose-55 dark:bg-rose-950/40 px-2 py-0.5 rounded">
                  {(config.mutationRate * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0.01"
                max="0.30"
                step="0.01"
                disabled={status === "running" || status === "paused"}
                value={config.mutationRate}
                onChange={(e) => setConfig({ ...config, mutationRate: parseFloat(e.target.value) })}
                className="w-full accent-rose-505 h-1.5 bg-slate-150 rounded"
              />
            </div>

            {/* Speed slider */}
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                  Độ trễ tiến hóa
                </label>
                <span className="text-xs font-mono font-bold text-slate-550">
                  {simSpeed === 0 ? "0ms (Tốc lực)" : `${simSpeed}ms`}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="250"
                step="5"
                value={simSpeed}
                onChange={(e) => setSimSpeed(parseInt(e.target.value))}
                className="w-full accent-slate-455 h-1.5 bg-slate-150 rounded"
              />
            </div>
          </div>
        </div>

        {/* Playback controller */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex items-center justify-center gap-3">
          <button
            onClick={() => resetWithCities(cities)}
            className="p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 hover:text-slate-800 rounded-2xl transition duration-200 flex items-center justify-center text-slate-550 dark:text-slate-100"
            title="Đặt lại thế hệ"
            id="btn-tsp-reset"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          {status === "running" ? (
            <button
              onClick={handlePause}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl transition duration-200 flex items-center gap-2 font-bold shadow-md shadow-amber-500/10 shrink-0 text-sm"
              id="btn-tsp-pause"
            >
              <Pause className="w-5 h-5 fill-current" />
              Tạm dừng
            </button>
          ) : (
            <button
              onClick={handleStart}
              disabled={cities.length < 3}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl transition duration-200 flex items-center gap-2 font-bold shadow-md shadow-indigo-500/15 disabled:opacity-40 shrink-0 text-sm"
              id="btn-tsp-start"
            >
              <Play className="w-5 h-5 fill-current" />
              Chạy tiến hóa
            </button>
          )}

          <button
            onClick={handleStep}
            disabled={status === "running" || cities.length < 3}
            className="p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 disabled:opacity-40 rounded-2xl transition duration-200 flex items-center justify-center text-slate-555 dark:text-slate-100"
            title="Tiến 1 bước thế hệ"
            id="btn-tsp-step"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Graphical Dashboard & Canvas */}
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
              <Navigation className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xxs font-bold text-slate-400 uppercase tracking-widest leading-none">Đường Ngắn Nhất</p>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-1 font-mono">
                {recordBests ? `${recordBests.distance.toFixed(1)} km` : "Chưa có"}
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3 shadow-2xs">
            <div className="p-2.5 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-xl">
              <Milestone className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xxs font-bold text-slate-400 uppercase tracking-widest leading-none">Đường Trung bình</p>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-1 font-mono">
                {averageDistance > 0 ? `${averageDistance.toFixed(1)} km` : "Chưa có"}
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3 shadow-2xs">
            <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 text-rose-550 rounded-xl">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xxs font-bold text-slate-400 uppercase tracking-widest leading-none">Tổng thành phố</p>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-1 font-mono">
                {cities.length}
              </p>
            </div>
          </div>
        </div>

        {/* The Map visual workspace */}
        <div className="bg-slate-950 border border-slate-900 rounded-3xl p-4 shadow-inner relative flex flex-col items-stretch overflow-hidden aspect-video min-h-[300px] md:min-h-[400px]">
          {/* Header indicator inside canvas */}
          <div className="absolute top-4 left-4 z-10 flex gap-2">
            <span className="px-2.5 py-1 bg-slate-900/95 border border-slate-800 rounded-lg text-xxs font-bold text-slate-400 tracking-wider flex items-center gap-1.5 shadow">
              <span className={`w-1.5 h-1.5 rounded-full ${status === "running" ? "bg-emerald-500 animate-ping" : "bg-slate-550"}`} />
              {status === "idle" && "TIẾN HÓA SẴN SÀNG"}
              {status === "running" && "ĐANG TÌM ĐƯỜNG ĐI ĐỒNG BỘ"}
              {status === "paused" && "TẠM DỪNG"}
            </span>
          </div>

          {cities.length < 3 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-center gap-2 p-6">
              <MapPin className="w-12 h-12 text-slate-650 animate-bounce" />
              <p className="font-bold text-sm text-slate-400">Thiếu dữ liệu bản đồ!</p>
              <p className="text-xs text-slate-500 max-w-xs leading-normal">
                Hãy click thêm tối thiểu <strong>3 thành phố</strong> lên vùng tối này hoặc kéo tăng thanh trượt tham số để khởi sinh quần thể đường đi!
              </p>
            </div>
          ) : (
            <svg 
              onClick={handleCanvasClick}
              className="flex-1 w-full h-full cursor-crosshair select-none bg-radial-[circle_at_center,_var(--tw-gradient-stops)] from-slate-900 to-slate-950"
              id="tsp-map-svg"
            >
              {/* Grid backgrounds */}
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(51, 65, 85, 0.15)" strokeWidth="1" />
                </pattern>
                <radialGradient id="bestRouteGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                </radialGradient>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />

              {/* DRAW CONNECTIONS (Best route) */}
              {activePathDrawn.length > 1 && (
                <>
                  {/* Path strings */}
                  <g>
                    {activePathDrawn.map((city, idx) => {
                      const nextCity = activePathDrawn[(idx + 1) % activePathDrawn.length];
                      return (
                        <line
                          key={`connection-${idx}`}
                          x1={`${city.x}%`}
                          y1={`${city.y}%`}
                          x2={`${nextCity.x}%`}
                          y2={`${nextCity.y}%`}
                          stroke="#6366f1"
                          strokeWidth="2"
                          strokeLinecap="round"
                          opacity="0.8"
                        />
                      );
                    })}
                  </g>

                  {/* Draw an elegant animated flow indicator bubble */}
                  <g>
                    {activePathDrawn.map((city, idx) => {
                      const nextCity = activePathDrawn[(idx + 1) % activePathDrawn.length];
                      return (
                        <circle
                          key={`flow-bubble-${idx}`}
                          cx={`${city.x}%`}
                          cy={`${city.y}%`}
                          r="3"
                          fill="#818cf8"
                          className="opacity-90"
                        >
                          <animate
                            attributeName="cx"
                            from={`${city.x}%`}
                            to={`${nextCity.x}%`}
                            dur="2s"
                            repeatCount="indefinite"
                          />
                          <animate
                            attributeName="cy"
                            from={`${city.y}%`}
                            to={`${nextCity.y}%`}
                            dur="2s"
                            repeatCount="indefinite"
                          />
                        </circle>
                      );
                    })}
                  </g>
                </>
              )}

              {/* DRAW CITY STATIONS */}
              <g>
                {cities.map((city, idx) => {
                  const isStartCity = activePathDrawn[0]?.id === city.id;
                  return (
                    <g key={city.id} className="transition-all duration-300">
                      {/* Interactive glowing ring */}
                      <circle
                        cx={`${city.x}%`}
                        cy={`${city.y}%`}
                        r={isStartCity ? "10" : "7"}
                        fill="transparent"
                        stroke={isStartCity ? "rgba(245, 158, 11, 0.3)" : "rgba(99, 102, 241, 0.2)"}
                        strokeWidth="3"
                        className="animate-pulse"
                      />
                      {/* Active station node */}
                      <circle
                        cx={`${city.x}%`}
                        cy={`${city.y}%`}
                        r={isStartCity ? "5" : "4"}
                        fill={isStartCity ? "#f59e0b" : "#fb7185"}
                        stroke="#0f172a"
                        strokeWidth="1.5"
                      />
                      {/* City name text card with safety offsets */}
                      <text
                        x={`${city.x}%`}
                        y={`${city.y - 3.5}%`}
                        textAnchor="middle"
                        fill="#cbd5e1"
                        className="text-[10px] md:text-[11px] font-semibold tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] bg-slate-900 pointer-events-none select-none"
                      >
                        {city.name}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>
          )}

          {/* Footer instruction widget inside map */}
          {cities.length >= 3 && (
            <div className="absolute bottom-3 right-3 bg-slate-900/90 border border-slate-800 text-[10px] text-slate-400 px-2.5 py-1 rounded-lg pointer-events-none shadow font-sans">
              ★ Đỉnh màu vàng <span className="text-amber-500 font-bold">({activePathDrawn[0]?.name})</span> là Trạm Khởi đầu
            </div>
          )}
        </div>

        {/* Chart detailing reduction of distance under evolution */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
          <h4 className="font-bold text-sm text-slate-800 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <span>Độ sụt giảm quãng đường di chuyển (Càng ngắn càng ưu tú)</span>
            <span className="text-xxs font-mono text-slate-450 font-normal">Quãng đường dài: {maxDistanceRef.toFixed(0)}km → Tối ưu: {minDistanceRef.toFixed(0)}km</span>
          </h4>

          <div className="h-[150px] w-full mt-3 flex items-center justify-center relative">
            {history.length > 1 ? (
              <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
                {/* Horizontal mesh grids */}
                <line x1={paddingX} y1={paddingY} x2={svgWidth - paddingX} y2={paddingY} stroke="#f1f5f9" strokeDasharray="3,3" className="stroke-slate-100 dark:stroke-slate-850" />
                <line x1={paddingX} y1={(svgHeight - paddingY * 2) / 2 + paddingY} x2={svgWidth - paddingX} y2={(svgHeight - paddingY * 2) / 2 + paddingY} stroke="#f1f5f9" strokeDasharray="3,3" className="stroke-slate-100 dark:stroke-slate-850" />
                <line x1={paddingX} y1={svgHeight - paddingY} x2={svgWidth - paddingX} y2={svgHeight - paddingY} stroke="#e2e8f0" strokeWidth="1" className="stroke-slate-200 dark:stroke-slate-800" />
                <line x1={paddingX} y1={paddingY} x2={paddingX} y2={svgHeight - paddingY} stroke="#e2e8f0" strokeWidth="1" className="stroke-slate-200 dark:stroke-slate-800" />

                {/* Left Y Axis values (Distances) */}
                <text x={paddingX - 8} y={paddingY + 3} textAnchor="end" className="fill-slate-400 font-mono text-[9px]">{maxDistanceRef.toFixed(0)}km</text>
                <text x={paddingX - 8} y={(svgHeight - paddingY * 2) / 2 + paddingY + 3} textAnchor="end" className="fill-slate-400 font-mono text-[9px]">{(minDistanceRef + valueDelta/2).toFixed(0)}km</text>
                <text x={paddingX - 8} y={svgHeight - paddingY + 3} textAnchor="end" className="fill-slate-400 font-mono text-[9px]">{minDistanceRef.toFixed(0)}km</text>

                {/* Dynamic Generation metrics */}
                <text x={paddingX} y={svgHeight - 8} textAnchor="start" className="fill-slate-400 font-mono text-[9px]">Khởi điểm (Gen 0)</text>
                <text x={svgWidth - paddingX} y={svgHeight - 8} textAnchor="end" className="fill-slate-400 font-mono text-[9px]">Hiện tại (Gen {generation})</text>

                {/* Best line plot (Solid Royal Indigo) */}
                <path d={recordLinePath} fill="none" strokeWidth="2.5" strokeLinecap="round" className="stroke-indigo-650 dark:stroke-indigo-400" />

                {/* Average line plot (Dashed Rose pink) */}
                <path d={avgLinePath} fill="none" strokeWidth="1.5" strokeDasharray="4,2" strokeLinecap="round" className="stroke-rose-400" />
              </svg>
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400 text-xs">
                <MapPin className="w-8 h-8 mb-1.5 opacity-40 animate-pulse" />
                <p>Khởi chạy Tiến hóa tìm đường để kích hoạt biểu đồ suy giảm quãng đường</p>
              </div>
            )}
          </div>

          <div className="flex justify-center gap-6 mt-3 text-[10px] font-sans font-bold">
            <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
              <span className="w-3.5 h-0.5 bg-indigo-650 dark:bg-indigo-400 inline-block rounded"></span>
              <span>Lộ trình ngắn nhất kỷ lục (Best Route Length)</span>
            </div>
            <div className="flex items-center gap-1.5 text-rose-500">
              <span className="w-3.5 h-0.5 border-t border-dashed border-rose-450 inline-block"></span>
              <span>Lộ trình trung bình thế hệ (Average)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
