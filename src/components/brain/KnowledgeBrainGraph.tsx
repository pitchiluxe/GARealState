"use client";

// Canvas-based force graph — GPU-composited, 60fps
// Matches the Quickbooks KnowledgeGraph: spring-physics, glow, hub-first entrance,
// timelapse, zoom controls, fullscreen, category filter, hover tooltips.
// Fixes vs first version:
//  - drawRef pattern eliminates stale-closure RAF bug
//  - LABEL_ZOOM_THRESHOLD lowered to 0.45 with smooth fade-in
//  - wordCount used as size fallback when no connections exist
//  - enrichedData now redundant (API already sends linkCount/backlinkCount)

import { useEffect, useRef, useState, useCallback } from "react";
import {
  ZoomIn, ZoomOut, Maximize2, Minimize2,
  Filter, ArrowLeft, Play, Square, ExternalLink, Crosshair,
} from "lucide-react";

/* ─── Types ──────────────────────────────────────────────────────────── */
export interface BrainNode extends d3.SimulationNodeDatum {
  id: string;
  title: string;
  category: string;
  wordCount?: number;
  linkCount?: number;
  backlinkCount?: number;
}
export interface BrainEdge { sourceId: string; targetId: string; }

interface Props {
  nodes: BrainNode[];
  edges: BrainEdge[];
  onSelectNote: (id: string) => void;
  onBack: () => void;
}

/* ─── GA Real Estate category palette ────────────────────────────────── */
const CATEGORY_COLORS: Record<string, string> = {
  "License Law":  "#3b82f6",
  "Contracts":    "#f59e0b",
  "Agency":       "#10b981",
  "Fair Housing": "#ec4899",
  "Finance":      "#8b5cf6",
  "Property":     "#14b8a6",
  "Closing":      "#f97316",
  "Ethics":       "#a78bfa",
  "Math":         "#06b6d4",
  "Valuation":    "#84cc16",
  "Exam Prep":    "#e879f9",
  "GREC":         "#fb923c",
  "General":      "#6b7280",
};

/* ─── Helpers ────────────────────────────────────────────────────────── */
function getNodeRadius(node: BrainNode): number {
  const connections = (node.linkCount ?? 0) + (node.backlinkCount ?? 0);
  // Use wordCount as a secondary size signal when no links yet
  const wordBonus = connections === 0 ? Math.min(4, (node.wordCount ?? 0) / 100) : 0;
  return Math.max(5, Math.min(22, 5 + connections * 1.4 + wordBonus));
}

