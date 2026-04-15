import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Calendar } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

const Blog = () => {
  const { data: posts, isLoading } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("published", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Auto Tips & Nieuws | Blog Platin Automotive Roelofarendsveen</title>
        <meta name="description" content="Lees onze blogs over occasions kopen, auto detailing, onderhoud en consignatie. Handige tips van Platin Automotive in Roelofarendsveen." />
        <link rel="canonical" href="https://platinautomotive.nl/blog" />
      </Helmet>
      <Navbar />

      <section className="pt-32 pb-20 px-5 md:px-[90px] max-w-[1920px] mx-auto">
        <div className="mb-12">
          <p className="text-[10px] font-medium tracking-[0.3em] uppercase text-primary mb-3">Nieuws & Blog</p>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">Laatste artikelen</h1>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card border border-border">
                <Skeleton className="w-full h-52" />
                <div className="p-5 space-y-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : posts && posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Link
                key={post.id}
                to={`/blog/${post.slug}`}
                className="group bg-card border border-border hover:border-primary/30 transition-all duration-300 overflow-hidden"
              >
                {post.featured_image && (
                  <div className="overflow-hidden h-52">
                    <img
                      src={post.featured_image}
                      alt={post.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    <span className="text-[10px] tracking-[0.15em] uppercase">
                      {format(new Date(post.created_at), "d MMMM yyyy", { locale: nl })}
                    </span>
                  </div>
                  <h2 className="text-lg font-display font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
                  )}
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-medium tracking-[0.2em] uppercase text-primary transition-all group-hover:gap-2.5">
                    Lees meer <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-muted-foreground">Er zijn nog geen blogposts gepubliceerd.</p>
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
};

export default Blog;
