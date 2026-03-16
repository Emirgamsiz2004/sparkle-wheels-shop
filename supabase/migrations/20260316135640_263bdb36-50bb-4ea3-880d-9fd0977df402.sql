
CREATE TABLE public.blog_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text,
  content text,
  meta_title text,
  meta_description text,
  focus_keyword text,
  featured_image text,
  car_id uuid REFERENCES public.vehicles(id) ON DELETE SET NULL,
  published boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Iedereen kan gepubliceerde posts lezen
CREATE POLICY "Public can read published blog posts"
  ON public.blog_posts
  FOR SELECT
  TO public
  USING (published = true);

-- Admins kunnen alles (inclusief drafts lezen, aanmaken, bewerken, verwijderen)
CREATE POLICY "Admins can manage blog posts"
  ON public.blog_posts
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
