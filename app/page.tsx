"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { SECTIONS, FEYNMAN_INSIGHTS } from "@/lib/content";

/* ─── tiny design tokens as inline style helpers ─── */
const S: Record<string, string> = {
  ink: "var(--ink)", ink2: "var(--ink2)", ink3: "var(--ink3)",
  paper: "var(--paper)", paper2: "var(--paper2)", paper3: "var(--paper3)",
  accent: "var(--accent)", accent2: "var(--accent2)", accent3: "var(--accent3)", accent4: "var(--accent4)",
  yellow: "var(--yellow)", border: "var(--border)", codeBg: "var(--code-bg)", codeFg: "var(--code-fg)",
};

/* ─── Types ─── */
type SearchResult = { id: string; type: string; section: string; title: string; excerpt: string; anchor: string; };
type QuizQuestion = { id: string; section: string; question: string; options: string[]; };
type Progress = { sections: string[]; quiz: string[]; score: number; };

/* ─── Dark Mode Toggle ─── */
function DarkModeToggle() {
  const [dark, setDark] = useState(true);
  useEffect(() => {
    setDark(document.documentElement.getAttribute("data-theme") !== "light");
  }, []);
  const click = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch(e) {}
  };
  return (
    <button onClick={click} style={{
      background: "none", border: "none", cursor: "pointer", 
      fontSize: "1.1rem", display: "flex", alignItems: "center", justifyContent: "center",
      width: 30, height: 30, borderRadius: "50%", color: S.ink,
      transition: "all 0.2s", opacity: 0.8
    }}
      onMouseEnter={e => e.currentTarget.style.background = S.paper2}
      onMouseLeave={e => e.currentTarget.style.background = "none"}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {dark ? "🌙" : "☀️"}
    </button>
  );
}

/* ─── Search Bar ─── */
function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length < 2) { setResults([]); setOpen(false); return; }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data); setOpen(data.length > 0);
    }, 200);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const typeColors: Record<string, string> = { concept: S.accent3, quiz: S.accent2, feynman: "var(--feynman-title)" };
  const typeLabels: Record<string, string> = { concept: "Concept", quiz: "Quiz", feynman: "💡 Insight" };

  return (
    <div ref={ref} style={{ position: "relative", width: 180 }}>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search…"
        style={{
          width: "100%", padding: "5px 10px 5px 28px",
          border: `1px solid var(--border-alpha)`, borderRadius: 4,
          fontFamily: "'JetBrains Mono', monospace", fontSize: "0.68rem",
          background: "var(--search-bg, rgba(255,255,255,0.6))", color: S.ink, outline: "none",
          backdropFilter: "blur(8px)",
          transition: "border 0.2s, width 0.3s",
        }}
        onFocus={e => { e.currentTarget.style.border = `1px solid ${S.accent}`; }}
        onBlur={e => { e.currentTarget.style.border = `1px solid var(--border-alpha)`; }}
      />
      <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: S.ink3, fontSize: "0.78rem", pointerEvents: "none" }}>⌕</span>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
          background: S.paper, border: `1px solid ${S.border}`, borderRadius: 8,
          boxShadow: "0 8px 32px rgba(0,0,0,0.1)", zIndex: 1000, overflow: "hidden",
        }}>
          {results.map(r => (
            <a key={r.id} href={`#${r.anchor}`} onClick={() => setOpen(false)}
              style={{ display: "block", padding: "12px 16px", textDecoration: "none", borderBottom: `1px solid ${S.border}` }}
              onMouseEnter={e => (e.currentTarget.style.background = S.paper2)}
              onMouseLeave={e => (e.currentTarget.style.background = S.paper)}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.62rem", fontWeight: 700, color: typeColors[r.type], background: `color-mix(in srgb, ${typeColors[r.type]} 15%, transparent)`, padding: "2px 7px", borderRadius: 3 }}>
                  {typeLabels[r.type]}
                </span>
                <span style={{ fontSize: "0.82rem", fontWeight: 600, color: S.ink }}>{r.title}</span>
              </div>
              <div style={{ fontSize: "0.78rem", color: S.ink3, lineHeight: 1.4 }}>{r.excerpt}</div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Progress Tracker ─── */
function ProgressBar({ progress }: { progress: Progress }) {
  const total = SECTIONS.length;
  const visited = progress.sections.length;
  const pct = Math.round((visited / total) * 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: 80, height: 6, background: S.paper3, borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: S.accent, transition: "width 0.4s ease", borderRadius: 3 }} />
      </div>
      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.68rem", color: S.ink3 }}>{visited}/{total} sections</span>
    </div>
  );
}

/* ─── Feynman Box ─── */
function FeynmanBox({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ borderLeft: `4px solid ${S.yellow}`, background: "var(--feynman-bg)", padding: "24px 28px", borderRadius: "0 8px 8px 0", margin: "32px 0" }}>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--feynman-title)", marginBottom: 10 }}>💡 Feynman Says</div>
      <p style={{ color: "var(--feynman-text)", fontStyle: "italic", margin: 0 }}>{children}</p>
    </div>
  );
}

/* ─── Code Block ─── */
function CodeBlock({ label, children }: { label?: string; children: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(children); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div style={{ margin: "24px 0" }}>
      {label && <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: S.ink3, marginBottom: 8 }}>{label}</div>}
      <div style={{ position: "relative" }}>
        <pre style={{ background: S.codeBg, color: S.codeFg, borderRadius: 8, padding: "24px 28px", fontFamily: "'JetBrains Mono',monospace", fontSize: "0.8rem", lineHeight: 1.65, overflowX: "auto" }}
          dangerouslySetInnerHTML={{ __html: children }} />
        <button onClick={copy} style={{ position: "absolute", top: 12, right: 12, background: copied ? S.accent2 : "var(--kopied-bg)", border: "none", color: S.paper, padding: "4px 10px", borderRadius: 4, cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: "0.65rem", transition: "all 0.2s" }}>
          {copied ? "✓ copied" : "copy"}
        </button>
      </div>
    </div>
  );
}

