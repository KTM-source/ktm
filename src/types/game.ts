export interface Game {
  id: string;
  title: string;
  slug: string;
  image: string;
  backgroundImage?: string;
  version: string;
  category: string;
  releaseDate: string;
  size: string;
  description: string;
  features?: string[];
  systemRequirements?: {
    minimum: SystemRequirements;
    recommended: SystemRequirements;
  };
  downloadLinks?: DownloadLink[];
  screenshots?: string[];
  developer?: string;
  genre?: string;
  featured?: boolean;
  rating?: number;
  platforms: string[];
  views?: number;
}

export interface SystemRequirements {
  os: string;
  processor: string;
  memory: string;
  graphics: string;
  storage: string;
}

export interface DownloadLink {
  name: string;
  url: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  count: number;
}
