export interface Game {
  id: string;
  title: string;
  slug: string;
  image: string;
  version: string;
  category: string;
  releaseDate: string;
  size: string;
  description: string;
  downloadLink: string;
  featured?: boolean;
  rating?: number;
  platforms: string[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  count: number;
}
