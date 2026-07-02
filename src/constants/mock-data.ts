import { StorageItem } from "@/types";

export const mockStorageItems: StorageItem[] = [
  {
    id: "f1",
    name: "Q3 Product Strategy",
    type: "folder",
    updatedAt: "2 hours ago",
    owner: { name: "Pratyaksh M." },
    sharedWith: 3
  },
  {
    id: "f2",
    name: "AI Engine Assets",
    type: "folder",
    updatedAt: "Yesterday",
    owner: { name: "Pratyaksh M." },
    isFavorite: true
  },
  {
    id: "d1",
    name: "System_Architecture_v2.pdf",
    type: "pdf",
    size: "4.2 MB",
    updatedAt: "10 mins ago",
    owner: { name: "Pratyaksh M." }
  },
  {
    id: "d2",
    name: "Sprint Planning & Backlog",
    type: "doc",
    size: "12 KB",
    updatedAt: "1 hour ago",
    owner: { name: "Sarah K." },
    sharedWith: 5
  },
  {
    id: "d3",
    name: "Financial Projections 2026.xlsx",
    type: "sheet",
    size: "1.8 MB",
    updatedAt: "3 days ago",
    owner: { name: "Alex R." },
    isFavorite: true
  }
];