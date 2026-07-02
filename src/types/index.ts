export type FileType = 'pdf' | 'doc' | 'sheet' | 'image' | 'audio' | 'video' | 'folder';

export interface StorageItem {
  id: string;
  name: string;
  type: FileType;
  size?: string; // Folders won't explicitly show size upfront
  updatedAt: string;
  owner: {
    name: string;
    avatar?: string;
  };
  isFavorite?: boolean;
  sharedWith?: number; // Number of people shared with
}