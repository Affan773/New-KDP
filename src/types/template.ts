import { CanvasElement, Orientation, ProjectType, TrimSize } from './project';

export type TemplateCategory =
  | 'All'
  | 'Puzzle Books'
  | 'Coloring Books'
  | 'Journals'
  | 'Planners'
  | 'Notebooks'
  | 'Activity Books'
  | 'Covers';

export interface TemplatePage {
  pageNumber: number;
  elements: CanvasElement[];
  backgroundColor?: string;
  notes?: string;
}

export interface Template {
  id: string;
  name: string;
  category: TemplateCategory;
  projectType: ProjectType;
  thumbnail: string;
  description: string;
  pageSize: TrimSize;
  orientation: Orientation;
  pageCount: number;
  suggestedPageCount?: number;
  pages: TemplatePage[];
  isPopular?: boolean;
  tags: string[];
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Easy' | 'Medium' | 'Hard' | 'Expert';
}
