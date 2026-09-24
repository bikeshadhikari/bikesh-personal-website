/** Row shapes, matching the columns in src/lib/schema.ts. */

export type Experience = {
  id: number; role: string; organization: string; organization_url: string; location: string;
  track: string; employment_type: string; start_date: string | null; end_date: string | null;
  is_current: boolean; summary: string; highlights: string; logo: string;
  enabled: boolean; sort_order: number;
};

export type Skill = {
  id: number; name: string; category: string; level: number; icon: string;
  enabled: boolean; sort_order: number;
};

export type Service = {
  id: number; title: string; summary: string; bullets: string; icon: string;
  price_note: string; enabled: boolean; sort_order: number;
};

export type Project = {
  id: number; title: string; slug: string; summary: string; description: string; image: string;
  live_url: string; repo_url: string; tech: string; client: string; year: string; category: string;
  is_featured: boolean; enabled: boolean; sort_order: number;
};

export type Certification = {
  id: number; title: string; issuer: string; issue_date: string | null; credential_id: string;
  credential_url: string; image: string; enabled: boolean; sort_order: number;
};

export type Testimonial = {
  id: number; name: string; role: string; organization: string; quote: string; photo: string;
  rating: number; enabled: boolean; sort_order: number;
};

export type Highlight = {
  id: number; label: string; value: string; suffix: string; icon: string;
  enabled: boolean; sort_order: number;
};

export type Category = {
  id: number; name: string; slug: string; description: string; color: string; sort_order: number;
  post_count?: number;
};

export type Post = {
  id: number; title: string; slug: string; excerpt: string; content: string; cover_image: string;
  category_id: number | null; author_id: number | null; tags: string; status: string;
  is_featured: boolean; allow_comments: boolean; views: number;
  meta_title: string; meta_description: string;
  published_at: string | null; created_at: string; updated_at: string;
  category_name?: string | null; category_slug?: string | null; category_color?: string | null;
  author_name?: string | null;
};

export type Comment = {
  id: number; post_id: number; name: string; email: string; body: string;
  status: string; ip: string; created_at: string;
  post_title?: string | null; post_slug?: string | null;
};

export type Message = {
  id: number; name: string; email: string; phone: string; subject: string; body: string;
  ip: string; is_read: boolean; is_starred: boolean; created_at: string;
};

export type Subscriber = { id: number; email: string; is_active: boolean; created_at: string };

export type UserRow = {
  id: number; name: string; email: string; role: string; avatar: string;
  is_active: boolean; last_login_at: string | null; created_at: string;
};

export type Notice = {
  id: number; title: string; body: string; image: string;
  link_url: string; link_file: string; link_label: string;
  dismiss_once: boolean; enabled: boolean;
  starts_at: string | null; ends_at: string | null;
  sort_order: number; created_at: string; updated_at: string;
};

export type GalleryItem = {
  id: number; title: string; caption: string; image: string;
  width: number; height: number; taken_at: string | null;
  enabled: boolean; sort_order: number; created_at: string;
};

export type Paginated<T> = { items: T[]; total: number; pages: number; page: number };
