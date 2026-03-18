import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Star, ArrowRight } from "lucide-react";

interface Review {
  author_name: string;
  profile_photo_url: string;
  rating: number;
  text: string;
  relative_time_description: string;
}

interface ReviewsData {
  reviews: Review[];
  rating: number;
  totalRatings: number;
}

export default function ReviewsSection() {
  const [data, setData] = useState<ReviewsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const { data: result, error } = await supabase.functions.invoke("fetch-google-reviews");
        if (error) throw error;
        setData(result);
      } catch (err) {
        console.error("Reviews ophalen mislukt:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  const renderStars = (count: number) =>
    Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 ${i < count ? "text-primary fill-primary" : "text-border"}`}
      />
    ));

  if (loading) return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-5 lg:px-16 max-w-[1920px] text-center">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    </section>
  );

  if (!data || data.reviews.length === 0) return null;

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-5 lg:px-16 max-w-[1920px]">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
          <div>
            <p className="text-[10px] tracking-[0.3em] uppercase font-body font-medium text-muted-foreground mb-2">
              Klantervaringen
            </p>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground tracking-tight">
              Wat onze klanten zeggen
            </h2>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex gap-0.5">{renderStars(Math.round(data.rating))}</div>
            <span className="text-sm font-display font-bold text-foreground">{data.rating?.toFixed(1)}</span>
            <span className="text-[11px] font-body text-muted-foreground">
              ({data.totalRatings})
            </span>
          </div>
        </div>

        {/* Reviews — horizontal scroll on mobile, grid on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.reviews.slice(0, 6).map((review, index) => (
            <div
              key={index}
              className="border border-border bg-card p-6 flex flex-col justify-between transition-colors duration-300 hover:border-primary/30"
            >
              {/* Top: author + rating */}
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={review.profile_photo_url}
                  alt={review.author_name}
                  className="w-8 h-8 rounded-full object-cover shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(review.author_name)}&background=2a2018&color=c4a882&size=32&bold=true`;
                  }}
                />
                <div className="min-w-0">
                  <p className="text-xs font-body font-medium text-foreground truncate">{review.author_name}</p>
                  <div className="flex items-center gap-1.5">
                    <div className="flex gap-0.5">{renderStars(review.rating)}</div>
                    <span className="text-[10px] font-body text-muted-foreground">{review.relative_time_description}</span>
                  </div>
                </div>
              </div>

              {/* Review text */}
              <p className="text-[13px] font-body text-muted-foreground leading-relaxed line-clamp-4 flex-1">
                {review.text || "Geen tekst toegevoegd."}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-8 flex justify-center">
          <a
            href="https://search.google.com/local/writereview?placeid=ChIJI1ARTp7FxUcRPX-wUt-4OAA"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 text-[11px] font-body font-semibold tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground transition-colors duration-300"
          >
            Laat een review achter
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
          </a>
        </div>
      </div>
    </section>
  );
}
