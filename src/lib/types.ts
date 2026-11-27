export type Status = "draft" | "published";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  cover_url: string | null;
  cover_path: string | null;
  sort_order: number;
  is_featured: boolean;
  created_at: string;
}

export interface Photo {
  id: string;
  category_id: string;
  title: string;
  description: string;
  tags: string[];
  url: string;
  path: string | null;
  thumb_url: string;
  thumb_path: string | null;
  width: number | null;
  height: number | null;
  status: Status;
  is_featured: boolean;
  created_at: string;
}

export interface Video {
  id: string;
  title: string;
  description: string;
  source: "upload" | "youtube";
  url: string;
  path: string | null;
  thumbnail_url: string | null;
  thumbnail_path: string | null;
  status: Status;
  is_featured: boolean;
  created_at: string;
}

export interface Settings {
  site_name: string;
  tagline: string;
  logo_url: string | null;
  logo_path: string | null;
  favicon_url: string | null;
  favicon_path: string | null;
  email: string;
  phone: string;
  phone2: string;
  whatsapp: string;
  address: string;
  map_embed_url: string;
  business_hours: string;
  instagram_url: string;
  facebook_url: string;
  youtube_url: string;
  hero_heading: string;
  hero_description: string;
  hero_image_url: string | null;
  hero_image_path: string | null;
  about_heading: string;
  about_text: string;
  about_image_url: string | null;
  about_image_path: string | null;
  banner_enabled: boolean;
  banner_text: string;
  banner_link: string;
}

export interface Enquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  event_type: string;
  event_date: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface CategoryWithCount extends Category {
  photo_count: number;
}
