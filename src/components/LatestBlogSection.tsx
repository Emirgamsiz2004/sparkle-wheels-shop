import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Calendar } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

const LatestBlogSection = () => {
  const { data: posts } = useQuery({
    queryKey: ["blog-posts-latest"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("published", true)
        .order("created_at", { ascending: false })
        .limit(3);
      if (error) throw error;
      return data;
    },
  });

  if (!posts || posts.length === 0) return null;

  return (
    <section className="py-20 px-5 md:px-[90px] max-w-[1920px] mx-auto">
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="text-[10px] font-medium tracking-[0.3em] uppercase text-primary mb-3">Nieuws</p>
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">Laatste artikelen</h2>
        </div>
        <Link
          to="/blog"
          className="hidden md:inline-flex items-center gap-1.5 text-[10px] font-medium tracking-[0.2em] uppercase text-muted-foreground hover:text-primary transition-colors"
        >
          Bekijk alle artikelen <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {posts.map((post) => (
          <Link
            key={post.id}
            to={`/blog/${post.slug}`}
            className="group bg-card border border-border hover:border-primary/30 transition-all duration-300 overflow-hidden"
          >
            {post.featured_image && (
              <div className="overflow-hidden h-48">
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
              <h3 className="text-base font-display font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                {post.title}
              </h3>
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

      <Link
        to="/blog"
        className="md:hidden flex items-center justify-center gap-1.5 mt-8 text-[10px] font-medium tracking-[0.2em] uppercase text-muted-foreground hover:text-primary transition-colors"
      >
        Bekijk alle artikelen <ArrowRight className="w-3 h-3" />
      </Link>
    </section>
  );
};

export default LatestBlogSection;
