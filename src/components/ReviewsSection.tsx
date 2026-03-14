import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Star } from "lucide-react";

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
        className={`w-4 h-4 ${i < count ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"}`}
      />
    ));

  if (loading) return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4 text-center">
        <p className="text-muted-foreground">Reviews laden...</p>
      </div>
    </section>
  );

  if (!data || data.reviews.length === 0) return null;

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Wat onze klanten zeggen
          </h2>
          <div className="flex items-center justify-center gap-2">
            <div className="flex">{renderStars(Math.round(data.rating))}</div>
            <span className="text-foreground font-semibold">{data.rating?.toFixed(1)}</span>
            <span className="text-muted-foreground">({data.totalRatings} reviews op Google)</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.reviews.map((review, index) => (
            <div key={index} className="bg-card border border-border rounded-xl p-6 hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={review.profile_photo_url}
                  alt={review.author_name}
                  className="w-10 h-10 rounded-full"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(review.author_name)}&background=1a1a2e&color=fff&size=40`;
                  }}
                />
                <div>
                  <p className="text-foreground font-medium text-sm">{review.author_name}</p>
                  <p className="text-muted-foreground text-xs">{review.relative_time_description}</p>
                </div>
              </div>
              <div className="flex mb-3">{renderStars(review.rating)}</div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {review.text || "Geen tekst toegevoegd."}
              </p>
              <div className="mt-4 flex items-center gap-1 text-xs text-muted-foreground">
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-3 h-3" />
                review
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <a
            href="https://search.google.com/local/writereview?placeid=ChIJI1ARTp7FxUcRPX-wUt-4OAA"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-3 bg-foreground text-background rounded-lg font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            Laat zelf een review achter
          </a>
        </div>
      </div>
    </section>
  );
}
