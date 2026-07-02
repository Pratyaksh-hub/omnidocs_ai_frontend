import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  Star,
  Trash2,
  Settings,
} from "lucide-react";

export const navigation = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Workspaces",
    href: "/workspace",
    icon: FolderKanban,
  },
  {
    title: "Documents",
    href: "/documents",
    icon: FileText,
  },
  {
    title: "Favorites",
    href: "/favorites",
    icon: Star,
  },
  {
    title: "Trash",
    href: "/trash",
    icon: Trash2,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];