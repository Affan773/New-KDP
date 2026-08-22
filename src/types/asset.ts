export type AssetCategory =
  | 'My Images'
  | 'Icons'
  | 'Shapes'
  | 'Backgrounds'
  | 'Borders'
  | 'Recently Used';

export type AssetType = 'svg' | 'image' | 'shape' | 'pattern';

export interface Asset {
  id: string;
  name: string;
  category: AssetCategory;
  type: AssetType;
  url: string;
  thumbnail?: string;
  sizeBytes?: number;
  width?: number;
  height?: number;
  tags: string[];
  createdAt: string;
  isCustom?: boolean;
}

export interface AssetUploadPayload {
  name: string;
  category: AssetCategory;
  dataUrl: string;
  sizeBytes: number;
  tags: string[];
}
