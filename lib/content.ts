export type Section = {
  id: string;
  num: string;
  title: string;
  subtitle: string;
  color: string;
};

export type QuizQuestion = {
  id: string;
  section: string;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
};

export const SECTIONS: Section[] = [
  { id: "linux-kernel", num: "01", title: "Linux Kernel", subtitle: "The Real Container Engine", color: "#c84b31" },
  { id: "docker-arch", num: "02", title: "Docker Architecture", subtitle: "The 5-Component Runtime Stack", color: "#b06000" },
  { id: "images", num: "03", title: "Images & OverlayFS", subtitle: "How Layers Work on Disk", color: "#7a6000" },
  { id: "k8s-arch", num: "04", title: "Kubernetes", subtitle: "The Reconciliation Engine", color: "#2356a8" },
  { id: "cicd", num: "05", title: "CI/CD Pipeline", subtitle: "From git push to Running Pod", color: "#1a6b4a" },
  { id: "gitops", num: "06", title: "GitOps & Observability", subtitle: "ArgoCD + Prometheus Stack", color: "#7c3aed" },
];

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "q1",
    section: "linux-kernel",
    question: "What Linux kernel feature controls WHAT a container process can SEE (its own process tree, network, filesystem)?",
    options: ["cgroups v2", "Namespaces", "seccomp-bpf", "OverlayFS"],
    answer: 1,
    explanation: "Namespaces create isolated views of global kernel resources. The pid namespace gives a container its own process tree (PID 1 inside), the net namespace gives its own network stack, mnt namespace its own filesystem view. The key syscall is clone() with CLONE_NEWPID | CLONE_NEWNET flags."
  },
  {
    id: "q2",
    section: "linux-kernel",
    question: "What Linux feature limits HOW MUCH CPU and memory a container can use?",
    options: ["Namespaces", "AppArmor", "cgroups v2", "pivot_root()"],
    answer: 2,
    explanation: "Control groups (cgroups) v2 enforce resource limits and accounting. Each container gets a cgroup subtree under /sys/fs/cgroup/. Settings like cpu.max and memory.max cap resource usage. The kernel enforces these limits at the hardware scheduling level."
  },
  {
    id: "q3",
    section: "linux-kernel",
    question: "A container's PID 1 is actually PID 7823 on the host. This is because of…",
    options: ["Virtual machine hypervisor", "PID namespace isolation", "cgroup pid.max limit", "Docker daemon remapping"],
    answer: 1,
    explanation: "The PID namespace creates a separate numbering space. The host kernel tracks the real PID (7823), but within the container's PID namespace, the process sees itself as PID 1. Two parallel realities — same kernel, isolated views. This is the core illusion of containers."
  },
  {
    id: "q4",
    section: "docker-arch",
    question: "After runc starts a container, it exits. Why is this correct behavior?",
    options: ["Bug in runc that was never fixed", "runc is a setup tool — once the container process runs, runc's job is done", "The container crashes immediately", "dockerd kills runc after launch"],
    answer: 1,
    explanation: "runc is an OCI runtime — its sole job is to call clone(), mount(), pivot_root(), execve() to set up the container environment and start the process. Once PID 1 of the container is running, runc exits. Like a rocket booster — it fires, detaches, the payload continues. The containerd-shim keeps the process alive."
  },
  {
    id: "q5",
    section: "docker-arch",
    question: "What is the containerd-shim's critical role?",
    options: [
      "Converts Docker images to OCI format",
      "Sits between containerd and each container, surviving containerd restarts so containers don't die",
      "Provides the REST API for docker CLI",
      "Manages the overlay filesystem layers"
    ],
    answer: 1,
    explanation: "containerd-shim-runc-v2 is a per-container process. Without it, killing containerd would kill all containers (child processes die with parent). The shim owns the container's stdio pipes, holds the container alive independently of containerd, and reports exit codes when containerd restarts."
  },
  {
    id: "q6",
    section: "docker-arch",
    question: "docker CLI communicates with dockerd over which mechanism?",
    options: ["TCP port 2375", "HTTP REST over Unix socket /var/run/docker.sock", "gRPC on port 8080", "Direct kernel ioctl() calls"],
    answer: 1,
    explanation: "docker CLI sends HTTP REST API calls to dockerd over the Unix domain socket at /var/run/docker.sock. This is why mounting this socket into a container gives it full Docker daemon access — a major security risk. dockerd then communicates downstream to containerd via gRPC."
  },
  {
    id: "q7",
    section: "images",
    question: "In OverlayFS, when a container modifies a file that exists in a lower (read-only) image layer, what happens?",
    options: [
      "The file is modified directly in the lower layer",
      "The container crashes with a read-only filesystem error",
      "The entire file is first copied to the writable upperdir, then modified there (copy-on-write)",
      "The lower layer is duplicated for this container"
    ],
    answer: 2,
    explanation: "This is copy-on-write (CoW). The kernel copies the entire file from the lower read-only layer to the container's upperdir (writable layer), then modifies the copy. The lower layers remain unchanged and shared across all containers using that image. This is why modifying many large files in a container is slower than native."
  },
  {
    id: "q8",
    section: "images",
    question: "Why should COPY requirements.txt come BEFORE COPY . /app/ in a Python Dockerfile?",
    options: [
      "Python requires it for import resolution",
      "Layer cache invalidation cascades downward — stable files should come first so pip install is cached until requirements.txt changes",
      "Docker processes COPY instructions in alphabetical order",
      "requirements.txt must exist before the app directory"
    ],
    answer: 1,
    explanation: "BuildKit's cache key for each layer includes all parent layer cache keys. If you COPY . first, ANY code change invalidates the pip install layer — rebuilding dependencies every time. By copying only requirements.txt first, pip install is cached until requirements.txt actually changes. This can cut build time from 3 minutes to 10 seconds."
  },
  {
    id: "q9",
    section: "images",
    question: "Multi-stage builds with FROM python:3.12 AS builder followed by FROM python:3.12-slim primarily solve what problem?",
    options: [
      "Parallel compilation across CPU cores",
      "Build tools (gcc, pip, compilers) must not ship in production images — only compiled artifacts are copied to the final slim stage",
      "Docker Hub rate limits on image pulls",
      "Reducing the number of RUN instructions"
    ],
    answer: 1,
    explanation: "Build tools expand attack surface and bloat image size (900MB vs 120MB). The builder stage has everything needed to compile/install. The final stage starts fresh from a slim base and only receives COPY --from=builder of the compiled artifacts. Trivy has far less to scan, pulls are 7x faster, and there's no gcc or pip in production."
  },
  {
    id: "q10",
    section: "k8s-arch",
    question: "Kubernetes is best described as…",
    options: [
      "A container manager like Docker Compose but bigger",
      "A desired-state reconciliation engine — you declare what you want, controllers continuously close the gap between desired and actual state",
      "A virtual machine orchestrator",
      "A deployment scripting tool"
    ],
    answer: 1,
    explanation: "The fundamental mental model: you declare desired state in YAML (3 replicas of nginx). Controllers observe current state (0 replicas), compare to desired (3), and act (create 3 pods). This loop runs forever. Every K8s component — scheduler, controller-manager, kubelet — is an instance of this control loop pattern."
  },
  {
    id: "q11",
    section: "k8s-arch",
    question: "When you run kubectl apply -f deployment.yaml, at what point do pods actually START RUNNING on a node?",
    options: [
      "Immediately when kubectl returns",
      "When kube-apiserver validates the YAML",
      "After: apiserver persists to etcd → controller creates ReplicaSet → scheduler binds pod to node → kubelet on that node calls containerd",
      "When Docker pulls the image"
    ],
    answer: 2,
    explanation: "kubectl apply just writes a Deployment object to etcd. The pod doesn't exist yet. The Deployment controller creates a ReplicaSet. The ReplicaSet controller creates Pod objects (still just database records). The scheduler assigns them to nodes. The kubelet on each assigned node calls containerd CRI API to actually start containers. It's a chain of reconciliation loops."
  },
  {
    id: "q12",
    section: "k8s-arch",
    question: "What is etcd's role in a Kubernetes cluster, and what happens if it goes down?",
    options: [
      "etcd runs containers — cluster stops scheduling but running pods continue",
      "etcd is the source of truth for ALL cluster state — if it dies, the cluster becomes read-only (can't create/update anything, but existing pods keep running)",
      "etcd is optional caching — cluster degrades but continues normally",
      "etcd manages image pulls — deployments pause but cluster operates"
    ],
    answer: 1,
    explanation: "etcd is the only persistent store in Kubernetes. All cluster state — pod specs, deployments, configmaps, secrets, service accounts — lives in etcd. kube-apiserver validates then writes to etcd. If etcd is unavailable, the API server can't persist changes, making the cluster read-only. Running pods aren't affected (kubelet operates independently), but nothing new can be created."
  },
  {
    id: "q13",
    section: "k8s-arch",
    question: "A Kubernetes ClusterIP is a virtual IP that no process actually listens on. How does traffic reach pods?",
    options: [
      "kube-proxy runs a proxy process on ClusterIP:port on every node",
      "kube-proxy programs iptables DNAT rules that rewrite destination IPs from ClusterIP to a randomly selected pod IP in PREROUTING",
      "The CNI plugin creates a virtual network interface for each ClusterIP",
      "etcd maintains a routing table that kubelet consults"
    ],
    answer: 1,
    explanation: "kube-proxy programs iptables DNAT rules on every node. A packet to 10.96.0.10:80 (ClusterIP) hits PREROUTING, iptables randomly picks one endpoint pod IP, rewrites the destination, packet goes directly to the pod. The ClusterIP is purely an iptables trick — no process ever binds to it. IPVS mode replaces this with kernel-level virtual servers for O(1) lookup in large clusters."
  },
  {
    id: "q14",
    section: "k8s-arch",
    question: "Every pod has a hidden 'pause' container. What does it do?",
    options: [
      "Throttles CPU usage when the pod is idle",
      "Runs health checks for the pod",
      "Holds the pod's network and PID namespaces alive so the pod's IP survives container crashes/restarts",
      "Pauses the pod during rolling updates"
    ],
    answer: 2,
    explanation: "Linux namespaces exist only while at least one process is in them. If your app container crashes, its namespace would be destroyed — losing the pod's IP. The pause container (a tiny C program that just sleeps) permanently holds the network and PID namespaces open. When your app container restarts, it re-joins the existing namespaces with the same IP. It's the building's skeleton — tenants come and go, the address stays."
  },
  {
    id: "q15",
    section: "cicd",
    question: "In a CI/CD pipeline, why is the Docker image tagged with the git commit SHA instead of 'latest'?",
    options: [
      "latest tag is deprecated in Docker",
      "The SHA provides an immutable, traceable artifact — you can always ask what's in production and get back an exact git commit you can inspect",
      "SHA tags are smaller in size",
      "Registry quotas require unique tags"
    ],
    answer: 1,
    explanation: "latest is a mutable tag — it can be overwritten by any build. The git SHA is immutable and bidirectionally traceable: given an image in production, you can find the exact commit, PR, author, and diff. Given a commit, you can find the exact image. This traceability is the contract between CI (which produces the image) and CD (which deploys it). Never tag production images as latest."
  },
  {
    id: "q16",
    section: "cicd",
    question: "At what CI/CD pipeline stage does Trivy run, and what does it scan?",
    options: [
      "Before Docker build — scans source code files",
      "After Docker build and push — scans the final image for OS package CVEs, language dependency vulnerabilities, Dockerfile misconfigs, and accidentally baked-in secrets",
      "At deployment — scans running container memory",
      "During unit tests — checks test dependencies"
    ],
    answer: 1,
    explanation: "Trivy runs after the image is built and pushed to the registry. It scans: OS packages (apt/rpm), language dependencies (pip packages, npm modules), Dockerfile misconfigurations, and secrets/tokens in the image layers. It queries NVD and GitHub Advisory databases for CVEs. CRITICAL severity findings fail the pipeline — the image never reaches staging."
  },
  {
    id: "q17",
    section: "gitops",
    question: "What is the fundamental difference between traditional CD (kubectl apply in pipeline) vs GitOps (ArgoCD)?",
    options: [
      "GitOps only works with Helm, not Kustomize",
      "Traditional CD: pipeline directly modifies cluster (drift is invisible). GitOps: controller INSIDE the cluster watches Git and reconciles — Git is the only way to change production",
      "GitOps requires manual approval for every deployment",
      "Traditional CD uses SHA tags, GitOps uses latest tags"
    ],
    answer: 1,
    explanation: "Traditional CD: pipeline has kubectl credentials and runs apply directly. Someone can kubectl edit in production and create invisible drift between Git and cluster. GitOps flips this: ArgoCD/Flux runs inside the cluster, continuously compares Git state to cluster state, and auto-reconciles any drift. The pipeline NEVER touches the cluster — it only commits to Git. Auditability, rollback, and compliance become trivially easy."
  },
  {
    id: "q18",
    section: "gitops",
    question: "In Prometheus, what does histogram_quantile(0.95, ...) measure and why is it more useful than average latency?",
    options: [
      "95% of requests completed — same as average but filtered",
      "The latency value below which 95% of requests fall — shows worst-case experience for the vast majority of users, while average hides outliers",
      "The top 5% fastest requests",
      "CPU utilization at the 95th percentile"
    ],
    answer: 1,
    explanation: "p95 latency means 95% of requests completed faster than this value. Average latency is deeply misleading — 100 fast requests + 1 very slow request = decent average, terrible user experience. p95 shows what most users actually experience. p99 shows extreme tail latency. SLOs are written in percentiles, not averages, because that's what users feel. Prometheus histograms bucket request durations and histogram_quantile interpolates the percentile."
  },
];

