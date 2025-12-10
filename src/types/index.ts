export interface CoverImagePosition {
  x: number;  // Horizontal position (0-100)
  y: number;  // Vertical position (0-100)
  zoom: number;  // Zoom level (50-200)
}

export interface BlogPost {
  id: string;
  title: string;
  story: string;  // Rich text HTML content
  photo_urls: string[];
  cover_image_url: string | null;
  cover_image_position: CoverImagePosition;
  category_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  color: string;  // Hex color code
  created_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  author_name: string;
  content: string;
  created_at: string;
}

export interface CreatePostInput {
  title: string;
  story: string;  // Rich text HTML content
  photos: File[];
  cover_image_index?: number;  // Index of cover image in photos array
  cover_image_position?: CoverImagePosition;
  category_ids?: string[];
}

export interface UpdatePostInput {
  id: string;
  title: string;
  story: string;  // Rich text HTML content
  photos?: File[];
  photo_urls: string[];
  cover_image_url?: string;
  cover_image_position?: CoverImagePosition;
  category_ids?: string[];
}

import type { User } from '@supabase/supabase-js';

export interface AuthState {
  isAuthenticated: boolean;
  isAdminMode: boolean;
  user: User | null;
}
