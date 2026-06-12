import {
  Activity,
  Boxes,
  Brain,
  Bug,
  Clock,
  Cpu,
  Database,
  FileCode2,
  FileWarning,
  Filter,
  FlaskConical,
  Gauge,
  GitBranch,
  HardDrive,
  KeyRound,
  Layers,
  Link2,
  ListTodo,
  Lock,
  MousePointerClick,
  Network,
  RefreshCw,
  Repeat,
  RotateCcw,
  Scale,
  Server,
  ShieldAlert,
  Shuffle,
  Split,
  Table,
  Timer,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";

/**
 * Explicit icon registry instead of importing lucide's full dynamic map —
 * keeps the icon set tree-shakeable (Section 11 bundle budget). Content may
 * only use these kebab-case names (the authoring spec pins them); unknown
 * names fall back to a generic file icon so a miss is visible, never a crash.
 */
const ICONS: Record<string, LucideIcon> = {
  activity: Activity,
  boxes: Boxes,
  brain: Brain,
  bug: Bug,
  clock: Clock,
  cpu: Cpu,
  database: Database,
  "file-warning": FileWarning,
  filter: Filter,
  "flask-conical": FlaskConical,
  gauge: Gauge,
  "git-branch": GitBranch,
  "hard-drive": HardDrive,
  "key-round": KeyRound,
  layers: Layers,
  "link-2": Link2,
  "list-todo": ListTodo,
  lock: Lock,
  "mouse-pointer-click": MousePointerClick,
  network: Network,
  "refresh-cw": RefreshCw,
  repeat: Repeat,
  "rotate-ccw": RotateCcw,
  scale: Scale,
  server: Server,
  "shield-alert": ShieldAlert,
  shuffle: Shuffle,
  split: Split,
  table: Table,
  timer: Timer,
  users: Users,
  zap: Zap,
};

export const REGISTERED_ICONS = Object.keys(ICONS);

export function ChallengeIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? FileCode2;
  return <Icon aria-hidden className={className} />;
}