/* ─── Concept Card (expandable) ─── */
function ConceptCard({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border: `1px solid ${S.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 16 }}>
      <div onClick={() => setOpen(!open)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", cursor: "pointer", background: open ? S.paper3 : S.paper2, transition: "background 0.15s" }}
        onMouseEnter={e => (e.currentTarget.style.background = S.paper3)}
        onMouseLeave={e => (e.currentTarget.style.background = open ? S.paper3 : S.paper2)}
      >
        <h4 style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "1rem", fontWeight: 600, color: S.ink, margin: 0, textTransform: "none" }}>{title}</h4>
        <span style={{ fontSize: "1rem", color: S.ink3, transition: "transform 0.2s", transform: open ? "rotate(45deg)" : "none" }}>+</span>
      </div>
      {open && <div style={{ padding: "20px 24px", borderTop: `1px solid ${S.border}` }}>{children}</div>}
    </div>
  );
}

/* ─── Pipeline Stage ─── */
function PipelineStage({ status, title, children }: { status: "pass" | "run" | "fail"; title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const colors = { pass: S.accent2, run: S.yellow, fail: S.accent };
  const badges = { pass: { bg: "var(--pass-bg)", color: S.accent2, label: "PASS" }, run: { bg: "var(--run-bg)", color: "var(--dock-3-color)", label: "GATE" }, fail: { bg: "var(--fail-bg)", color: S.accent, label: "FAIL" } };
  const b = badges[status];
  return (
    <div onClick={() => setOpen(!open)} style={{ display: "flex", alignItems: "stretch", borderBottom: `1px solid ${S.border}`, cursor: "pointer", transition: "background 0.15s" }}
      onMouseEnter={e => (e.currentTarget.style.background = S.paper2)}
      onMouseLeave={e => (e.currentTarget.style.background = S.paper)}
    >
      <div style={{ width: 4, background: colors[status], flexShrink: 0 }} />
      <div style={{ flex: 1, padding: "16px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.65rem", fontWeight: 700, padding: "3px 8px", borderRadius: 3, background: b.bg, color: b.color }}>{b.label}</span>
          <span style={{ fontWeight: 500, fontSize: "0.9rem" }}>{title}</span>
        </div>
        {open && <div style={{ fontSize: "0.82rem", color: S.ink3, marginTop: 8 }}>{children}</div>}
      </div>
    </div>
  );
}

/* ─── Tabs ─── */
function Tabs({ tabs }: { tabs: { label: string; content: React.ReactNode }[] }) {
  const [active, setActive] = useState(0);
  return (
    <div>
      <div style={{ display: "flex", borderBottom: `1px solid ${S.border}` }}>
        {tabs.map((t, i) => (
          <button key={i} onClick={() => setActive(i)} style={{
            fontFamily: "'JetBrains Mono',monospace", fontSize: "0.75rem", fontWeight: 600,
            padding: "10px 20px", border: "none", background: "none", cursor: "pointer",
            color: active === i ? S.accent : S.ink3,
            borderBottom: active === i ? `2px solid ${S.accent}` : "2px solid transparent",
            marginBottom: -1, transition: "all 0.2s", letterSpacing: "0.04em"
          }}>{t.label}</button>
        ))}
      </div>
      <div style={{ paddingTop: 28 }}>{tabs[active].content}</div>
    </div>
  );
}

/* ─── Quiz Component ─── */
function QuizSection({ onAnswer }: { onAnswer: (questionId: string, correct: boolean) => void }) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<{ correct: boolean; correctAnswer: number; explanation: string } | null>(null);
  const [filter, setFilter] = useState("all");
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(0);

  useEffect(() => {
    fetch("/api/quiz").then(r => r.json()).then(setQuestions);
  }, []);

  const filtered = filter === "all" ? questions : questions.filter(q => q.section === filter);
  const q = filtered[current];

  const submit = async () => {
    if (selected === null || !q) return;
    const res = await fetch("/api/quiz", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ questionId: q.id, selectedAnswer: selected }) });
    const data = await res.json();
    setResult(data);
    if (data.correct) setScore(s => s + 1);
    setAnswered(a => a + 1);
    onAnswer(q.id, data.correct);
  };

  const next = () => {
    setSelected(null); setResult(null);
    setCurrent(c => (c + 1) % filtered.length);
  };

  if (!q) return <div style={{ padding: 40, textAlign: "center", color: S.ink3, fontFamily: "'JetBrains Mono',monospace", fontSize: "0.8rem" }}>Loading questions…</div>;

  const accuracy = answered > 0 ? Math.round((score / answered) * 100) : 0;

  return (
    <div>
      {/* Filter + Stats */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["all", ...SECTIONS.map(s => s.id)].map(f => (
            <button key={f} onClick={() => { setFilter(f); setCurrent(0); setSelected(null); setResult(null); }}
              style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.68rem", padding: "4px 12px", borderRadius: 4, border: `1px solid ${filter === f ? S.accent : S.border}`, background: filter === f ? "var(--active-bg)" : S.paper, color: filter === f ? S.accent : S.ink3, cursor: "pointer" }}>
              {f === "all" ? "All" : SECTIONS.find(s => s.id === f)?.num + " " + (SECTIONS.find(s => s.id === f)?.title || f)}
            </button>
          ))}
        </div>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.72rem", color: S.ink3 }}>
          Score: <span style={{ color: accuracy >= 70 ? S.accent2 : S.accent, fontWeight: 700 }}>{score}/{answered}</span> ({accuracy}%)
        </div>
      </div>

      {/* Question Card */}
      <div style={{ background: S.paper, border: `1px solid ${S.border}`, borderRadius: 12, padding: 32 }}>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.68rem", color: S.ink3, marginBottom: 16 }}>
          Q{current + 1} / {filtered.length} · {SECTIONS.find(s => s.id === q.section)?.title}
        </div>
        <h3 style={{ fontFamily: "'Fraunces',serif", fontSize: "1.2rem", fontWeight: 700, marginBottom: 24, color: S.ink, letterSpacing: "-0.02em" }}>{q.question}</h3>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {q.options.map((opt, i) => {
            let bg = S.paper, border = S.border, color = S.ink;
            if (result) {
              if (i === result.correctAnswer) { bg = "var(--pass-bg)"; border = S.accent2; color = S.accent2; }
              else if (i === selected && !result.correct) { bg = "var(--fail-bg)"; border = S.accent; color = S.accent; }
            } else if (selected === i) { bg = "var(--block-b-bg)"; border = S.accent3; color = S.accent3; }
            return (
              <button key={i} onClick={() => !result && setSelected(i)} style={{
                background: bg, border: `1px solid ${border}`, borderRadius: 8, padding: "12px 16px",
                textAlign: "left", cursor: result ? "default" : "pointer", fontSize: "0.9rem",
                color, fontFamily: "'DM Sans',sans-serif", transition: "all 0.15s",
                display: "flex", alignItems: "center", gap: 12
              }}>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.72rem", fontWeight: 700, minWidth: 22, color: "inherit", opacity: 0.6 }}>{["A", "B", "C", "D"][i]}</span>
                {opt}
                {result && i === result.correctAnswer && <span style={{ marginLeft: "auto" }}>✓</span>}
                {result && i === selected && !result.correct && <span style={{ marginLeft: "auto" }}>✗</span>}
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {result && (
          <div style={{ marginTop: 20, padding: "16px 20px", background: result.correct ? "var(--pass-bg)" : "var(--fail-bg)", borderRadius: 8, border: `1px solid ${result.correct ? "var(--block-g-border)" : "var(--block-c-border)"}` }}>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.72rem", fontWeight: 700, color: result.correct ? S.accent2 : S.accent, marginBottom: 8 }}>
              {result.correct ? "✓ Correct!" : "✗ Not quite."}
            </div>
            <p style={{ fontSize: "0.88rem", color: S.ink2, margin: 0, lineHeight: 1.6 }}>{result.explanation}</p>
          </div>
        )}

        <div style={{ marginTop: 20, display: "flex", gap: 12 }}>
          {!result ? (
            <button onClick={submit} disabled={selected === null} style={{
              padding: "10px 24px", background: selected !== null ? S.accent : S.paper3,
              color: selected !== null ? S.paper : S.ink3, border: "none", borderRadius: 6,
              cursor: selected !== null ? "pointer" : "not-allowed", fontSize: "0.88rem",
              fontFamily: "'DM Sans',sans-serif", fontWeight: 500, transition: "all 0.2s"
            }}>Submit Answer</button>
          ) : (
            <button onClick={next} style={{ padding: "10px 24px", background: S.ink, color: S.paper, border: "none", borderRadius: 6, cursor: "pointer", fontSize: "0.88rem", fontFamily: "'DM Sans',sans-serif", fontWeight: 500 }}>
              Next Question →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Kernel Layer Diagram ─── */
function KernelDiagram() {
  const layers = [
    { label: "User Space", sub: "Your app lives here", blocks: [["c", "nginx process"], ["g", "python app"], ["b", "redis-server"], ["v", "your code"]] },
    { label: "Namespaces", sub: "What you can see", style: { background: "var(--layer-ns-bg)" }, blocks: [["c", "pid ns → own process tree"], ["c", "net ns → own network stack"], ["c", "mnt ns → own filesystem view"], ["c", "uts ns → own hostname"], ["c", "ipc ns → own IPC resources"], ["c", "user ns → own UID/GID mapping"]] },
    { label: "cgroups v2", sub: "What you can use", style: { background: "var(--layer-cg-bg)" }, blocks: [["g", "cpu.max → CPU throttle"], ["g", "memory.max → RAM cap"], ["g", "blkio → disk I/O limit"], ["g", "pids.max → process count"], ["g", "net_cls → network priority"]] },
    { label: "seccomp / LSM", sub: "What you can do", style: { background: "var(--layer-sec-bg)" }, blocks: [["v", "seccomp-bpf → syscall filter"], ["v", "AppArmor / SELinux → MAC"], ["v", "capabilities → drop root"]] },
    { label: "Linux Kernel", sub: "syscalls, VFS, TCP/IP", style: { background: "var(--block-b-bg)" }, blocks: [["b", "clone()"], ["b", "unshare()"], ["b", "setns()"], ["b", "pivot_root()"], ["b", "mount()"], ["b", "seccomp()"]] },
  ];
  const blockColors: Record<string, { bg: string; border: string; color: string }> = {
    c: { bg: "var(--fail-bg)", border: "var(--block-c-border)", color: S.accent },
    g: { bg: "var(--pass-bg)", border: "var(--block-g-border)", color: S.accent2 },
    b: { bg: "var(--block-b-bg)", border: "var(--block-b-border)", color: S.accent3 },
    v: { bg: "var(--block-v-bg)", border: "var(--block-v-border)", color: S.accent4 },
  };
  return (
    <div style={{ border: `1px solid ${S.border}`, borderRadius: 8, overflow: "hidden" }}>
      {layers.map((layer, i) => (
        <div key={i} style={{ display: "flex", alignItems: "stretch", borderBottom: i < layers.length - 1 ? `1px solid ${S.border}` : "none" }}>
          <div style={{ width: 180, minWidth: 180, background: S.paper2, borderRight: `1px solid ${S.border}`, padding: "14px 18px", display: "flex", flexDirection: "column", justifyContent: "center", ...layer.style }}>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.72rem", fontWeight: 600 }}>{layer.label}</div>
            <div style={{ fontSize: "0.65rem", color: S.ink3, marginTop: 3 }}>{layer.sub}</div>
          </div>
          <div style={{ flex: 1, padding: "14px 20px", display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
            {layer.blocks.map(([type, label], j) => {
              const c = blockColors[type];
              return <div key={j} style={{ padding: "5px 12px", borderRadius: 4, fontFamily: "'JetBrains Mono',monospace", fontSize: "0.72rem", border: `1px solid ${c.border}`, background: c.bg, color: c.color }}>{label}</div>;
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── K8s Cluster Visual ─── */
function ClusterVisual() {
  return (
    <div style={{ border: `2px dashed ${S.accent3}`, borderRadius: 16, padding: 28, background: "var(--cluster-bg)", margin: "24px 0" }}>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.72rem", fontWeight: 700, color: S.accent3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>☸ Kubernetes Cluster</div>

      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.72rem", color: S.accent3, fontWeight: 700, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>Control Plane</div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
        {[
          { title: "kube-apiserver", comps: ["REST API gateway", "AuthN / AuthZ / Admission", "Writes to etcd only"], note: "Every kubectl command hits this. No business logic — just validate, persist, return." },
          { title: "etcd", comps: ["Distributed KV store", "Raft consensus", "Source of truth"], note: "All cluster state lives here. If etcd dies, cluster is read-only. Back this up." },
          { title: "kube-scheduler", comps: ["Pod → Node binding", "Filters + Scorers", "Watches unbound pods"], note: "Watches for pods with no nodeName. Scores nodes. Writes nodeName to etcd." },
          { title: "controller-manager", comps: ["ReplicaSet controller", "Deployment controller", "Node controller"], note: "~30 controllers in one binary, each running its own reconciliation loop." },
        ].map((node, i) => (
          <div key={i} style={{ flex: 1, minWidth: 180, background: S.paper, border: `1px solid var(--block-b-border)`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.72rem", fontWeight: 700, color: S.accent3, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid var(--cluster-node-border1-inner)" }}>{node.title}</div>
            {node.comps.map((c, j) => <div key={j} style={{ fontSize: "0.7rem", padding: "5px 10px", marginBottom: 6, borderRadius: 4, background: "var(--block-b-bg)", border: "1px solid var(--cluster-node-border1-alt)", color: S.accent3, fontFamily: "'JetBrains Mono',monospace" }}>{c}</div>)}
            <div style={{ fontSize: "0.72rem", color: S.ink3, marginTop: 8 }}>{node.note}</div>
          </div>
        ))}
      </div>

      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.72rem", color: S.accent2, fontWeight: 700, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>Worker Nodes</div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {[
          { title: "kubelet", comps: ["Node agent", "Pod lifecycle via CRI", "Reports node status"], extra: <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}><div style={{ background: "var(--pass-bg)", border: "1px solid var(--cluster-node-border2-alt)", borderRadius: 6, padding: "6px 12px", fontFamily: "'JetBrains Mono',monospace", fontSize: "0.68rem", color: S.accent2 }}>pod: nginx</div><div style={{ background: "var(--pass-bg)", border: "1px solid var(--cluster-node-border2-alt)", borderRadius: 6, padding: "6px 12px", fontFamily: "'JetBrains Mono',monospace", fontSize: "0.68rem", color: S.accent2 }}>pod: api</div></div> },
          { title: "kube-proxy", comps: ["Service networking", "iptables / IPVS rules", "Load balancing"], note: "Programs iptables/IPVS to route ClusterIP traffic to pod endpoints." },
          { title: "container runtime", comps: ["containerd (CRI)", "runc (OCI)", "Same as standalone Docker"], note: "The exact same stack as Docker — kubelet just calls containerd's gRPC API directly." },
        ].map((node, i) => (
          <div key={i} style={{ flex: 1, minWidth: 180, background: S.paper, border: `1px solid var(--block-g-border)`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.72rem", fontWeight: 700, color: S.accent2, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid var(--cluster-node-border2-inner)" }}>{node.title}</div>
            {node.comps.map((c, j) => <div key={j} style={{ fontSize: "0.7rem", padding: "5px 10px", marginBottom: 6, borderRadius: 4, background: "var(--pass-bg)", border: "1px solid var(--block-g-border)", color: S.accent2, fontFamily: "'JetBrains Mono',monospace" }}>{c}</div>)}
            {(node as any).note && <div style={{ fontSize: "0.72rem", color: S.ink3, marginTop: 8 }}>{(node as any).note}</div>}
            {(node as any).extra}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Timeline ─── */
function Timeline({ items }: { items: { title: string; body: string }[] }) {
  return (
    <div style={{ position: "relative", paddingLeft: 40 }}>
      <div style={{ position: "absolute", left: 12, top: 0, bottom: 0, width: 2, background: S.border }} />
      {items.map((item, i) => (
        <div key={i} style={{ position: "relative", marginBottom: 36 }}>
          <div style={{ position: "absolute", left: -32, top: 6, width: 10, height: 10, borderRadius: "50%", background: S.accent, border: `2px solid ${S.paper}`, boxShadow: `0 0 0 2px ${S.accent}` }} />
          <h4 style={{ fontSize: "0.95rem", fontWeight: 600, color: S.ink, marginBottom: 6, fontFamily: "'DM Sans',sans-serif", textTransform: "none" }}>{item.title}</h4>
          <p style={{ fontSize: "0.88rem", color: S.ink3, margin: 0 }}>{item.body}</p>
        </div>
      ))}
    </div>
  );
}

/* ─── Section Wrapper (marks visited) ─── */
function SectionWrapper({ id, onVisible, children }: { id: string; onVisible: (id: string) => void; children: React.ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const called = useRef(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !called.current) { called.current = true; onVisible(id); }
    }, { threshold: 0.15 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [id, onVisible]);
  return <section ref={ref} id={id} style={{ padding: "100px 80px", borderTop: `1px solid ${S.border}`, scrollMarginTop: 80 }}>{children}</section>;
}

const SL = ({ num, title }: { num: string; title: string }) => (
  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: S.ink3, display: "flex", alignItems: "center", gap: 12, marginBottom: 48 }}>
    <span style={{ color: S.accent }}>{num}</span>
    {title}
    <div style={{ flex: 1, height: 1, background: S.border }} />
  </div>
);

const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: "clamp(2rem,4vw,3.2rem)", fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.03em", marginBottom: 32 }}>{children}</h2>
);

const H3 = ({ children, mt }: { children: React.ReactNode; mt?: number }) => (
  <h3 style={{ fontFamily: "'Fraunces',serif", fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 16, marginTop: mt || 0 }}>{children}</h3>
);

/* ─── Main Page ─── */
export default function Home() {
  const [progress, setProgress] = useState<Progress>({ sections: [], quiz: [], score: 0 });
  const [scrollPct, setScrollPct] = useState(0);

  useEffect(() => {
    fetch("/api/progress").then(r => r.json()).then(setProgress).catch(() => { });
  }, []);

  useEffect(() => {
    const handler = () => {
      const pct = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      setScrollPct(Math.min(pct, 100));
    };
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const markSection = useCallback((id: string) => {
    if (progress.sections.includes(id)) return;
    fetch("/api/progress", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "section", sectionId: id }) })
      .then(r => r.json()).then(setProgress).catch(() => { });
  }, [progress.sections]);

  const handleQuizAnswer = useCallback((questionId: string, correct: boolean) => {
    fetch("/api/progress", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "quiz", questionId, correct }) })
      .then(r => r.json()).then(setProgress).catch(() => { });
  }, []);

  return (
    <>
      {/* ── COPY PROTECTION + LIQUID GLASS NAV STYLES ── */}
      <style>{`
        * { -webkit-user-select: none !important; -moz-user-select: none !important; -ms-user-select: none !important; user-select: none !important; }
        input, textarea { -webkit-user-select: text !important; -moz-user-select: text !important; user-select: text !important; }
        @keyframes navFloat {
          0%,100% { transform: translateX(-50%) translateY(0px); }
          50% { transform: translateX(-50%) translateY(-3px); }
        }
        @keyframes glassGlow {
          0%,100% { box-shadow: 0 8px 32px rgba(200,75,49,0.07), 0 2px 12px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.85), inset 0 -1px 0 rgba(255,255,255,0.3); }
          50% { box-shadow: 0 14px 44px rgba(200,75,49,0.13), 0 4px 20px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -1px 0 rgba(255,255,255,0.45); }
        }
        .liquid-nav { animation: navFloat 6s ease-in-out infinite, glassGlow 4s ease-in-out infinite; }
        .liquid-nav::before { content:''; position:absolute; inset:0; border-radius:50px; background:linear-gradient(105deg,rgba(255,255,255,0.55) 0%,rgba(255,255,255,0.08) 45%,rgba(255,255,255,0.5) 100%); pointer-events:none; z-index:1; }
        .liquid-nav::after { content:''; position:absolute; inset:0; border-radius:50px; background:linear-gradient(180deg,rgba(255,255,255,0.55) 0%,transparent 55%); pointer-events:none; z-index:1; }
        .nav-link-pill { position:relative; z-index:2; transition:color 0.2s, opacity 0.2s !important; }
        .nav-link-pill:hover { color:var(--accent) !important; opacity:0.85; }
        .nav-logo-btn { cursor:pointer; transition:all 0.2s !important; }
        .nav-logo-btn:hover { opacity:0.7; transform:scale(0.97) !important; }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(6px)} }
      `}</style>

      {/* FLOATING LIQUID GLASS NAV */}
      <nav className="liquid-nav" style={{
        position: "fixed", top: 18, left: "50%", transform: "translateX(-50%)",
        zIndex: 999,
        background: "var(--nav-glass-bg)",
        backdropFilter: "blur(28px) saturate(200%) brightness(1.08)",
        WebkitBackdropFilter: "blur(28px) saturate(200%) brightness(1.08)",
        border: "1px solid rgba(255,255,255,0.68)",
        borderRadius: 50,
        padding: "0 12px 0 20px",
        height: 52,
        display: "flex", alignItems: "center", gap: 4,
        whiteSpace: "nowrap",
        minWidth: "min(900px, 92vw)",
        maxWidth: "92vw",
      }}>
        {/* Logo — click reloads to home */}
        <button
          className="nav-logo-btn"
          onClick={() => { window.location.href = "/"; }}
          style={{
            fontFamily: "'Fraunces',serif", fontSize: "1rem", fontWeight: 700,
            letterSpacing: "-0.02em", background: "none", border: "none",
            color: "var(--ink)", padding: "0 8px 0 0", marginRight: 4,
            flexShrink: 0, position: "relative", zIndex: 2,
          }}
        >
          Docker<span style={{ color: "var(--accent)" }}>&amp;</span>K8s
        </button>

        <div style={{ width: 1, height: 18, background: "var(--border-alpha)", flexShrink: 0, position: "relative", zIndex: 2 }} />

        {/* Section links */}
        <div style={{ display: "flex", gap: 2, alignItems: "center", flex: 1, position: "relative", zIndex: 2 }}>
          {SECTIONS.map(s => (
            <a key={s.id} href={`#${s.id}`} className="nav-link-pill" style={{
              fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase",
              textDecoration: "none",
              color: progress.sections.includes(s.id) ? "var(--ink)" : "var(--ink3)",
              padding: "4px 9px", borderRadius: 6,
              background: "transparent",
              fontFamily: "'JetBrains Mono',monospace",
              display: "flex", alignItems: "center", gap: 3,
              transition: "color 0.2s",
            }}>
              {s.title.split(" ")[0]}
            </a>
          ))}
        </div>

        <div style={{ width: 1, height: 18, background: "var(--border-alpha)", flexShrink: 0, position: "relative", zIndex: 2 }} />

        {/* Search */}
        <div style={{ position: "relative", zIndex: 2, paddingLeft: 8 }}>
          <SearchBar />
        </div>

        {/* Progress pill */}
        <div style={{ position: "relative", zIndex: 2, marginLeft: 6 }}>
          <DarkModeToggle />
        </div>
      </nav>

      {/* Scroll progress line */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000, height: 3, pointerEvents: "none" }}>
        <div style={{ height: "100%", background: "linear-gradient(90deg, var(--accent), var(--accent-glow))", width: `${scrollPct}%`, transition: "width 0.1s linear", borderRadius: "0 2px 2px 0" }} />
      </div>

      {/* HERO */}
      <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "120px 80px 80px", position: "relative", overflow: "hidden", border: "none" }}>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)", backgroundSize: "60px 60px", opacity: 0.4 }} />
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.1em", color: S.accent, textTransform: "uppercase", display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
          <span style={{ width: 32, height: 2, background: S.accent, display: "block" }} />
          Deep Architecture · Feynman Edition
        </div>
        <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: "clamp(3rem,7vw,6.5rem)", fontWeight: 900, lineHeight: 0.95, letterSpacing: "-0.04em", maxWidth: 900 }}>
          What actually <em style={{ fontStyle: "italic", color: S.accent }}>happens</em> when you run a container?
        </h1>
        <p style={{ maxWidth: 560, marginTop: 28, fontSize: "1.05rem", color: S.ink3, fontWeight: 300, lineHeight: 1.7 }}>
          A ruthlessly honest, kernel-to-cluster breakdown of Docker and Kubernetes — not the docs version, the real version. Every syscall, every reconciliation loop, every deployment manifested.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 36 }}>
          {[["r", "namespaces"], ["r", "cgroups"], ["g", "overlay FS"], ["g", "OCI"], ["b", "etcd"], ["b", "kube-apiserver"], ["b", "kubelet"], ["v", "control plane"], ["v", "CI/CD → GitOps"]].map(([type, label]) => {
            const chipColors: Record<string, { border: string; color: string }> = { r: { border: S.accent, color: S.accent }, g: { border: S.accent2, color: S.accent2 }, b: { border: S.accent3, color: S.accent3 }, v: { border: S.accent4, color: S.accent4 } };
            const c = chipColors[type];
            return <div key={label} style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.72rem", padding: "5px 14px", borderRadius: 3, border: `1px solid ${c.border}`, color: c.color, background: S.paper }}>{label}</div>;
          })}
        </div>
        <div style={{ marginTop: 64, fontFamily: "'JetBrains Mono',monospace", fontSize: "0.72rem", color: S.ink3, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ animation: "bounce 2s infinite", display: "inline-block" }}>↓</span>
          scroll to begin the descent
        </div>
        <style>{`@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(6px)} }`}</style>
      </section>

      {/* ── SECTION 1: LINUX KERNEL ── */}
      <SectionWrapper id="linux-kernel" onVisible={markSection}>
        <SL num="01" title="The Foundation" />
        <H2>Linux Kernel: The Real Container Engine</H2>
        <FeynmanBox>Docker didn&apos;t invent containers. Linux did — years before Docker existed. Docker is really a very good user-friendly wrapper around kernel features. If you can&apos;t explain why a container is NOT a VM, you don&apos;t understand containers yet.</FeynmanBox>
        <p style={{ color: S.ink2, marginBottom: 16 }}>When you type <code style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.82em", background: S.paper3, padding: "2px 7px", borderRadius: 3, color: S.accent }}>docker run nginx</code>, you&apos;re asking the kernel to do three specific things simultaneously. Let&apos;s dissect each one. No hand-waving.</p>

        <div style={{ background: S.paper, border: `1px solid ${S.border}`, borderRadius: 12, padding: 40, margin: "40px 0" }}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: S.ink3, marginBottom: 32 }}>Linux Kernel — Isolation Primitives Used by Containers</div>
          <KernelDiagram />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
          <div>
            <H3>Namespaces — "What You Can See"</H3>
            <p style={{ color: S.ink2 }}>A namespace wraps a global resource and presents processes inside it with an illusion they have their own isolated instance. The key syscall is <code style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.82em", background: S.paper3, padding: "2px 7px", borderRadius: 3, color: S.accent }}>clone(CLONE_NEWPID | CLONE_NEWNET | ...)</code>.</p>
            <p style={{ color: S.ink2 }}>When PID namespace is created: the first process inside it gets PID 1 — even though the host kernel sees it as PID 7823. Two different realities, same machine. That&apos;s the trick.</p>
            <FeynmanBox>Think of namespaces like <strong>one-way mirrors in interrogation rooms</strong>. Your container thinks it&apos;s alone in the universe. The host kernel sees everything.</FeynmanBox>
          </div>
          <div>
            <H3>cgroups v2 — "What You Can Use"</H3>
            <p style={{ color: S.ink2 }}>Control groups enforce resource accounting and limits. The cgroup hierarchy is exposed via a virtual filesystem at <code style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.82em", background: S.paper3, padding: "2px 7px", borderRadius: 3, color: S.accent }}>/sys/fs/cgroup/</code>. Every container gets its own subtree.</p>
            <CodeBlock label="Inspect a container's cgroup limits">
              {`<span style="color:var(--sh-comment)"># Find container's cgroup path</span>
<span style="color:var(--sh-func)">cat /proc/$(docker inspect \\
  --format='{{.State.Pid}}' nginx)/cgroup</span>

<span style="color:var(--sh-comment)"># Read memory limit directly</span>
<span style="color:var(--sh-func)">cat /sys/fs/cgroup/system.slice/\\
  docker-&lt;id&gt;.scope/memory.max</span>
<span style="color:var(--sh-comment)"># → 268435456 (256MB)</span>`}
            </CodeBlock>
          </div>
        </div>
      </SectionWrapper>

      {/* ── SECTION 2: DOCKER ARCHITECTURE ── */}
      <SectionWrapper id="docker-arch" onVisible={markSection}>
        <SL num="02" title="Docker Architecture" />
        <H2>The 5-Component Runtime Stack</H2>
        <p style={{ color: S.ink2 }}>Most people think &quot;Docker&quot; is one thing. It&apos;s actually a layered stack of 5 distinct components, each with a specific contract. Understanding their boundaries is how you debug production issues at 3am.</p>

        <div style={{ background: S.paper, border: `1px solid ${S.border}`, borderRadius: 12, padding: 40, margin: "40px 0" }}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: S.ink3, marginBottom: 32 }}>Docker Component Stack — Who Calls Who</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0, maxWidth: 700 }}>
            {[
              { emoji: "🖥️", color: S.accent, bg: "var(--active-bg)", border: "var(--block-c-border)", title: "docker CLI", desc: "REST API calls to Docker daemon over Unix socket", sep: "↓ HTTP REST /var/run/docker.sock" },
              { emoji: "⚙️", color: "var(--dock-2-color)", bg: "var(--dock-2-bg)", border: "var(--dock-2-border)", title: "dockerd (Docker Daemon)", desc: "Image management, network, volumes, build cache. Delegates container lifecycle to containerd.", sep: "↓ gRPC /run/containerd/containerd.sock" },
              { emoji: "📦", color: "var(--dock-3-color)", bg: "var(--run-bg)", border: "var(--dock-3-border)", title: "containerd", desc: "Industry-standard container runtime. Pulls images, manages snapshots, creates containers via shim.", sep: "↓ OCI Runtime Spec exec()" },
              { emoji: "🔧", color: S.accent3, bg: "var(--dock-4-bg)", border: "var(--block-b-border)", title: "runc (OCI Runtime)", desc: "Calls clone(), mount(), pivot_root(), execve(). Sets up namespaces + cgroups. Then exits.", sep: "↓ Linux syscalls" },
              { emoji: "🐧", color: S.accent2, bg: "var(--pass-bg)", border: "var(--block-g-border)", title: "Linux Kernel", desc: "Namespaces + cgroups + OverlayFS. The actual isolation happens here.", sep: null },
            ].map((layer, i) => (
              <div key={i}>
                <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", background: layer.bg, border: `1px solid ${layer.border}`, borderRadius: i === 0 ? "8px 8px 0 0" : i === 4 ? "0 0 8px 8px" : 0, borderTop: i > 0 ? "none" : undefined }}>
                  <div style={{ fontSize: "1.4rem" }}>{layer.emoji}</div>
                  <div>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.8rem", fontWeight: 700, color: layer.color }}>{layer.title}</div>
                    <div style={{ fontSize: "0.82rem", color: S.ink3 }}>{layer.desc}</div>
                  </div>
                </div>
                {layer.sep && <div style={{ display: "flex", justifyContent: "center", fontFamily: "'JetBrains Mono',monospace", fontSize: "0.75rem", color: S.ink3, padding: "4px 0" }}>{layer.sep}</div>}
              </div>
            ))}
          </div>
        </div>

        <FeynmanBox>Why does runc exit after starting the container? Because the container&apos;s main process (PID 1 in its namespace) is now running. runc&apos;s job is done. It&apos;s like a rocket stage — it fires, does its job, detaches. The payload keeps flying.</FeynmanBox>

        <H3>The containerd-shim: The Unsung Hero</H3>
        <p style={{ color: S.ink2 }}>Between containerd and your container lives a tiny process called <code style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.82em", background: S.paper3, padding: "2px 7px", borderRadius: 3, color: S.accent }}>containerd-shim-runc-v2</code>. One shim per container. It survives even if containerd restarts. Without it, when containerd dies, all containers die too. The shim owns the container&apos;s stdin/stdout pipes and reports back exit codes to containerd when it restarts.</p>
      </SectionWrapper>

      {/* ── SECTION 3: IMAGES ── */}
      <SectionWrapper id="images" onVisible={markSection}>
        <SL num="03" title="Images & OverlayFS" />
        <H2>How Layers Actually Work on Disk</H2>
        <Tabs tabs={[
          {
            label: "OverlayFS",
            content: (
              <div>
                <p style={{ color: S.ink2 }}>Docker images are stored as a stack of read-only layers using <strong>OverlayFS</strong> — a Linux union filesystem. When a container starts, one writable layer is added on top (the <code style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.82em", background: S.paper3, padding: "2px 7px", borderRadius: 3, color: S.accent }}>upperdir</code>).</p>
                <div style={{ background: S.paper, border: `1px solid ${S.border}`, borderRadius: 12, padding: 40, margin: "40px 0" }}>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: S.ink3, marginBottom: 32 }}>OverlayFS Mount Structure</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 0, maxWidth: 600 }}>
                    {[
                      { bg: "var(--pass-bg)", border: "var(--block-g-border)", color: S.accent2, title: "merged/ (container view)", sub: "What the container sees — unified view of all layers", r: "8px 8px 0 0", op: 1 },
                      { bg: "var(--dock-2-bg)", border: "var(--dock-2-border)", color: "var(--dock-2-color)", title: "upperdir/ (container layer)", sub: 'Writable. New files written here. Deleted files marked with "whiteout" entries.', r: 0, op: 1 },
                      { bg: "var(--block-b-bg)", border: "var(--block-b-border)", color: S.accent3, title: "lowerdir[n] — Image Layer N (top)", sub: "Read-only. e.g. your app code COPY", r: 0, op: 1 },
                      { bg: "var(--block-b-bg)", border: "var(--block-b-border)", color: S.accent3, title: "lowerdir[n-1] — Image Layer N-1", sub: "Read-only. e.g. apt-get install packages", r: 0, op: 0.85 },
                      { bg: "var(--block-b-bg)", border: "var(--block-b-border)", color: S.accent3, title: "lowerdir[0] — Base Image Layer", sub: "e.g. ubuntu:22.04 filesystem", r: "0 0 8px 8px", op: 0.65 },
                    ].map((layer, i) => (
                      <div key={i} style={{ padding: "14px 20px", background: layer.bg, border: `1px solid ${layer.border}`, borderTop: i > 0 ? "none" : undefined, borderRadius: layer.r, fontFamily: "'JetBrains Mono',monospace", fontSize: "0.8rem", opacity: layer.op }}>
                        <strong style={{ color: layer.color }}>{layer.title}</strong><br />
                        <span style={{ color: S.ink3, fontSize: "0.72rem" }}>{layer.sub}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 16, fontSize: "0.82rem", color: S.ink3 }}>The <strong>copy-on-write</strong> mechanism: when a container modifies a file from a lower layer, the entire file is first copied to upperdir, then modified. This is why writing to many large files inside containers is slow.</div>
                </div>
              </div>
            )
          },
          {
            label: "Build Process",
            content: (
              <div>
                <p style={{ color: S.ink2 }}>Each instruction in a Dockerfile produces exactly one layer. The build context is sent to dockerd. BuildKit parallelizes independent build stages and uses a content-addressable cache.</p>
                <CodeBlock label="What each Dockerfile instruction actually does">
                  {`<span style="color:var(--sh-comment)"># Layer 1: FROM — pull base image, set lowerdir stack</span>
<span style="color:var(--sh-kw)">FROM</span> <span style="color:var(--sh-str)">python:3.12-slim</span>

<span style="color:var(--sh-comment)"># Layer 2: RUN — executes in a temp container,
# commits resulting filesystem diff as a new layer</span>
<span style="color:var(--sh-kw)">RUN</span> <span style="color:var(--sh-func)">apt-get update && apt-get install -y libpq-dev</span>

<span style="color:var(--sh-comment)"># Layer 3: COPY — adds files using SHA256 content addressing</span>
<span style="color:var(--sh-kw)">COPY</span> requirements.txt /app/

<span style="color:var(--sh-comment)"># Layer 4: cached if requirements.txt SHA256 unchanged!</span>
<span style="color:var(--sh-kw)">RUN</span> <span style="color:var(--sh-func)">pip install -r /app/requirements.txt</span>

<span style="color:var(--sh-comment)"># Layer 5: COPY app code — changes often, so put LAST</span>
<span style="color:var(--sh-kw)">COPY</span> . /app/

<span style="color:var(--sh-kw)">EXPOSE</span> <span style="color:var(--sh-num)">8000</span>
<span style="color:var(--sh-kw)">CMD</span> [<span style="color:var(--sh-str)">"uvicorn"</span>, <span style="color:var(--sh-str)">"main:app"</span>, <span style="color:var(--sh-str)">"--host"</span>, <span style="color:var(--sh-str)">"0.0.0.0"</span>]`}
                </CodeBlock>
              </div>
            )
          },
          {
            label: "Multi-Stage Builds",
            content: (
              <div>
                <p style={{ color: S.ink2 }}>Multi-stage builds solve a fundamental problem: build tools (gcc, pip, Maven) must not ship in production images. Multiple <code style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.82em", background: S.paper3, padding: "2px 7px", borderRadius: 3, color: S.accent }}>FROM</code> statements — only the final stage ships.</p>
                <CodeBlock label="Multi-stage: 900MB → ~120MB">
                  {`<span style="color:var(--sh-comment)"># STAGE 1: Builder — has ALL build deps</span>
<span style="color:var(--sh-kw)">FROM</span> <span style="color:var(--sh-str)">python:3.12</span> AS builder
<span style="color:var(--sh-kw)">WORKDIR</span> /build
<span style="color:var(--sh-kw)">COPY</span> requirements.txt .
<span style="color:var(--sh-kw)">RUN</span> <span style="color:var(--sh-func)">pip install --prefix=/install -r requirements.txt</span>

<span style="color:var(--sh-comment)"># STAGE 2: Production — only runtime</span>
<span style="color:var(--sh-kw)">FROM</span> <span style="color:var(--sh-str)">python:3.12-slim</span>
<span style="color:var(--sh-comment)"># Only copy compiled artifacts — no pip, no gcc</span>
<span style="color:var(--sh-kw)">COPY</span> --from=builder /install /usr/local
<span style="color:var(--sh-kw)">COPY</span> --from=builder /build/app /app

<span style="color:var(--sh-comment)"># No build tools in final image ✓
# Trivy has far less attack surface to scan ✓
# Image push/pull is 7x faster ✓</span>`}
                </CodeBlock>
              </div>
            )
          },
          {
            label: "Layer Cache",
            content: (
              <div>
                <FeynmanBox>Layer cache is a <strong>Merkle tree</strong>. Each node&apos;s identity is derived from its content AND its parents. Change anything upstream, and the entire subtree gets a new identity — exactly like Git commits.</FeynmanBox>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                  <div style={{ background: "var(--fail-bg)", border: `1px solid var(--block-c-border)`, borderRadius: 8, padding: 20 }}>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.72rem", fontWeight: 700, color: S.accent, marginBottom: 12 }}>❌ BAD ORDER — slow builds</div>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.78rem", color: S.ink2, lineHeight: 1.8 }}>
                      COPY . /app/<br />RUN pip install ...<br />
                      <span style={{ color: S.accent, fontSize: "0.68rem" }}>Every code change invalidates pip layer</span>
                    </div>
                  </div>
                  <div style={{ background: "var(--pass-bg)", border: `1px solid var(--block-g-border)`, borderRadius: 8, padding: 20 }}>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.72rem", fontWeight: 700, color: S.accent2, marginBottom: 12 }}>✓ GOOD ORDER — fast builds</div>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.78rem", color: S.ink2, lineHeight: 1.8 }}>
                      COPY requirements.txt .<br />RUN pip install ...<br />COPY . /app/<br />
                      <span style={{ color: S.accent2, fontSize: "0.68rem" }}>pip layer cached until requirements.txt changes</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          }
        ]} />
      </SectionWrapper>

      {/* ── SECTION 4: KUBERNETES ── */}
      <SectionWrapper id="k8s-arch" onVisible={markSection}>
        <SL num="04" title="Kubernetes Architecture" />
        <H2>The Reconciliation Engine</H2>
        <blockquote style={{ fontFamily: "'Fraunces',serif", fontSize: "clamp(1.3rem,2.5vw,2rem)", fontStyle: "italic", fontWeight: 300, lineHeight: 1.4, color: S.ink, borderLeft: `4px solid ${S.accent}`, padding: "20px 32px", margin: "40px 0", background: S.paper2, borderRadius: "0 8px 8px 0" }}>
          Kubernetes is not a container manager. It&apos;s a <em>desired-state reconciliation engine</em> that happens to manage containers.
          <cite style={{ display: "block", fontFamily: "'JetBrains Mono',monospace", fontSize: "0.75rem", fontStyle: "normal", color: S.ink3, marginTop: 12 }}>— The most important sentence in this document</cite>
        </blockquote>
        <ClusterVisual />

        <H3 mt={48}>The Journey of kubectl apply</H3>
        <Timeline items={[
          { title: "① kubectl sends HTTP PATCH to kube-apiserver", body: "kubectl serializes your YAML to JSON, sends a REST request. The API server runs: Authentication → Authorization (RBAC) → Admission controllers (webhooks can mutate/validate) → Validation against OpenAPI schema → Persist to etcd." },
          { title: "② Deployment Controller wakes up", body: "The Deployment controller in controller-manager has a watch on Deployment resources. etcd sends a watch event. Controller reconciles: desired replicas = 3, current ReplicaSets = 0. Creates a new ReplicaSet with pod template + podTemplateHash label." },
          { title: "③ ReplicaSet Controller creates Pod objects", body: "ReplicaSet controller sees it owns 0 pods but wants 3. Creates 3 Pod objects in etcd with status.phase: Pending and no spec.nodeName. These pods don't exist anywhere yet — they're just records in a database." },
          { title: "④ Scheduler binds pods to nodes", body: "Scheduler watches for unscheduled pods. Runs filter plugins (nodeSelector, taints, resource availability), score plugins (spreading, affinity), picks winner, writes spec.nodeName: worker-2 back to etcd." },
          { title: "⑤ kubelet on worker-2 notices its pod", body: "kubelet watches pods assigned to its node. Calls containerd CRI gRPC API: RunPodSandbox (create pause container + network namespace), PullImage, CreateContainer, StartContainer. Updates pod status in etcd." },
          { title: "⑥ CNI plugin sets up networking", body: "kubelet calls the CNI plugin (Calico/Cilium/Flannel) to assign an IP from the pod CIDR, set up veth pairs, configure routing. Now the pod has an IP and can communicate with the cluster network." },
          { title: "⑦ Pod is Running — Endpoints updated", body: "Endpoint controller detects the pod is ready (readinessProbe passes), adds its IP:port to the Service's Endpoints object. kube-proxy programs iptables rules. Traffic can now reach the pod." },
        ]} />

        <H3 mt={48}>Deep Concepts</H3>
        <ConceptCard title="The Pause Container — Why does every pod have a mystery container?">
          <p style={{ color: S.ink2 }}>Every Kubernetes pod contains a hidden container: <code style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.82em", background: S.paper3, padding: "2px 7px", borderRadius: 3, color: S.accent }}>pause</code>. A tiny C program that just sleeps. But it holds the pod&apos;s network namespace and PID namespace open.</p>
          <p style={{ color: S.ink2 }}>Namespaces in Linux are owned by processes. If the last process exits, the namespace is destroyed. If your app container crashes and is restarted, the network namespace (and pod&apos;s IP) would normally be torn down. The pause container prevents this.</p>
          <FeynmanBox>The pause container is like a building&apos;s structural skeleton. Even when all tenants move out, the building stays standing. New tenants move into the same building with the same address (IP).</FeynmanBox>
        </ConceptCard>
        <ConceptCard title="etcd Watch API — How controllers get notified without polling">
          <p style={{ color: S.ink2 }}>etcd exposes a Watch gRPC stream. Clients subscribe to a key prefix with a resource version. etcd maintains a compacted change history (MVCC). When a resource changes, all watchers get notified with the delta.</p>
          <p style={{ color: S.ink2 }}>The kube-apiserver aggregates these watches and re-exposes them as Kubernetes informers. Informers have a local in-memory cache (store) + an event queue. Controllers consume from this queue rather than calling the API on every reconcile — this is the List-Watch pattern.</p>
          <CodeBlock label="Watching resources at the API level">
            {`<span style="color:var(--sh-comment)"># Watch pod events as they happen</span>
<span style="color:var(--sh-func)">kubectl get pods --watch -o json</span>

<span style="color:var(--sh-comment)"># Watch etcd directly (requires etcd client)</span>
<span style="color:var(--sh-func)">etcdctl watch /registry/pods/default --prefix</span>`}
          </CodeBlock>
        </ConceptCard>
        <ConceptCard title="Services, ClusterIP and iptables — The magic of virtual IPs">
          <p style={{ color: S.ink2 }}>A Kubernetes Service gets a ClusterIP — a virtual IP that doesn&apos;t exist on any network interface. No process listens on it. kube-proxy programs iptables DNAT rules on every node. When a packet destined for 10.96.0.10:80 hits PREROUTING, iptables randomly selects one of the pod IPs from the Endpoints list and rewrites the destination.</p>
          <p style={{ color: S.ink2 }}>With IPVS mode, kube-proxy creates a virtual server in the kernel&apos;s IPVS module instead — O(1) lookup vs O(n) for iptables in large clusters.</p>
        </ConceptCard>
        <ConceptCard title="Rolling Updates — Zero-downtime deployment mechanics">
          <p style={{ color: S.ink2 }}>A rolling update creates a new ReplicaSet with the updated pod template, gradually scaling it up while scaling down the old one. <code style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.82em", background: S.paper3, padding: "2px 7px", borderRadius: 3, color: S.accent }}>maxUnavailable: 0</code> means no pods can be unavailable — the old pod is only killed after the new pod passes its readinessProbe. That&apos;s zero-downtime.</p>
          <CodeBlock label="Watch rolling update in real-time">
            {`<span style="color:var(--sh-func)">kubectl rollout status deployment/my-app</span>
<span style="color:var(--sh-comment)"># 1 out of 3 new replicas have been updated...
# 2 out of 3 new replicas have been updated...
# deployment "my-app" successfully rolled out</span>`}
          </CodeBlock>
        </ConceptCard>
      </SectionWrapper>

      {/* ── SECTION 5: CI/CD ── */}
      <SectionWrapper id="cicd" onVisible={markSection}>
        <SL num="05" title="CI/CD Pipeline" />
        <H2>From git push to Running Pod</H2>
        <p style={{ color: S.ink2 }}>CI/CD is not just &quot;automated testing&quot;. At the architectural level, it&apos;s a <strong>trust escalation pipeline</strong>. Code starts untrusted. Each gate adds trust. By the time it reaches production, it&apos;s been verified more thoroughly than any human review could achieve.</p>

        <div style={{ border: `1px solid ${S.border}`, borderRadius: 10, overflow: "hidden", margin: "24px 0" }}>
          <PipelineStage status="pass" title="① Source Trigger — git push to main">GitLab Runner receives a webhook. Clones the repo at the specific commit SHA. Every subsequent step refers to this immutable SHA — not &quot;main&quot;, the SHA. This is why CI/CD is reproducible: every artifact traces to an exact commit.</PipelineStage>
          <PipelineStage status="pass" title="② Static Analysis + Linting">Fast feedback before tests. Includes: type checking (mypy/pyright), linting (ruff/eslint), security linting (bandit, semgrep). Fail fast principle. These run in parallel. Time target: under 90 seconds.</PipelineStage>
          <PipelineStage status="pass" title="③ Unit + Integration Tests">Unit tests run in isolation (mocked deps). Integration tests spin up real dependencies via testcontainers. JUnit XML published for pipeline reporting. Coverage enforced: &lt; 80% = fail.</PipelineStage>
          <PipelineStage status="pass" title="④ Docker Build + Push (BuildKit)">
            <code style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.78rem", background: "rgba(0,0,0,0.05)", padding: "2px 6px", borderRadius: 3 }}>docker buildx build --platform linux/amd64,linux/arm64 --cache-from type=registry --push -t ecr/myapp:$&#123;CI_COMMIT_SHA&#125;</code>
            <br /><br />Image tagged with git SHA — never &quot;latest&quot;. The SHA is the immutable contract between CI and CD. BuildKit exports layer cache back to registry so the next build is fast.
          </PipelineStage>
          <PipelineStage status="pass" title="⑤ Trivy Security Scan">Scans the pushed image: OS packages (apt), language deps (pip/npm), Dockerfile misconfigs, secrets accidentally baked in. Queries NVD + GitHub Advisory databases. CRITICAL CVEs fail the pipeline.</PipelineStage>
          <PipelineStage status="run" title="⑥ Deploy to Staging (Kustomize)"><code style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.78rem", background: "rgba(0,0,0,0.05)", padding: "2px 6px", borderRadius: 3 }}>kustomize edit set image app=ecr/myapp:$SHA</code> then <code style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.78rem", background: "rgba(0,0,0,0.05)", padding: "2px 6px", borderRadius: 3 }}>kubectl apply -k ./k8s/staging/</code>. Waits for rollout with 5m timeout. Auto-reverts on failure.</PipelineStage>
          <PipelineStage status="pass" title="⑦ Smoke Tests + Performance Baseline">Automated smoke tests hit staging API. k6/Locust compares p95 latency against last release baseline. &gt;20% degradation = fail. These run against real deployed pods — not mocks. This is end-to-end testing.</PipelineStage>
          <PipelineStage status="run" title="⑧ Production Deploy (GitOps Trigger)">Manual approval gate. On approval: pipeline commits image SHA to the GitOps repo. ArgoCD detects this commit and syncs production. Prod deployment done via Git — never kubectl directly. This is GitOps.</PipelineStage>
        </div>

        <FeynmanBox>Notice that the Docker image tag (the SHA) is the <strong>communication protocol</strong> between CI and CD. CI produces an immutable artifact tagged with a SHA. CD deploys that exact SHA. At any moment you can ask &quot;what&apos;s running in prod?&quot; and get back a git commit you can examine. That traceability is the whole point.</FeynmanBox>
      </SectionWrapper>

      {/* ── SECTION 6: GITOPS ── */}
      <SectionWrapper id="gitops" onVisible={markSection}>
        <SL num="06" title="GitOps & Observability" />
        <H2>GitOps, ArgoCD, and the Observability Stack</H2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
          <div>
            <H3>GitOps — Git as Source of Truth</H3>
            <p style={{ color: S.ink2 }}>In traditional CD, the pipeline runs <code style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.82em", background: S.paper3, padding: "2px 7px", borderRadius: 3, color: S.accent }}>kubectl apply</code> directly. If someone does <code style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.82em", background: S.paper3, padding: "2px 7px", borderRadius: 3, color: S.accent }}>kubectl edit</code> manually, drift is invisible.</p>
            <p style={{ color: S.ink2 }}>GitOps flips this: ArgoCD runs <em>inside</em> the cluster and continuously watches a Git repo. If the cluster drifts from Git, the controller reconciles back. Git is the only way to change production.</p>
            <ConceptCard title="ArgoCD Application Controller internals">
              <p style={{ color: S.ink2 }}>ArgoCD&apos;s application controller runs a reconciliation loop every 3 minutes. It fetches Git target state, renders manifests (Helm/Kustomize), computes a resource-level diff against live cluster state, and applies if OutOfSync. Health assessment uses built-in checks for Deployments, Services, Ingresses, and can be extended with Lua scripts.</p>
            </ConceptCard>
          </div>
          <div>
            <H3>Observability: The Three Pillars</H3>
            {[
              { icon: "📊", title: "Metrics (Prometheus)", body: "Prometheus scrapes /metrics endpoints. TSDB stores time-series with labels. RED method: Rate (req/s), Errors (error %), Duration (latency histograms). AlertManager routes: severity levels, inhibition rules, Slack/PagerDuty." },
              { icon: "📝", title: "Logs (Loki / ELK)", body: "Fluent Bit DaemonSet tails /var/log/containers/. Enriches with k8s metadata. Ships to Loki (label-indexed) or Elasticsearch. Use structured logging and query on demand — don't turn logs into dashboards." },
              { icon: "🔍", title: "Traces (OpenTelemetry)", body: "OTel SDK instruments your code. Each request gets a trace ID propagated through all services via HTTP headers. Spans record each hop. Jaeger/Tempo. Traces answer 'why was THIS request slow?' — metrics can't." },
            ].map((card, i) => (
              <div key={i} style={{ background: S.paper, border: `1px solid ${S.border}`, borderRadius: 10, padding: 24, marginBottom: 16, transition: "box-shadow 0.2s, transform 0.2s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(0,0,0,0.08)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; (e.currentTarget as HTMLElement).style.transform = "none"; }}>
                <div style={{ fontSize: "1.8rem", marginBottom: 12 }}>{card.icon}</div>
                <div style={{ fontSize: "0.95rem", fontWeight: 600, color: S.ink, marginBottom: 8 }}>{card.title}</div>
                <p style={{ fontSize: "0.9rem", color: S.ink3, margin: 0 }}>{card.body}</p>
              </div>
            ))}
          </div>
        </div>

        <H3 mt={48}>Prometheus PromQL — The Language of Metrics</H3>
        <CodeBlock label="Production-grade alerting rules (PrometheusRule)">
          {`<span style="color:var(--sh-comment)"># API error rate > 1% over 5 minutes → PagerDuty</span>
<span style="color:var(--sh-kw)">alert</span>: HighErrorRate
<span style="color:var(--sh-kw)">expr</span>: |
  sum(rate(http_requests_total{status=~<span style="color:var(--sh-str)">"5.."</span>}[<span style="color:var(--sh-num)">5m</span>])) by (service)
  /
  sum(rate(http_requests_total[<span style="color:var(--sh-num)">5m</span>])) by (service)
  > <span style="color:var(--sh-num)">0.01</span>
<span style="color:var(--sh-kw)">for</span>: <span style="color:var(--sh-num)">2m</span>  <span style="color:var(--sh-comment)"># must be true for 2 min (avoid flaps)</span>
<span style="color:var(--sh-kw)">labels</span>:
  severity: critical

<span style="color:var(--sh-comment)"># p95 latency degradation</span>
<span style="color:var(--sh-kw)">alert</span>: SlowRequests
<span style="color:var(--sh-kw)">expr</span>: |
  histogram_quantile(<span style="color:var(--sh-num)">0.95</span>,
    sum(rate(http_request_duration_seconds_bucket[<span style="color:var(--sh-num)">5m</span>])) by (le, service)
  ) > <span style="color:var(--sh-num)">0.5</span>  <span style="color:var(--sh-comment)"># 500ms SLO</span>`}
        </CodeBlock>

        {/* Final mental model */}
        <div style={{ marginTop: 64, background: "linear-gradient(135deg, var(--dock-1-bg) 0%, var(--cluster-bg) 100%)", border: `1px solid ${S.border}`, borderRadius: 16, padding: 48 }}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: S.accent, marginBottom: 20 }}>⚡ The Complete Mental Model</div>
          <H3>From git push to Prometheus alert — The Unified Picture</H3>
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", margin: "24px 0" }}>
            {[
              { num: "git", name: "Code Commit", active: true },
              { num: "CI", name: "Build + Test + Scan", active: false },
              { num: "OCI", name: "Image:SHA → ECR", active: false },
              { num: "GitOps", name: "Commit SHA", active: false },
              { num: "ArgoCD", name: "Sync to Cluster", active: false },
              { num: "K8s", name: "Reconcile Pods", active: false },
              { num: "Prom", name: "Observe + Alert", active: false },
            ].map((step, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center" }}>
                <div style={{ background: step.active ? "var(--active-bg)" : S.paper, border: `1px solid ${step.active ? S.accent : S.border}`, borderRadius: 8, padding: "16px 20px", minWidth: 120, textAlign: "center" }}>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.65rem", color: S.ink3, marginBottom: 4 }}>{step.num}</div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 500, color: step.active ? S.accent : S.ink }}>{step.name}</div>
                </div>
                {i < 6 && <div style={{ fontSize: "1.2rem", color: S.ink3, padding: "0 8px" }}>→</div>}
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
            {[
              { color: S.accent, label: "ISOLATION LAYER", body: "namespaces + cgroups + OverlayFS = container. Not a VM. Same kernel, isolated view." },
              { color: S.accent3, label: "ORCHESTRATION LAYER", body: "etcd + controllers + scheduler = desired-state reconciliation. Kubernetes is a database with side effects." },
              { color: S.accent2, label: "AUTOMATION LAYER", body: "Git SHA = the contract. CI produces it. CD deploys it. GitOps enforces it. Prometheus watches it." },
            ].map((card, i) => (
              <div key={i} style={{ padding: 20, background: S.paper, borderRadius: 8, border: `1px solid ${S.border}` }}>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.72rem", color: card.color, fontWeight: 700, marginBottom: 8 }}>{card.label}</div>
                <div style={{ fontSize: "0.85rem", color: S.ink2 }}>{card.body}</div>
              </div>
            ))}
          </div>
        </div>
      </SectionWrapper>

      {/* ── QUIZ SECTION ── */}
      <SectionWrapper id="quiz" onVisible={markSection}>
        <SL num="07" title="Knowledge Check" />
        <H2>Test Your Understanding</H2>
        <p style={{ color: S.ink2, marginBottom: 32 }}>18 questions covering every section. Answers are verified server-side. Explanations go deep — read them even when you get it right.</p>
        <QuizSection onAnswer={handleQuizAnswer} />
      </SectionWrapper>

      <footer style={{ padding: "60px 80px", borderTop: `1px solid ${S.border}`, background: S.paper2, display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
        {/* Main footer row */}
        <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
          <div style={{ fontFamily: "'Fraunces',serif", fontSize: "1.2rem", fontWeight: 700, color: S.ink }}>Docker &amp; K8s — Deep Architecture</div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.72rem", color: S.ink3 }}>kernel → container → cluster → pipeline → alert</div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.68rem", color: S.ink3 }}>Progress: {progress.sections.length}/{SECTIONS.length + 1} · Quiz score: {progress.score}</span>
            <button
              onClick={() => fetch("/api/progress", { method: "DELETE" }).then(() => { setProgress({ sections: [], quiz: [], score: 0 }); window.location.href = "/"; })}
              style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.68rem", background: "none", border: `1px solid ${S.border}`, color: S.ink3, padding: "4px 10px", borderRadius: 4, cursor: "pointer" }}
            >Reset &amp; Home</button>
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: "100%", height: 1, background: S.border }} />

        {/* Orchestrated by row */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.72rem", color: S.ink3, letterSpacing: "0.04em" }}>Orchestrated by</span>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.72rem", fontWeight: 700, color: S.ink, letterSpacing: "0.04em" }}>Chaitanya</span>
          <span style={{ fontSize: "1.1rem" }}>🐳</span>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.72rem", color: S.ink3 }}>·</span>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.68rem", color: S.ink3, letterSpacing: "0.06em", background: S.paper3, padding: "2px 10px", borderRadius: 20, border: `1px solid ${S.border}` }}>v1.0.00</span>
        </div>
      </footer>
    </>
  );
}