export const FEYNMAN_INSIGHTS = [
  {
    section: "linux-kernel",
    insight: "Docker didn't invent containers. Linux did — years before Docker existed. Docker is a very good user-friendly wrapper around kernel features. If you can't explain why a container is NOT a VM, you don't understand containers yet."
  },
  {
    section: "linux-kernel", 
    insight: "Think of namespaces like one-way mirrors in interrogation rooms. Your container thinks it's alone in the universe. The host kernel sees everything."
  },
  {
    section: "docker-arch",
    insight: "Why does runc exit after starting the container? It's like a rocket stage — it fires, does its job, detaches. The payload keeps flying. runc's job is done the moment PID 1 is running."
  },
  {
    section: "images",
    insight: "Layer cache is a Merkle tree. Each node's identity is derived from its content AND its parents. Change anything upstream, and the entire subtree gets a new identity — exactly like Git commits."
  },
  {
    section: "k8s-arch",
    insight: "Kubernetes is not a container manager. It's a desired-state reconciliation engine that happens to manage containers. Learn the control loop pattern and everything else falls into place."
  },
  {
    section: "k8s-arch",
    insight: "The pause container is like a building's structural skeleton. Even when all tenants move out, the building stays standing. New tenants move into the same building with the same address (IP)."
  },
  {
    section: "cicd",
    insight: "CI/CD is not just automated testing. It's a trust escalation pipeline. Code starts untrusted. Each gate it passes through adds trust. The SHA tag is the communication protocol between CI and CD."
  },
  {
    section: "gitops",
    insight: "GitOps is not a tool, it's a constraint. Git is the only way to change production. The pipeline commits to Git. ArgoCD reads from Git. Production can never drift from what's auditable."
  },
];
