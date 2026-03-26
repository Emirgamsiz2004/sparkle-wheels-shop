import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Unsubscribe = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "valid" | "invalid" | "done" | "error">("loading");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!token) { setStatus("invalid"); return; }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    fetch(`${supabaseUrl}/functions/v1/handle-email-unsubscribe?token=${token}`, {
      headers: { apikey: anonKey },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.valid) setStatus("valid");
        else if (data.reason === "already_unsubscribed") setStatus("done");
        else setStatus("invalid");
      })
      .catch(() => setStatus("error"));
  }, [token]);

  const handleUnsubscribe = async () => {
    if (!token) return;
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", {
        body: { token },
      });
      if (error) throw error;
      if (data?.success) setStatus("done");
      else setStatus("error");
    } catch {
      setStatus("error");
    }
    setProcessing(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <h1 className="text-xl font-semibold text-foreground">E-mail uitschrijven</h1>

        {status === "loading" && (
          <p className="text-muted-foreground text-sm">Even geduld...</p>
        )}

        {status === "valid" && (
          <>
            <p className="text-muted-foreground text-sm">
              Weet je zeker dat je je wilt uitschrijven van onze e-mails?
            </p>
            <button
              onClick={handleUnsubscribe}
              disabled={processing}
              className="px-6 py-2 text-sm font-medium bg-foreground text-background rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {processing ? "Bezig..." : "Uitschrijven bevestigen"}
            </button>
          </>
        )}

        {status === "done" && (
          <p className="text-emerald-500 text-sm">
            Je bent succesvol uitgeschreven. Je ontvangt geen e-mails meer van ons.
          </p>
        )}

        {status === "invalid" && (
          <p className="text-red-400 text-sm">
            Ongeldige of verlopen link.
          </p>
        )}

        {status === "error" && (
          <p className="text-red-400 text-sm">
            Er is iets misgegaan. Probeer het later opnieuw.
          </p>
        )}

        <Link to="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors block">
          Terug naar de website
        </Link>
      </div>
    </div>
  );
};

export default Unsubscribe;
