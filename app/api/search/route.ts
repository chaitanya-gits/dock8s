import { NextRequest, NextResponse } from "next/server";
import { QUIZ_QUESTIONS, FEYNMAN_INSIGHTS } from "@/lib/content";

type SearchResult = {
  id: string;
  type: "concept" | "quiz" | "feynman";
  section: string;
  title: string;
  excerpt: string;
  anchor: string;
};

const CONCEPTS: SearchResult[] = [
  { id: "ns-pid", type: "concept", section: "linux-kernel", title: "PID Namespace", excerpt: "Gives a container its own process tree. PID 1 inside the container is actually PID 7823 on the host — two parallel realities, same kernel.", anchor: "linux-kernel" },
  { id: "ns-net", type: "concept", section: "linux-kernel", title: "Network Namespace", excerpt: "Gives each container its own isolated network stack, interfaces, routing tables, and port space.", anchor: "linux-kernel" },
  { id: "cgroup-mem", type: "concept", section: "linux-kernel", title: "cgroups v2 memory.max", excerpt: "Caps how much RAM a container can use. Enforced by the kernel at the hardware scheduling level. Exposed via /sys/fs/cgroup/.", anchor: "linux-kernel" },
  { id: "seccomp", type: "concept", section: "linux-kernel", title: "seccomp-bpf", excerpt: "Syscall filter using BPF programs. Restricts which Linux system calls a container process can invoke — reduces kernel attack surface.", anchor: "linux-kernel" },
  { id: "runc", type: "concept", section: "docker-arch", title: "runc (OCI Runtime)", excerpt: "The actual container-starter. Calls clone(), mount(), pivot_root(), execve(). Sets up namespaces and cgroups. Then exits — container runs without it.", anchor: "docker-arch" },
  { id: "containerd", type: "concept", section: "docker-arch", title: "containerd", excerpt: "Industry-standard container runtime that manages image pulling, snapshots, and container lifecycle. Sits between dockerd and runc.", anchor: "docker-arch" },
  { id: "shim", type: "concept", section: "docker-arch", title: "containerd-shim", excerpt: "One per container. Survives containerd restarts. Owns stdio pipes. Without it, killing containerd kills all containers.", anchor: "docker-arch" },
  { id: "overlayfs", type: "concept", section: "images", title: "OverlayFS", excerpt: "Union filesystem stacking read-only image layers (lowerdir) + one writable container layer (upperdir). Copy-on-write for file modifications.", anchor: "images" },
  { id: "multistage", type: "concept", section: "images", title: "Multi-Stage Builds", excerpt: "Multiple FROM statements. Only the final stage ships. Build tools never reach production images. Achieves ~900MB → ~120MB reduction.", anchor: "images" },
  { id: "layer-cache", type: "concept", section: "images", title: "BuildKit Layer Cache", excerpt: "Merkle tree of SHA256 hashes. Cache invalidation cascades downward. Stable layers (dependencies) must precede volatile layers (source code).", anchor: "images" },
  { id: "etcd", type: "concept", section: "k8s-arch", title: "etcd", excerpt: "Distributed key-value store using Raft consensus. Source of truth for ALL Kubernetes state. If etcd dies, cluster is read-only.", anchor: "k8s-arch" },
  { id: "apiserver", type: "concept", section: "k8s-arch", title: "kube-apiserver", excerpt: "REST API gateway. Handles AuthN/AuthZ/Admission. Only component that writes to etcd. Every kubectl command hits this.", anchor: "k8s-arch" },
  { id: "scheduler", type: "concept", section: "k8s-arch", title: "kube-scheduler", excerpt: "Watches unscheduled pods (no spec.nodeName). Runs filter predicates and score plugins. Writes nodeName to etcd via binding API.", anchor: "k8s-arch" },
  { id: "kubelet", type: "concept", section: "k8s-arch", title: "kubelet", excerpt: "Node agent. Watches pods assigned to its node. Calls containerd CRI gRPC API (RunPodSandbox, PullImage, CreateContainer, StartContainer).", anchor: "k8s-arch" },
  { id: "pause", type: "concept", section: "k8s-arch", title: "Pause Container", excerpt: "Hidden infra container in every pod. Holds network and PID namespaces alive so the pod IP survives container crashes and restarts.", anchor: "k8s-arch" },
  { id: "clusterip", type: "concept", section: "k8s-arch", title: "ClusterIP & iptables", excerpt: "Virtual IP with no process listening. kube-proxy programs iptables DNAT rules that rewrite destination to actual pod IPs.", anchor: "k8s-arch" },
  { id: "rolling", type: "concept", section: "k8s-arch", title: "Rolling Updates", excerpt: "New ReplicaSet scaled up while old scaled down. maxSurge and maxUnavailable control the pace. Zero-downtime when maxUnavailable=0.", anchor: "k8s-arch" },
  { id: "gitops", type: "concept", section: "gitops", title: "GitOps", excerpt: "Git is source of truth for infrastructure. ArgoCD watches Git and reconciles cluster state. Pipeline commits to Git — never touches cluster directly.", anchor: "gitops" },
  { id: "argocd", type: "concept", section: "gitops", title: "ArgoCD Controller", excerpt: "Reconciliation loop every 3 minutes. Fetches Git target state, renders manifests, diffs against live cluster, applies if OutOfSync.", anchor: "gitops" },
  { id: "prometheus", type: "concept", section: "gitops", title: "Prometheus RED Method", excerpt: "Rate (req/s), Errors (error %), Duration (latency histograms). Scrapes /metrics endpoints. AlertManager handles routing with inhibition rules.", anchor: "gitops" },
  { id: "otel", type: "concept", section: "gitops", title: "OpenTelemetry Traces", excerpt: "Trace ID propagated through all services via HTTP headers. Spans per service hop. Answers 'why was THIS request slow?' — metrics can't.", anchor: "gitops" },
  { id: "trivy", type: "concept", section: "cicd", title: "Trivy Security Scan", excerpt: "Scans OS packages, language deps, Dockerfile misconfigs, baked-in secrets. Queries NVD + GitHub Advisory. CRITICAL CVEs fail pipeline.", anchor: "cicd" },
  { id: "sha-tag", type: "concept", section: "cicd", title: "Git SHA Image Tags", excerpt: "Images tagged with git commit SHA — never latest. Immutable contract between CI and CD. Bidirectional traceability prod↔commit.", anchor: "cicd" },
];

function score(text: string, query: string): number {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (t.includes(q)) return 3;
  const words = q.split(" ");
  return words.filter(w => t.includes(w)).length;
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q")?.trim() || "";
  if (query.length < 2) return NextResponse.json([]);

  const conceptResults = CONCEPTS
    .map(c => ({ ...c, relevance: score(c.title + " " + c.excerpt, query) }))
    .filter(c => c.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 5);

  const quizResults = QUIZ_QUESTIONS
    .filter(q => score(q.question + " " + q.explanation, query) > 0)
    .slice(0, 2)
    .map(q => ({
      id: q.id, type: "quiz" as const, section: q.section,
      title: q.question.slice(0, 60) + "…",
      excerpt: "Quiz: " + q.options[q.answer],
      anchor: q.section
    }));

  const feynmanResults = FEYNMAN_INSIGHTS
    .filter(f => score(f.insight, query) > 0)
    .slice(0, 1)
    .map((f, i) => ({
      id: `feynman-${i}`, type: "feynman" as const, section: f.section,
      title: "💡 Feynman Insight",
      excerpt: f.insight.slice(0, 100) + "…",
      anchor: f.section
    }));

  return NextResponse.json([...conceptResults, ...quizResults, ...feynmanResults]);
}
