import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const VWE_SRCDOC = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script src="https://code.jquery.com/jquery-3.3.1.min.js"><\/script>
<style>
  /* === AGGRESSIVE OVERRIDES === */
  * {
    font-family: 'DM Sans', sans-serif !important;
    box-sizing: border-box;
  }

  body, html {
    margin: 0;
    padding: 0;
    background: hsl(0 0% 5%) !important;
    color: hsl(0 0% 62%) !important;
  }

  /* All containers */
  div, section, article, aside, main, header, footer, nav,
  .occasion-list, .occasion-item, .occasion-detail,
  .filter-container, .search-container, .result-container,
  [class*="container"], [class*="wrapper"], [class*="panel"],
  [class*="box"], [class*="card"], [class*="block"],
  [class*="grid"], [class*="list"], [class*="item"],
  [class*="row"], [class*="col"], [class*="content"],
  [class*="detail"], [class*="info"], [class*="result"],
  [class*="filter"], [class*="search"], [class*="overview"] {
    background-color: hsl(0 0% 5%) !important;
    color: hsl(0 0% 62%) !important;
    border-color: hsl(0 0% 13%) !important;
  }

  /* Headings */
  h1, h2, h3, h4, h5, h6,
  [class*="title"], [class*="heading"], [class*="naam"],
  [class*="merk"], [class*="model"] {
    font-family: 'Orbitron', sans-serif !important;
    color: hsl(0 0% 78%) !important;
    letter-spacing: 0.02em;
  }

  /* Text and labels */
  p, span, label, a, li, td, th, small, strong, em, b, i,
  [class*="label"], [class*="text"], [class*="desc"],
  [class*="prijs"], [class*="price"], [class*="value"],
  [class*="spec"], [class*="kenmerk"] {
    color: hsl(0 0% 62%) !important;
  }

  /* Links */
  a {
    color: hsl(0 0% 78%) !important;
    text-decoration: none !important;
    transition: color 0.2s ease !important;
  }
  a:hover {
    color: hsl(0 0% 95%) !important;
  }

  /* Buttons */
  button, input[type="submit"], input[type="button"],
  .btn, [class*="button"], [class*="btn"],
  [class*="zoek"], [class*="submit"] {
    background: hsl(0 0% 50%) !important;
    color: hsl(0 0% 5%) !important;
    border: 1px solid hsl(0 0% 30%) !important;
    border-radius: 0 !important;
    font-family: 'DM Sans', sans-serif !important;
    font-weight: 600 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.1em !important;
    font-size: 11px !important;
    padding: 10px 20px !important;
    cursor: pointer !important;
    transition: all 0.3s ease !important;
  }
  button:hover, input[type="submit"]:hover, input[type="button"]:hover,
  .btn:hover, [class*="button"]:hover, [class*="btn"]:hover {
    background: hsl(0 0% 78%) !important;
    color: hsl(0 0% 5%) !important;
  }

  /* Form inputs */
  input, select, textarea,
  input[type="text"], input[type="number"], input[type="search"],
  [class*="input"], [class*="select"], [class*="dropdown"] {
    background: hsl(0 0% 8%) !important;
    color: hsl(0 0% 62%) !important;
    border: 1px solid hsl(0 0% 13%) !important;
    border-radius: 0 !important;
    font-family: 'DM Sans', sans-serif !important;
    padding: 8px 12px !important;
    outline: none !important;
  }
  input:focus, select:focus, textarea:focus {
    border-color: hsl(0 0% 30%) !important;
  }

  /* Tables */
  table, tr, td, th {
    background: hsl(0 0% 5%) !important;
    border-color: hsl(0 0% 13%) !important;
    color: hsl(0 0% 62%) !important;
  }
  th {
    color: hsl(0 0% 78%) !important;
    font-family: 'Orbitron', sans-serif !important;
    text-transform: uppercase !important;
    font-size: 10px !important;
    letter-spacing: 0.15em !important;
  }

  /* Images */
  img {
    border-radius: 0 !important;
    border: 1px solid hsl(0 0% 13%) !important;
  }

  /* Pagination */
  [class*="paging"], [class*="pagination"], [class*="page"] {
    background: hsl(0 0% 5%) !important;
  }
  [class*="paging"] a, [class*="pagination"] a {
    background: hsl(0 0% 8%) !important;
    color: hsl(0 0% 62%) !important;
    border: 1px solid hsl(0 0% 13%) !important;
    border-radius: 0 !important;
  }
  [class*="paging"] a:hover, [class*="pagination"] a:hover,
  [class*="paging"] .active, [class*="pagination"] .active {
    background: hsl(0 0% 50%) !important;
    color: hsl(0 0% 5%) !important;
  }

  /* Price styling */
  [class*="prijs"], [class*="price"] {
    font-family: 'Orbitron', sans-serif !important;
    color: hsl(0 0% 78%) !important;
    font-weight: 700 !important;
  }

  /* Separator / divider lines */
  hr, [class*="separator"], [class*="divider"] {
    border-color: hsl(0 0% 13%) !important;
    background: hsl(0 0% 13%) !important;
  }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: hsl(0 0% 5%); }
  ::-webkit-scrollbar-thumb { background: hsl(0 0% 20%); border-radius: 0; }

  /* Load fonts */
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Orbitron:wght@400;500;600;700;800;900&display=swap');
</style>
</head>
<body>
<script src="//svl.autodealers.nl/jsVoorraadPlugin.ashx?did=91347"><\/script>
</body>
</html>`;

const Voorraad = () => {
  const [frameHeight, setFrameHeight] = useState(2600);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data) return;

      if (event.data.id === "ResizeFrame" && Number(event.data.height) > 150) {
        setFrameHeight(Number(event.data.height) + 20);
      }

      if (event.data.id === "ScrollFrameTop") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Occasions Voorraad | Platin Automotive Roelofarendsveen</title>
        <meta
          name="description"
          content="Bekijk ons actuele aanbod occasions in Roelofarendsveen. Alle auto's zijn gecontroleerd en rijklaar. Platin Automotive — eerlijke prijzen."
        />
        <link rel="canonical" href="https://platinautomotive.nl/voorraad" />
        <meta name="robots" content="index, follow" />
      </Helmet>

      <Navbar />

      <section className="pt-32 pb-28 lg:pb-36">
        <div className="container mx-auto px-6 lg:px-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-4"
          >
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase font-body font-medium text-muted-foreground hover:text-foreground transition-colors mb-8"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Terug naar home
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-12"
          >
            <p className="text-[10px] tracking-[0.5em] uppercase font-body font-medium text-muted-foreground mb-3">
              Ons Aanbod
            </p>
            <h1 className="text-4xl md:text-6xl font-display font-bold text-foreground tracking-tight mb-4">
              Voorraad
            </h1>
            <p className="text-muted-foreground font-body font-light max-w-2xl">
              Bekijk hieronder direct ons actuele aanbod occasions via onze gekoppelde voorraadlijst.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
          >
            <iframe
              id="autodealers_frame"
              title="Platin Automotive voorraadlijst"
              src={VWE_IFRAME_SRC}
              className="w-full border-0 bg-background"
              style={{ height: `${frameHeight}px` }}
              loading="lazy"
            />
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Voorraad;
