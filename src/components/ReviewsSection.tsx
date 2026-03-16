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
        className={`w-3.5 h-3.5 ${i < count ? "text-primary fill-primary" : "text-border"}`}
      />
    ));

  if (loading) return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-5 lg:px-16 max-w-[1920px] text-center">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    </section>
  );

  if (!data || data.reviews.length === 0) return null;

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-5 lg:px-16 max-w-[1920px]">
        {/* Header */}
        <div className="mb-16">
          <p className="text-[10px] tracking-[0.3em] uppercase font-body font-medium text-muted-foreground mb-4">
            Klantervaringen
          </p>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground tracking-tight leading-tight">
              Wat onze klanten zeggen
            </h2>
            <div className="flex items-center gap-3">
              <div className="flex gap-0.5">{renderStars(Math.round(data.rating))}</div>
              <span className="text-sm font-display font-bold text-foreground">{data.rating?.toFixed(1)}</span>
              <span className="text-[11px] font-body text-muted-foreground">
                · {data.totalRatings} reviews
              </span>
            </div>
          </div>
        </div>

        {/* Reviews grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
          {data.reviews.map((review, index) => (
            <div
              key={index}
              className="bg-background p-8 flex flex-col justify-between group hover:bg-card transition-colors duration-500"
            >
              <div>
                <div className="flex gap-0.5 mb-5">{renderStars(review.rating)}</div>
                <p className="text-sm font-body text-foreground/80 leading-relaxed line-clamp-4">
                  {review.text || "Geen tekst toegevoegd."}
                </p>
              </div>

              <div className="mt-6 pt-5 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={review.profile_photo_url}
                    alt={review.author_name}
                    className="w-8 h-8 rounded-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(review.author_name)}&background=2a2018&color=c4a882&size=32&bold=true`;
                    }}
                  />
                  <div>
                    <p className="text-xs font-body font-medium text-foreground">{review.author_name}</p>
                    <p className="text-[10px] font-body text-muted-foreground">{review.relative_time_description}</p>
                  </div>
                </div>
                <svg className="w-4 h-4 text-muted-foreground/40" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <a
            href="https://search.google.com/local/writereview?placeid=ChIJI1ARTp7FxUcRPX-wUt-4OAA"
            target="_blank"
            rel="noopener noreferrer"
            className="group/btn inline-flex items-center gap-3 border-2 border-border text-foreground px-8 py-3.5 text-[11px] font-body font-semibold tracking-[0.15em] uppercase transition-all duration-500 hover:border-foreground hover:bg-foreground hover:text-background"
          >
            Laat zelf een review achter
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-500 group-hover/btn:translate-x-1" />
          </a>
        </div>
      </div>
    </section>
  );
}