function easeBackOut(t: number, overshoot = 1.8): number {
  const c = overshoot + 1;
  return 1 + c * Math.pow(t - 1, 3) + overshoot * Math.pow(t - 1, 2);
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

interface Transform { x: number; y: number; k: number; }
interface NodeAnim { t0: number; duration: number; }

// Labels appear at 45% zoom and fade in smoothly from 45%→65%
const LABEL_FADE_START = 0.45;
const LABEL_FADE_END   = 0.65;
const MIN_ZOOM = 0.05;
const MAX_ZOOM = 10;

export function KnowledgeBrainGraph({ nodes: rawNodes, edges: rawEdges, onSelectNote, onBack }: Props) {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const simulationRef      = useRef<any>(null);
  const nodesRef           = useRef<BrainNode[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const linksRef           = useRef<any[]>([]);
  const rawEdgesRef        = useRef(rawEdges);
  const transformRef       = useRef<Transform>({ x: 0, y: 0, k: 1 });
  const rafRef             = useRef<number | null>(null);
  const drawRef            = useRef<() => void>(() => undefined); // always-current draw fn
  const draggingNodeRef    = useRef<BrainNode | null>(null);
  const hoveredNodeRef     = useRef<BrainNode | null>(null);
  const selectedNodeIdRef  = useRef<string | null>(null);
  const timelapseTimerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const timelapseIdxRef    = useRef(0);
  const timelapseModeRef   = useRef(false);
  const visibleSetRef      = useRef<Set<string>>(new Set());
  const nodeAnimRef        = useRef<Map<string, NodeAnim>>(new Map());
  const entranceActiveRef  = useRef(false);
  const entranceStartRef   = useRef(0);
  const nodeEntranceRef    = useRef<Map<string, { delay: number; duration: number }>>(new Map());

  const [hoveredNode, setHoveredNode]       = useState<BrainNode | null>(null);
  const [hoveredPos, setHoveredPos]         = useState({ x: 0, y: 0 });
  const [zoom, setZoom]                     = useState(1);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [timelapsePlaying, setTimelapsePlaying]   = useState(false);
  const [timelapseProgress, setTimelapseProgress] = useState(0);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [fullscreen, setFullscreen]         = useState(false);

  // Keep rawEdgesRef fresh without triggering re-renders
  useEffect(() => { rawEdgesRef.current = rawEdges; }, [rawEdges]);
  useEffect(() => { selectedNodeIdRef.current = selectedNodeId; }, [selectedNodeId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selectedNodeIdRef.current) setSelectedNodeId(null);
        else if (fullscreen) setFullscreen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreen]);

  useEffect(() => {
    return () => {
      if (timelapseTimerRef.current) clearInterval(timelapseTimerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // ── RAF loop — always calls the latest drawRef ─────────────────────────
  // startLoop has NO deps so it's created once and never causes re-mounts
  const startLoop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const loop = () => {
      drawRef.current();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, []);

  const stopLoop = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
  }, []);

  // ── Canvas draw (assigned to drawRef, not used in deps) ───────────────
  // We don't memoize this with useCallback to keep the dep chain simple;
  // instead it's re-assigned to drawRef on every render via useEffect below.
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x: tx, y: ty, k } = transformRef.current;
    const nodes = nodesRef.current;
    const links = linksRef.current;
    const edges = rawEdgesRef.current;
    const selId = selectedNodeIdRef.current;
    const now = performance.now();

    const entranceActive  = entranceActiveRef.current;
    const entranceElapsed = entranceActive ? now - entranceStartRef.current : Infinity;
    if (entranceActive && entranceElapsed > 900) entranceActiveRef.current = false;
    const entranceEdgeAlpha = entranceActive ? Math.min(1, entranceElapsed / 700) : 1;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(tx, ty);
    ctx.scale(k, k);

    // Which nodes are connected to the selected one?
    let connectedIds: Set<string> | null = null;
    if (selId) {
      connectedIds = new Set([selId]);
      for (const e of edges) {
        if (e.sourceId === selId) connectedIds.add(e.targetId);
        if (e.targetId === selId) connectedIds.add(e.sourceId);
      }
    }

    // ── Edges ─────────────────────────────────────────────────────────────
    for (const l of links) {
      const sx = l.source.x ?? 0, sy = l.source.y ?? 0;
      const tx2 = l.target.x ?? 0, ty2 = l.target.y ?? 0;

      let alpha = 0.13 * entranceEdgeAlpha;
      if (selId) {
        const src = l.source.id ?? l.source, tgt = l.target.id ?? l.target;
        if (src === selId || tgt === selId) {
          const selNode = nodes.find(nd => nd.id === selId);
          const color = selNode ? (CATEGORY_COLORS[selNode.category] ?? "#e8825a") : "#e8825a";
          ctx.strokeStyle = color;
          ctx.lineWidth = 2 / k;
          ctx.globalAlpha = 0.85;
          ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(tx2, ty2); ctx.stroke();
          ctx.globalAlpha = 1;
          continue;
        }
        alpha = 0.03 * entranceEdgeAlpha;
      }
      ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
      ctx.lineWidth = 1.2 / k;
      ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(tx2, ty2); ctx.stroke();
    }

    // ── Nodes ─────────────────────────────────────────────────────────────
    for (const node of nodes) {
      if (timelapseModeRef.current && !visibleSetRef.current.has(node.id)) continue;

      const nx = node.x ?? 0, ny = node.y ?? 0;
      const baseR = getNodeRadius(node);
      const color = CATEGORY_COLORS[node.category] ?? CATEGORY_COLORS.General;
      const isSelected  = node.id === selId;
      const isConnected = connectedIds ? connectedIds.has(node.id) : true;

      // Entrance cascade animation
      let animScale = 1;
      if (entranceActive) {
        const info = nodeEntranceRef.current.get(node.id);
        if (info) {
          const elapsed = entranceElapsed - info.delay;
          if (elapsed < 0) animScale = 0;
          else if (elapsed < info.duration) animScale = Math.max(0, easeBackOut(elapsed / info.duration));
        }
      }

      // Timelapse pop-in
      const anim = nodeAnimRef.current.get(node.id);
      if (anim) {
        const elapsed = now - anim.t0;
        if (elapsed < anim.duration) {
          animScale = Math.max(0, easeBackOut(elapsed / anim.duration));
        } else {
          nodeAnimRef.current.delete(node.id);
        }
      }

      const r = baseR * animScale;
      if (r <= 0) continue;

      let fillAlpha   = isConnected ? 0.85 : 0.06;
      let strokeAlpha = isConnected ? 0.45 : 0.04;
      if (isSelected) { fillAlpha = 0.95; strokeAlpha = 1; }

      if (isSelected) { ctx.shadowColor = color; ctx.shadowBlur = 20; }

      ctx.beginPath();
      ctx.arc(nx, ny, isSelected ? r * 1.35 : r, 0, Math.PI * 2);
      ctx.fillStyle   = hexToRgba(color, fillAlpha);
      ctx.fill();
      ctx.strokeStyle = hexToRgba(color, strokeAlpha);
      ctx.lineWidth   = isSelected ? 2.5 / k : 1.5 / k;
      ctx.stroke();

      if (isSelected) ctx.shadowBlur = 0;

      // Hover ring
      const hov = hoveredNodeRef.current;
      if (hov && hov.id === node.id && !selId) {
        ctx.beginPath();
        ctx.arc(nx, ny, r + 5 / k, 0, Math.PI * 2);
        ctx.strokeStyle = hexToRgba(color, 0.6);
        ctx.lineWidth = 1.5 / k;
        ctx.stroke();
      }
    }

    // ── Labels (fade in smoothly from LABEL_FADE_START → LABEL_FADE_END) ──
    const labelAlpha = k < LABEL_FADE_START ? 0
      : k >= LABEL_FADE_END ? 1
      : (k - LABEL_FADE_START) / (LABEL_FADE_END - LABEL_FADE_START);

    if (labelAlpha > 0) {
      const fontSize = Math.max(8, Math.min(13, 10 / k));
      ctx.font = `500 ${fontSize}px Inter, ui-sans-serif, sans-serif`;
      ctx.textAlign = "center";

      for (const node of nodes) {
        if (timelapseModeRef.current && !visibleSetRef.current.has(node.id)) continue;
        const isConnected = connectedIds ? connectedIds.has(node.id) : true;
        if (selId && !isConnected) continue;

        // Entrance fade: labels fade in together with the node
        let entFade = 1;
        if (entranceActive) {
          const info = nodeEntranceRef.current.get(node.id);
          if (info) {
            const elapsed = entranceElapsed - info.delay;
            entFade = elapsed < 0 ? 0 : elapsed < info.duration ? elapsed / info.duration : 1;
          }
        }

        const baseTextAlpha = node.id === selId ? 1 : (isConnected ? 0.75 : 0.1);
        const finalAlpha = labelAlpha * baseTextAlpha * entFade;
        if (finalAlpha <= 0) continue;

        ctx.fillStyle = `rgba(255,255,255,${finalAlpha})`;
        const label = node.title.length > 24 ? node.title.slice(0, 24) + "…" : node.title;
        ctx.fillText(label, node.x ?? 0, (node.y ?? 0) + getNodeRadius(node) + 13 / k);
      }
    }

    ctx.restore();
  };

  // Keep drawRef pointing at the latest draw closure on every render
  useEffect(() => { drawRef.current = draw; });

  // ── Node hit-test ─────────────────────────────────────────────────────
  const getNodeAtPoint = useCallback((clientX: number, clientY: number): BrainNode | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const { x: tx, y: ty, k } = transformRef.current;
    const gx = (clientX - rect.left - tx) / k;
    const gy = (clientY - rect.top  - ty) / k;
    const nodes = nodesRef.current;
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      const dx = (n.x ?? 0) - gx, dy = (n.y ?? 0) - gy;
      if (dx * dx + dy * dy <= getNodeRadius(n) ** 2) return n;
    }
    return null;
  }, []);

  // ── Main graph build ──────────────────────────────────────────────────
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current || rawNodes.length === 0) return;

    stopLoop();
    setSelectedNodeId(null);
    selectedNodeIdRef.current = null;
    timelapseModeRef.current  = false;
    visibleSetRef.current     = new Set();
    nodeAnimRef.current       = new Map();
    if (timelapseTimerRef.current) {
      clearInterval(timelapseTimerRef.current);
      timelapseTimerRef.current = null;
      setTimelapsePlaying(false);
    }

    import("d3").then((d3) => {
      const canvas    = canvasRef.current!;
      const container = containerRef.current!;
      const width     = container.clientWidth;
      const height    = container.clientHeight;

      canvas.width  = width;
      canvas.height = height;

      // Category filter
      const visibleNodes = activeCategory
        ? rawNodes.filter(nd => nd.category === activeCategory)
        : [...rawNodes];
      const visibleIds  = new Set(visibleNodes.map(nd => nd.id));
      const visibleEdges = rawEdges.filter(e => visibleIds.has(e.sourceId) && visibleIds.has(e.targetId));

      const nodes: BrainNode[] = visibleNodes.map(nd => ({ ...nd }));
      const links = visibleEdges.map(e => ({ ...e, source: e.sourceId, target: e.targetId }));
      const n = nodes.length;

      const chargeStr = -Math.max(60, Math.min(280, 280 - n * 1.1));
      const linkDist  = Math.max(55, Math.min(130, 55 + n * 0.35));

      const simulation = d3.forceSimulation<BrainNode>(nodes)
        .alphaDecay(0.028)
        .velocityDecay(0.4)
        .force("link",      d3.forceLink(links).id((d: unknown) => (d as BrainNode).id).distance(linkDist).strength(0.5))
        .force("charge",    d3.forceManyBody().strength(chargeStr).distanceMax(450))
        .force("center",    d3.forceCenter(width / 2, height / 2).strength(0.05))
        .force("collision", d3.forceCollide().radius((d: unknown) => getNodeRadius(d as BrainNode) + 4).strength(0.8));

      simulationRef.current = simulation;
      nodesRef.current      = nodes;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      linksRef.current      = (simulation.force("link") as any).links();

      // Burst outward from center so the simulation visibly settles
      nodes.forEach(nd => {
        const angle = Math.random() * Math.PI * 2;
        const dist  = 20 + Math.random() * 60;
        nd.x = width  / 2 + Math.cos(angle) * dist;
        nd.y = height / 2 + Math.sin(angle) * dist;
        nd.vx = Math.cos(angle) * 4;
        nd.vy = Math.sin(angle) * 4;
      });

      const k0 = Math.max(0.35, Math.min(0.75, 400 / Math.max(n * 3, 1)));
      transformRef.current = {
        k: k0,
        x: (width  / 2) * (1 - k0),
        y: (height / 2) * (1 - k0),
      };
      setZoom(k0);

      // ── Event listeners ────────────────────────────────────────────────
      let isPanning = false;
      let panStart  = { x: 0, y: 0 };
      let panStartT = { x: 0, y: 0, k: 1 };
      let mdPos     = { x: 0, y: 0 };
      let didDrag   = false;

      const onMouseDown = (e: MouseEvent) => {
        if (e.button !== 0) return;
        mdPos = { x: e.clientX, y: e.clientY };
        didDrag = false;
        const node = getNodeAtPoint(e.clientX, e.clientY);
        if (node) {
          draggingNodeRef.current = node;
          node.fx = node.x; node.fy = node.y;
          simulation.alphaTarget(0.5).restart();
        } else {
          isPanning = true;
          panStart  = { x: e.clientX, y: e.clientY };
          panStartT = { ...transformRef.current };
        }
      };

      const onMouseMove = (e: MouseEvent) => {
        const dx = e.clientX - mdPos.x, dy = e.clientY - mdPos.y;
        if (Math.sqrt(dx * dx + dy * dy) > 3) didDrag = true;

        if (draggingNodeRef.current) {
          const rect = canvas.getBoundingClientRect();
          const { x: tx, y: ty, k } = transformRef.current;
          draggingNodeRef.current.fx = (e.clientX - rect.left - tx) / k;
          draggingNodeRef.current.fy = (e.clientY - rect.top  - ty) / k;
        } else if (isPanning) {
          transformRef.current = {
            k: panStartT.k,
            x: panStartT.x + (e.clientX - panStart.x),
            y: panStartT.y + (e.clientY - panStart.y),
          };
        } else {
          const node = getNodeAtPoint(e.clientX, e.clientY);
          if (node !== hoveredNodeRef.current) { hoveredNodeRef.current = node; setHoveredNode(node); }
          if (node) setHoveredPos({ x: e.clientX, y: e.clientY });
        }
      };

      const onMouseUp = () => {
        if (draggingNodeRef.current) {
          draggingNodeRef.current.fx = null;
          draggingNodeRef.current.fy = null;
          simulation.alphaTarget(0.08);
          setTimeout(() => simulationRef.current?.alphaTarget(0), 500);
          draggingNodeRef.current = null;
        }
        isPanning = false;
      };

      const onClick = (e: MouseEvent) => {
        if (didDrag) return;
        const node = getNodeAtPoint(e.clientX, e.clientY);
        if (node) {
          setSelectedNodeId(prev => {
            const next = prev === node.id ? null : node.id;
            selectedNodeIdRef.current = next;
            return next;
          });
        } else {
          setSelectedNodeId(null);
          selectedNodeIdRef.current = null;
        }
      };

      const onDblClick = (e: MouseEvent) => {
        const node = getNodeAtPoint(e.clientX, e.clientY);
        if (node) onSelectNote(node.id);
      };

      const onWheel = (e: WheelEvent) => {
        e.preventDefault();
        const rect  = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left, my = e.clientY - rect.top;
        const factor = e.deltaY > 0 ? 0.85 : 1.18;
        const { x: tx, y: ty, k } = transformRef.current;
        const newK = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, k * factor));
        transformRef.current = {
          k: newK,
          x: mx - (mx - tx) * (newK / k),
          y: my - (my - ty) * (newK / k),
        };
        setZoom(newK);
      };

      canvas.addEventListener("mousedown",  onMouseDown);
      canvas.addEventListener("mousemove",  onMouseMove);
      canvas.addEventListener("mouseup",    onMouseUp);
      canvas.addEventListener("click",      onClick);
      canvas.addEventListener("dblclick",   onDblClick);
      canvas.addEventListener("wheel",      onWheel, { passive: false });

      simulation.on("tick", () => { /* RAF loop draws every frame */ });

      // ── Hub-first entrance cascade ─────────────────────────────────────
      const sortedByHub = [...nodes].sort(
        (a, b) => ((b.linkCount ?? 0) + (b.backlinkCount ?? 0)) - ((a.linkCount ?? 0) + (a.backlinkCount ?? 0))
      );
      const entranceMap = new Map<string, { delay: number; duration: number }>();
      sortedByHub.forEach((node, i) => {
        const pct = i / Math.max(nodes.length - 1, 1);
        if      (pct < 0.15) entranceMap.set(node.id, { delay:   0, duration: 480 }); // hubs
        else if (pct < 0.45) entranceMap.set(node.id, { delay: 200, duration: 400 }); // mid-tier
        else                  entranceMap.set(node.id, { delay: 450, duration: 350 }); // leaves
      });
      nodeEntranceRef.current  = entranceMap;
      entranceStartRef.current = performance.now();
      entranceActiveRef.current = true;

      startLoop();
    });

    return () => { stopLoop(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawNodes, rawEdges, activeCategory]);

  // ── Resize observer ───────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;
    const ro = new ResizeObserver(() => {
      const cv = canvasRef.current, ct = containerRef.current;
      if (cv && ct) { cv.width = ct.clientWidth; cv.height = ct.clientHeight; }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // ── Timelapse ─────────────────────────────────────────────────────────
  const stopTimelapse = useCallback(() => {
    if (timelapseTimerRef.current) { clearInterval(timelapseTimerRef.current); timelapseTimerRef.current = null; }
    setTimelapsePlaying(false);
    setTimelapseProgress(100);
    timelapseModeRef.current = false;
    visibleSetRef.current = new Set();
    nodeAnimRef.current   = new Map();
  }, []);

  const startTimelapse = useCallback(() => {
    if (!nodesRef.current.length) return;
    if (timelapseTimerRef.current) clearInterval(timelapseTimerRef.current);
    setSelectedNodeId(null); selectedNodeIdRef.current = null;
    setTimelapsePlaying(true); setTimelapseProgress(0);
    timelapseIdxRef.current   = 0;
    timelapseModeRef.current  = true;
    visibleSetRef.current     = new Set();
    nodeAnimRef.current       = new Map();

    const nodes  = nodesRef.current;
    const total  = nodes.length;
    const sorted = [...nodes].sort(
      (a, b) => ((b.linkCount ?? 0) + (b.backlinkCount ?? 0)) - ((a.linkCount ?? 0) + (a.backlinkCount ?? 0))
    );

    setTimeout(() => {
      timelapseTimerRef.current = setInterval(() => {
        const idx = timelapseIdxRef.current;
        if (idx >= total) {
          clearInterval(timelapseTimerRef.current!);
          timelapseTimerRef.current = null;
          setTimelapsePlaying(false); setTimelapseProgress(100);
          setTimeout(() => { timelapseModeRef.current = false; visibleSetRef.current = new Set(); }, 300);
          return;
        }
        const node = sorted[idx];
        visibleSetRef.current.add(node.id);
        nodeAnimRef.current.set(node.id, { t0: performance.now(), duration: 400 });
        timelapseIdxRef.current++;
        setTimelapseProgress(Math.round(((idx + 1) / total) * 100));
        simulationRef.current?.alpha(0.06).restart();
      }, 120);
    }, 200);
  }, []);

  // ── Zoom controls ─────────────────────────────────────────────────────
  const zoomBy = (factor: number) => {
    const { x, y, k } = transformRef.current;
    const canvas = canvasRef.current; if (!canvas) return;
    const newK = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, k * factor));
    const cx = canvas.width / 2, cy = canvas.height / 2;
    transformRef.current = { k: newK, x: cx - (cx - x) * (newK / k), y: cy - (cy - y) * (newK / k) };
    setZoom(newK);
  };

  const handleZoomFit = () => {
    const canvas = canvasRef.current, container = containerRef.current;
    const nodes  = nodesRef.current;
    if (!canvas || !container || !nodes.length) return;
    const xs = nodes.map(nd => nd.x ?? 0), ys = nodes.map(nd => nd.y ?? 0);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const pad  = 60;
    const fitK = Math.min(
      (canvas.width  - pad * 2) / Math.max(maxX - minX, 1),
      (canvas.height - pad * 2) / Math.max(maxY - minY, 1),
      3
    );
    transformRef.current = {
      k: fitK,
      x: canvas.width  / 2 - fitK * (minX + maxX) / 2,
      y: canvas.height / 2 - fitK * (minY + maxY) / 2,
    };
    setZoom(fitK);
  };

  const categories = Array.from(new Set(rawNodes.map(nd => nd.category)));
  const selectedNodeData = selectedNodeId ? rawNodes.find(nd => nd.id === selectedNodeId) : null;
  const connectedCount = selectedNodeId
    ? rawEdges.filter(e => e.sourceId === selectedNodeId || e.targetId === selectedNodeId).length
    : 0;

  return (
    <div
      ref={containerRef}
      className={`relative bg-[#060b16] overflow-hidden ${fullscreen ? "fixed inset-0 z-50" : "w-full h-full"}`}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ cursor: draggingNodeRef.current ? "grabbing" : "default" }}
      />

      {/* Back to List */}
      <button
        onClick={onBack}
        className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0d1526]/90 border border-white/20 text-gray-300 hover:text-white hover:border-re-500/40 hover:bg-re-500/10 text-xs font-medium transition-all backdrop-blur-sm shadow-lg z-10"
        title="Exit graph (Esc)"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Notes
      </button>

      {/* Category filter — left side */}
      <div className="absolute top-12 left-3 z-10 flex flex-col" style={{ maxHeight: "calc(100% - 5rem)" }}>
        <div className="flex items-center gap-1 text-[10px] text-gray-600 mb-1">
          <Filter className="w-3 h-3" /> Filter
        </div>
        <div className="flex flex-col gap-1 overflow-y-auto scrollbar-hide">
          <button onClick={() => setActiveCategory(null)} className={`graph-filter-btn ${!activeCategory ? "graph-filter-active" : ""}`}>All</button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
              className={`graph-filter-btn ${activeCategory === cat ? "graph-filter-active" : ""}`}
              style={activeCategory === cat ? { color: CATEGORY_COLORS[cat] } : {}}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Toolbar — top right */}
      <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
        <button onClick={() => zoomBy(1.4)}    className="graph-control-btn" title="Zoom In"><ZoomIn  className="w-3.5 h-3.5" /></button>
        <button onClick={() => zoomBy(0.7)}    className="graph-control-btn" title="Zoom Out"><ZoomOut className="w-3.5 h-3.5" /></button>
        <button onClick={handleZoomFit}         className="graph-control-btn" title="Zoom to Fit"><Crosshair className="w-3.5 h-3.5" /></button>
        <button onClick={() => setFullscreen(f => !f)} className="graph-control-btn" title="Fullscreen">
          {fullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Stats */}
      <div className="absolute top-44 right-3 text-[10px] text-gray-700 z-10 text-right leading-5">
        {rawNodes.length} nodes<br />{rawEdges.length} edges<br />{Math.round(zoom * 100)}%
      </div>

      {/* Label hint when zoom is low */}
      {zoom < LABEL_FADE_START && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 text-[10px] text-gray-600 pointer-events-none select-none">
          Scroll to zoom in · labels appear at {Math.round(LABEL_FADE_START * 100)}%
        </div>
      )}

      {/* Timelapse button */}
      <button
        onClick={timelapsePlaying ? stopTimelapse : startTimelapse}
        disabled={rawNodes.length === 0}
        className={`absolute bottom-10 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all backdrop-blur-sm shadow-lg z-10 disabled:opacity-40 ${
          timelapsePlaying
            ? "bg-re-500/30 border-re-500/50 text-re-300 hover:bg-re-500/40"
            : "bg-[#0d1526]/90 border-white/15 text-gray-400 hover:text-re-300 hover:border-re-500/40 hover:bg-re-500/10"
        }`}
      >
        {timelapsePlaying
          ? <><Square className="w-3 h-3 fill-current" /> Stop</>
          : <><Play   className="w-3 h-3 fill-current" /> Timelapse</>}
      </button>

      {timelapsePlaying && (
        <div className="absolute bottom-[5.5rem] right-3 w-28">
          <div className="w-full h-0.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-re-500 rounded-full transition-all duration-100" style={{ width: `${timelapseProgress}%` }} />
          </div>
          <div className="text-right text-[9px] text-gray-600 mt-0.5">{timelapseProgress}%</div>
        </div>
      )}

      {/* Selected node info — bottom center */}
      {selectedNodeData && !timelapsePlaying && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-[#0d1526]/95 border border-re-500/40 rounded-xl px-4 py-2.5 flex items-center gap-3 backdrop-blur-sm shadow-2xl z-10 min-w-[280px] max-w-md">
          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: CATEGORY_COLORS[selectedNodeData.category] ?? CATEGORY_COLORS.General }} />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-white truncate">{selectedNodeData.title}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">
              {selectedNodeData.category} · <span className="text-re-400">{connectedCount} linked note{connectedCount !== 1 ? "s" : ""}</span>
            </div>
          </div>
          <button
            onClick={() => onSelectNote(selectedNodeData.id)}
            className="flex items-center gap-1 text-[10px] text-re-400 hover:text-re-200 bg-re-500/10 hover:bg-re-500/20 px-2 py-1 rounded-md transition-colors flex-shrink-0"
          >
            <ExternalLink className="w-3 h-3" /> Open
          </button>
          <button
            onClick={() => { setSelectedNodeId(null); selectedNodeIdRef.current = null; }}
            className="text-gray-600 hover:text-gray-300 text-xs flex-shrink-0"
          >✕</button>
        </div>
      )}

      {/* Hover tooltip */}
      {hoveredNode && (
        <div
          className="fixed z-50 bg-[#0f1829] border border-white/10 rounded-lg px-3 py-2 text-xs max-w-[200px] pointer-events-none shadow-xl"
          style={{ left: hoveredPos.x + 12, top: hoveredPos.y - 40 }}
        >
          <div className="font-semibold text-white mb-0.5">{hoveredNode.title}</div>
          <div className="text-gray-500">{hoveredNode.category}</div>
          <div className="text-gray-600 mt-1">
            {hoveredNode.linkCount ?? 0} out · {hoveredNode.backlinkCount ?? 0} in
          </div>
          {!selectedNodeData && (
            <div className="text-[9px] text-gray-700 mt-1 border-t border-white/5 pt-1">
              Click to highlight · Double-click to open
            </div>
          )}
        </div>
      )}

      {/* Category legend — bottom right */}
      <div
        className="absolute right-3 flex flex-wrap gap-x-2 gap-y-1 justify-end max-w-[160px] z-10 transition-all duration-200"
        style={{ bottom: timelapsePlaying ? "9rem" : "5rem" }}
      >
        {Object.entries(CATEGORY_COLORS).filter(([k]) => k !== "General").map(([cat, color]) => (
          <div key={cat} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-[9px] text-gray-600">{cat}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
