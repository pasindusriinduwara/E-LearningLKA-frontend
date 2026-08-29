export type MaterialType = "document" | "video" | "link";

export interface Material {
  id: string;
  type: MaterialType;
  batch: string;
  title: string;
  subject: string;
  date: string;
  size?: string;
  downloads?: number;
  isRestricted: boolean;
}