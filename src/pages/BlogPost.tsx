import { Helmet } from "react-helmet-async";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Phone, MessageCircle, Calendar } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

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
        <div className="pt-32 pb-20 px-5 md:px-[90px] max-w-[900px] mx-auto space-y-6">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-4 w-full" />
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
          <h1 className="text-2xl font-display font-bold text-foreground mb-4">Artikel niet gevonden</h1>
          <Link to="/blog" className="text-primary hover:underline">Terug naar blog</Link>
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
        {post.featured_image && <meta property="og:image" content={post.featured_image} />}
        {articleJsonLd && (
          <script type="application/ld+json">{JSON.stringify(articleJsonLd)}</script>
        )}
      </Helmet>
      <Navbar />

      <article className="pt-32 pb-12 px-5 md:px-[90px] max-w-[900px] mx-auto">
        {/* Back link */}
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-[10px] font-medium tracking-[0.2em] uppercase text-muted-foreground hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft className="w-3 h-3" /> Terug naar blog
        </Link>

        {/* Date */}
        <div className="flex items-center gap-2 text-muted-foreground mb-4">
          <Calendar className="w-3.5 h-3.5" />
          <span className="text-xs tracking-[0.1em]">
            {format(new Date(post.created_at), "d MMMM yyyy", { locale: nl })}
          </span>
        </div>

        {/* Featured image */}
        {post.featured_image && (
          <div className="mb-8 overflow-hidden">
            <img
              src={post.featured_image}
              alt={post.title}
              className="w-full h-auto max-h-[500px] object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div
          className="prose prose-invert prose-lg max-w-none
            prose-headings:font-display prose-headings:text-foreground
            prose-h1:text-3xl prose-h1:md:text-4xl prose-h1:mb-6
            prose-h2:text-xl prose-h2:md:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:text-primary
            prose-p:text-muted-foreground prose-p:leading-relaxed
            prose-li:text-muted-foreground
            prose-strong:text-foreground
            prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
          dangerouslySetInnerHTML={{ __html: post.content || "" }}
        />
      </article>

      {/* CTA Block */}
      <div className="px-5 md:px-[90px] max-w-[900px] mx-auto pb-20">
        <div className="border border-border bg-card p-8 md:p-12 text-center space-y-5">
          <h3 className="text-xl md:text-2xl font-display font-bold text-foreground">
            Interesse in deze auto? Neem contact op
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Wij helpen je graag verder. Bel ons direct of stuur een WhatsApp bericht.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="tel:+31612693825"
              className="flex items-center gap-2 bg-foreground text-background px-6 py-3 text-[10px] font-semibold tracking-[0.2em] uppercase hover:bg-primary hover:text-primary-foreground transition-all"
            >
              <Phone className="w-3.5 h-3.5" /> Bel direct
            </a>
            <a
              href="https://wa.me/31612693825"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[hsl(var(--whatsapp))] text-[hsl(var(--whatsapp-foreground))] px-6 py-3 text-[10px] font-semibold tracking-[0.2em] uppercase hover:opacity-90 transition-all"
            >
              <MessageCircle className="w-3.5 h-3.5" /> Stuur een WhatsApp
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default BlogPost;
