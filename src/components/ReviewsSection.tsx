import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Star, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

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

const CARD_W = 280;
const GAP = 16;

export default function ReviewsSection() {
  const [data, setData] = useState<ReviewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const posRef = useRef(0);
  const isPausedRef = useRef(false);
  const [, forceUpdate] = useState(0);

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
  const setWidth = reviews.length * (CARD_W + GAP);

  // Auto-scroll
  useEffect(() => {
    if (reviews.length === 0 || !scrollRef.current) return;

    let animationId: number;

    const animate = () => {
      if (!isPausedRef.current && scrollRef.current) {
        posRef.current += 0.5;
        if (posRef.current >= setWidth) posRef.current -= setWidth;
        scrollRef.current.style.transform = `translateX(-${posRef.current}px)`;
      }
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [reviews.length, setWidth]);

  const pause = () => { isPausedRef.current = true; };
  const resume = () => { isPausedRef.current = false; };
  const resumeDelayed = () => { setTimeout(() => { isPausedRef.current = false; }, 3000); };

  const nudge = (dir: number) => {
    if (!scrollRef.current) return;
    const step = CARD_W + GAP;
    posRef.current += dir * step;
    if (posRef.current < 0) posRef.current += setWidth;
    if (posRef.current >= setWidth) posRef.current -= setWidth;
    scrollRef.current.style.transform = `translateX(-${posRef.current}px)`;
  };

  // Drag / swipe support
  const dragStart = useRef<{ x: number; pos: number } | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    pause();
    dragStart.current = { x: e.clientX, pos: posRef.current };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragStart.current || !scrollRef.current) return;
    const dx = dragStart.current.x - e.clientX;
    let newPos = dragStart.current.pos + dx;
    if (newPos < 0) newPos += setWidth;
    if (newPos >= setWidth) newPos -= setWidth;
    posRef.current = newPos;
    scrollRef.current.style.transform = `translateX(-${posRef.current}px)`;
  };

  const onPointerUp = () => {
    dragStart.current = null;
    resumeDelayed();
  };

  const renderStars = (count: number) =>
    Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 ${i < count ? "text-yellow-400 fill-yellow-400" : "text-yellow-400/30 fill-yellow-400/30"}`}
      />
    ));

  if (loading) return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-5 lg:px-16 max-w-[1920px] text-center">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    </section>
  );

  if (!data || reviews.length === 0) return null;

  const loopedReviews = [...reviews, ...reviews, ...reviews];

  return (
    <section className="py-20 bg-background overflow-hidden">
      <div className="container mx-auto px-5 lg:px-16 max-w-[1920px]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <GoogleIcon />
              <p className="text-[10px] tracking-[0.3em] uppercase font-body font-medium text-muted-foreground">
                Google Reviews
              </p>
            </div>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground tracking-tight">
              Wat onze klanten zeggen
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">{renderStars(Math.round(data.rating))}</div>
              <span className="text-sm font-display font-bold text-foreground">{data.rating?.toFixed(1)}</span>
              <span className="text-[11px] font-body text-muted-foreground">({data.totalRatings})</span>
            </div>

            {/* Nav arrows */}
            <div className="hidden md:flex items-center gap-1">
              <button
                onClick={() => nudge(-1)}
                className="w-8 h-8 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground transition-colors duration-200"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => nudge(1)}
                className="w-8 h-8 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground transition-colors duration-200"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Infinite slider */}
        <div
          className="overflow-hidden cursor-grab active:cursor-grabbing select-none"
          onMouseEnter={pause}
          onMouseLeave={resume}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{ touchAction: "pan-y" }}
        >
          <div
            ref={scrollRef}
            className="flex will-change-transform"
            style={{ gap: `${GAP}px` }}
          >
            {loopedReviews.map((review, index) => (
              <div
                key={index}
                className="w-[280px] shrink-0 border border-border bg-card p-6 flex flex-col justify-between transition-colors duration-300 hover:border-primary/30"
              >
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src={review.profile_photo_url}
                    alt={review.author_name}
                    className="w-8 h-8 rounded-full object-cover shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(review.author_name)}&background=2a2018&color=c4a882&size=32&bold=true`;
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-body font-medium text-foreground truncate">{review.author_name}</p>
                    <div className="flex gap-0.5">{renderStars(review.rating)}</div>
                  </div>
                  <GoogleIcon />
                </div>
                <p className="text-[13px] font-body text-muted-foreground leading-relaxed line-clamp-4 flex-1 mb-3">
                  {review.text || "Geen tekst toegevoegd."}
                </p>
                <span className="text-[10px] font-body text-muted-foreground/60">{review.relative_time_description}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/reviews"
            className="group inline-flex items-center gap-2 text-[11px] font-body font-semibold tracking-[0.15em] uppercase text-foreground hover:text-foreground/80 transition-colors duration-300 border border-border px-5 py-2.5 hover:border-foreground/30"
          >
            Bekijk alle reviews
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
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
