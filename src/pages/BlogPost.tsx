import { Helmet } from "react-helmet-async";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Phone, MessageCircle, Calendar, Clock, Tag } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { useMemo } from "react";

const estimateReadingTime = (html: string) => {
  const text = html.replace(/<[^>]*>/g, "");
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
};

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: post, isLoading } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  const { data: relatedPosts } = useQuery({
    queryKey: ["blog-related", post?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, title, slug, excerpt, created_at, featured_image")
        .eq("published", true)
        .neq("id", post!.id)
        .order("created_at", { ascending: false })
        .limit(3);
      if (error) throw error;
      return data;
    },
    enabled: !!post?.id,
  });

  const readingTime = useMemo(
    () => (post?.content ? estimateReadingTime(post.content) : 0),
    [post?.content]
  );

  const articleJsonLd = post
    ? {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: post.meta_title || post.title,
        description: post.meta_description || post.excerpt || "",
        image: post.featured_image || undefined,
        datePublished: post.created_at,
        author: {
          "@type": "Organization",
          name: "Platin Automotive",
          url: "https://platinautomotive.nl",
        },
        publisher: {
          "@type": "Organization",
          name: "Platin Automotive",
          url: "https://platinautomotive.nl",
        },
      }
    : null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 pb-20 px-5 md:px-[90px] max-w-[720px] mx-auto space-y-6">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-4 w-48" />
          <div className="border-t border-border my-8" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 pb-20 px-5 text-center">
          <h1 className="text-2xl font-display font-bold text-foreground mb-4">
            Artikel niet gevonden
          </h1>
          <Link to="/blog" className="text-primary hover:underline">
            Terug naar blog
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{post.meta_title || post.title}</title>
        <meta name="description" content={post.meta_description || post.excerpt || ""} />
        <link rel="canonical" href={`https://platinautomotive.nl/blog/${post.slug}`} />
        <meta property="og:title" content={post.meta_title || post.title} />
        <meta property="og:description" content={post.meta_description || post.excerpt || ""} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://platinautomotive.nl/blog/${post.slug}`} />
        <meta property="og:image" content={post.featured_image || "https://platinautomotive.nl/images/platin-og-logo-v2.jpg?v=2"} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={post.featured_image || "https://platinautomotive.nl/images/platin-og-logo-v2.jpg?v=2"} />
        {articleJsonLd && (
          <script type="application/ld+json">{JSON.stringify(articleJsonLd)}</script>
        )}
      </Helmet>
      <Navbar />

      {/* Hero header area */}
      <div className="pt-28 md:pt-32 pb-8 px-5 md:px-[90px] max-w-[720px] mx-auto">
        {/* Back link */}
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-[10px] font-medium tracking-[0.2em] uppercase text-muted-foreground hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft className="w-3 h-3" /> Terug naar blog
        </Link>

        {/* Focus keyword badge */}
        {post.focus_keyword && (
          <div className="mb-4">
            <span className="inline-flex items-center gap-1.5 text-[9px] font-semibold tracking-[0.25em] uppercase text-primary border border-primary/20 bg-primary/5 px-3 py-1.5">
              <Tag className="w-2.5 h-2.5" />
              {post.focus_keyword}
            </span>
          </div>
        )}

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-foreground leading-tight mb-5">
          {post.title}
        </h1>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="text-base md:text-lg text-muted-foreground/80 leading-relaxed mb-6">
            {post.excerpt}
          </p>
        )}

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-muted-foreground pb-8 border-b border-border">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span className="text-xs tracking-[0.1em]">
              {format(new Date(post.created_at), "d MMMM yyyy", { locale: nl })}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-xs tracking-[0.1em]">{readingTime} min leestijd</span>
          </div>
          <span className="text-xs tracking-[0.1em]">Door Platin Automotive</span>
        </div>
      </div>

      {/* Featured image — full-bleed feel */}
      {post.featured_image && (
        <div className="px-5 md:px-[90px] max-w-[900px] mx-auto mb-10">
          <div className="overflow-hidden">
            <img
              src={post.featured_image}
              alt={post.title}
              className="w-full h-auto max-h-[480px] object-cover"
              loading="lazy"
            />
          </div>
        </div>
      )}

      {/* Article body */}
      <article className="px-5 md:px-[90px] max-w-[720px] mx-auto pb-12">
        <div
          className="prose prose-invert max-w-none
            prose-headings:font-display prose-headings:text-foreground prose-headings:tracking-tight
            prose-h1:hidden
            prose-h2:text-lg prose-h2:md:text-xl prose-h2:mt-12 prose-h2:mb-4 prose-h2:text-accent prose-h2:border-l-2 prose-h2:border-primary prose-h2:pl-4
            prose-h3:text-base prose-h3:md:text-lg prose-h3:mt-8 prose-h3:mb-3
            prose-p:text-[15px] prose-p:md:text-base prose-p:text-muted-foreground prose-p:leading-[1.85] prose-p:mb-5
            prose-li:text-[15px] prose-li:md:text-base prose-li:text-muted-foreground prose-li:leading-[1.8] prose-li:marker:text-primary
            prose-ul:my-5 prose-ul:space-y-1
            prose-ol:my-5 prose-ol:space-y-1
            prose-strong:text-foreground prose-strong:font-semibold
            prose-a:text-primary prose-a:underline prose-a:underline-offset-2 hover:prose-a:text-accent prose-a:transition-colors
            prose-blockquote:border-l-2 prose-blockquote:border-primary prose-blockquote:pl-5 prose-blockquote:italic prose-blockquote:text-muted-foreground/70"
          dangerouslySetInnerHTML={{ __html: post.content || "" }}
        />
      </article>

      {/* CTA Block */}
      <div className="px-5 md:px-[90px] max-w-[720px] mx-auto pb-12">
        <div className="border border-border bg-card p-8 md:p-12 space-y-5">
          <p className="text-[10px] font-medium tracking-[0.3em] uppercase text-primary">
            Contact
          </p>
          <h3 className="text-xl md:text-2xl font-display font-bold text-foreground">
            Interesse? Neem vrijblijvend contact op
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
            Wij helpen je graag verder met al je vragen over occasions, onderhoud of consignatie verkoop. Bel ons direct of stuur een WhatsApp bericht.
          </p>
          <div className="flex flex-col sm:flex-row items-start gap-3 pt-2">
            <a
              href="tel:+31612693825"
              className="flex items-center gap-2 bg-foreground text-background px-6 py-3 text-[10px] font-semibold tracking-[0.2em] uppercase hover:bg-primary hover:text-primary-foreground transition-all"
            >
              <Phone className="w-3.5 h-3.5" /> 06-12693825
            </a>
            <a
              href="https://wa.me/31612693825"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[hsl(var(--whatsapp))] text-[hsl(var(--whatsapp-foreground))] px-6 py-3 text-[10px] font-semibold tracking-[0.2em] uppercase hover:opacity-90 transition-all"
            >
              <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* Related posts */}
      {relatedPosts && relatedPosts.length > 0 && (
        <div className="px-5 md:px-[90px] max-w-[900px] mx-auto pb-20">
          <div className="border-t border-border pt-12">
            <p className="text-[10px] font-medium tracking-[0.3em] uppercase text-primary mb-3">
              Meer lezen
            </p>
            <h3 className="text-xl font-display font-bold text-foreground mb-8">
              Gerelateerde artikelen
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {relatedPosts.map((related) => (
                <Link
                  key={related.id}
                  to={`/blog/${related.slug}`}
                  className="group border border-border hover:border-primary/30 bg-card transition-all duration-300 overflow-hidden"
                >
                  {related.featured_image && (
                    <div className="overflow-hidden h-36">
                      <img
                        src={related.featured_image}
                        alt={related.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="p-4 space-y-2">
                    <span className="text-[9px] tracking-[0.15em] uppercase text-muted-foreground">
                      {format(new Date(related.created_at), "d MMM yyyy", { locale: nl })}
                    </span>
                    <h4 className="text-sm font-display font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {related.title}
                    </h4>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default BlogPost;
