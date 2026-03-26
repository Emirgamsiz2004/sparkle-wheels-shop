import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Star, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

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

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const renderStars = (count: number) =>
  Array.from({ length: 5 }).map((_, i) => (
    <Star
      key={i}
      className={`w-4 h-4 ${i < count ? "text-yellow-400 fill-yellow-400" : "text-yellow-400/30 fill-yellow-400/30"}`}
    />
  ));

const ReviewsPage = () => {
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

  const reviews = data?.reviews ?? [];

  return (
    <>
      <Helmet>
        <title>Klantreviews | Platin Automotive</title>
        <meta name="description" content="Lees wat onze klanten zeggen over Platin Automotive. Bekijk alle Google Reviews." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <Navbar />
      <main className="min-h-screen bg-background pt-20">
        <div className="container mx-auto px-5 lg:px-16 max-w-[1920px] py-12">
          {/* Back */}
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-body text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Terug naar home
          </Link>

          {/* Header */}
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-2">
              <GoogleIcon />
              <p className="text-[10px] tracking-[0.3em] uppercase font-body font-medium text-muted-foreground">
                Google Reviews
              </p>
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground tracking-tight mb-3">
              Alle klantreviews
            </h1>
            {data && (
              <div className="flex items-center gap-3">
                <div className="flex gap-0.5">{renderStars(Math.round(data.rating))}</div>
                <span className="text-sm font-display font-bold text-foreground">{data.rating?.toFixed(1)}</span>
                <span className="text-xs font-body text-muted-foreground">({data.totalRatings} reviews)</span>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : reviews.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-12">Geen reviews gevonden.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {reviews.map((review, index) => (
                <div
                  key={index}
                  className="border border-border bg-card p-6 flex flex-col transition-colors duration-300 hover:border-primary/30"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <img
                      src={review.profile_photo_url}
                      alt={review.author_name}
                      className="w-10 h-10 rounded-full object-cover shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(review.author_name)}&background=2a2018&color=c4a882&size=40&bold=true`;
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-body font-medium text-foreground truncate">{review.author_name}</p>
                      <div className="flex items-center gap-1.5">
                        <div className="flex gap-0.5">{renderStars(review.rating)}</div>
                        <span className="text-[11px] text-muted-foreground/60">{review.relative_time_description}</span>
                      </div>
                    </div>
                    <GoogleIcon />
                  </div>
                  <p className="text-sm font-body text-muted-foreground leading-relaxed flex-1">
                    {review.text || "Geen tekst toegevoegd."}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Write review CTA */}
          <div className="mt-12 text-center">
            <a
              href="https://search.google.com/local/writereview?placeid=ChIJI1ARTp7FxUcRPX-wUt-4OAA"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 border border-border text-sm font-body font-medium text-foreground hover:border-foreground transition-colors"
            >
              Laat een review achter op Google
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default ReviewsPage;
