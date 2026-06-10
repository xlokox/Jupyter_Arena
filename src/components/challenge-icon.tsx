import {
  Cpu,
  Database,
  FileCode2,
  ListTodo,
  MousePointerClick,
  RotateCcw,
  Scale,
  ShieldAlert,
  Users,
  type LucideIcon,
} from "lucide-react";

/**
 * Explicit icon registry instead of importing lucide's full dynamic map —
 * keeps the icon set tree-shakeable (Section 11 bundle budget). New content
 * icons must be registered here; unknown names fall back to a generic file
 * icon so missing entries are visible, never crashes.
 */
const ICONS: Record<string, LucideIcon> = {
  cpu: Cpu,
  database: Database,
  "list-todo": ListTodo,
  "mouse-pointer-click": MousePointerClick,
  "rotate-ccw": RotateCcw,
  scale: Scale,
  "shield-alert": ShieldAlert,
  users: Users,
};

export function ChallengeIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? FileCode2;
  return <Icon aria-hidden className={className} />;
}
