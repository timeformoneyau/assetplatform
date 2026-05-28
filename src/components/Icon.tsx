import {
  type LucideIcon,
  Plus, Upload, ArrowLeft, ArrowRight, Check, Edit3, Trash2,
  FileText, Image, Car, ChevronRight, ChevronDown, Info, Eye,
  Download, Sparkles, Home, File, User, Settings, Search,
  Wrench, Shield, ClipboardList, CreditCard, ShieldCheck,
  Circle, AlertTriangle, Zap, RotateCcw, HelpCircle, X, Camera,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  plus: Plus,
  upload: Upload,
  arrow_left: ArrowLeft,
  arrow_right: ArrowRight,
  check: Check,
  edit: Edit3,
  trash: Trash2,
  doc: FileText,
  image: Image,
  car: Car,
  chevron_right: ChevronRight,
  chevron_down: ChevronDown,
  info: Info,
  eye: Eye,
  download: Download,
  sparkle: Sparkles,
  home: Home,
  file: File,
  user: User,
  settings: Settings,
  search: Search,
  service: Wrench,
  repair: Shield,
  inspection: Search,
  registration: CreditCard,
  warranty: ShieldCheck,
  tyres: Circle,
  battery: Zap,
  recall: AlertTriangle,
  other: HelpCircle,
  x: X,
  rotate: RotateCcw,
  camera: Camera,
  clipboard: ClipboardList,
};

interface IconProps {
  name: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function Icon({ name, size = 16, strokeWidth = 1.6, className, style }: IconProps) {
  const Comp = ICON_MAP[name] ?? HelpCircle;
  return <Comp size={size} strokeWidth={strokeWidth} className={className} style={style} />;
}
