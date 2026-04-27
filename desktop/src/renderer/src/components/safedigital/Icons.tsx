import React from "react";
import {
  LayoutDashboard,
  Vault,
  FileText,
  CheckSquare,
  Plus,
  Search,
  Lock,
  Unlock,
  Calendar,
  Clock,
  Tag,
  MoreVertical,
  Trash2,
  Edit2,
  ArrowRight,
  Shield,
  Activity,
  CreditCard,
  Home,
  Briefcase,
  Folder,
  ChevronRight,
  ChevronLeft,
  X,
} from "lucide-react";

interface IconProps {
  className?: string;
  isActive?: boolean;
}

export const LayoutDashboardIcon: React.FC<IconProps> = ({ className }) => (
  <LayoutDashboard className={className} />
);
export const VaultIcon: React.FC<IconProps> = ({ className }) => (
  <Vault className={className} />
);
export const NotesIcon: React.FC<IconProps> = ({ className }) => (
  <FileText className={className} />
);
export const TasksIcon: React.FC<IconProps> = ({ className }) => (
  <CheckSquare className={className} />
);
export const PlusIcon: React.FC<IconProps> = ({ className }) => (
  <Plus className={className} />
);
export const SearchIcon: React.FC<IconProps> = ({ className }) => (
  <Search className={className} />
);
export const LockIcon: React.FC<IconProps> = ({ className }) => (
  <Lock className={className} />
);
export const UnlockIcon: React.FC<IconProps> = ({ className }) => (
  <Unlock className={className} />
);
export const CalendarIcon: React.FC<IconProps> = ({ className }) => (
  <Calendar className={className} />
);
export const ClockIcon: React.FC<IconProps> = ({ className }) => (
  <Clock className={className} />
);
export const TagIcon: React.FC<IconProps> = ({ className }) => (
  <Tag className={className} />
);
export const MoreIcon: React.FC<IconProps> = ({ className }) => (
  <MoreVertical className={className} />
);
export const TrashIcon: React.FC<IconProps> = ({ className }) => (
  <Trash2 className={className} />
);
export const EditIcon: React.FC<IconProps> = ({ className }) => (
  <Edit2 className={className} />
);
export const ArrowRightIcon: React.FC<IconProps> = ({ className }) => (
  <ArrowRight className={className} />
);
export const ShieldIcon: React.FC<IconProps> = ({ className }) => (
  <Shield className={className} />
);
export const ActivityIcon: React.FC<IconProps> = ({ className }) => (
  <Activity className={className} />
);
export const FinanceIcon: React.FC<IconProps> = ({ className }) => (
  <CreditCard className={className} />
);
export const HomeIcon: React.FC<IconProps> = ({ className }) => (
  <Home className={className} />
);
export const WorkIcon: React.FC<IconProps> = ({ className }) => (
  <Briefcase className={className} />
);
export const FolderIcon: React.FC<IconProps> = ({ className }) => (
  <Folder className={className} />
);
export const ChevronRightIcon: React.FC<IconProps> = ({ className }) => (
  <ChevronRight className={className} />
);
export const ChevronLeftIcon: React.FC<IconProps> = ({ className }) => (
  <ChevronLeft className={className} />
);
export const XIcon: React.FC<IconProps> = ({ className }) => (
  <X className={className} />
);
