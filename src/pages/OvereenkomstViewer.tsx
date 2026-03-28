import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const OvereenkomstViewer = () => {
  const { id } = useParams<{ id: string }>();
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchDoc = async () => {
      // Find the test drive by id to get the pdf path
      const { data: td } = await supabase
        .from("test_drives")
        .select("pdf_definitief_path, pdf_path")
        .eq("id", id)
        .maybeSingle();

      const path = td?.pdf_definitief_path || td?.pdf_path;
      if (!path) {
        setError(true);
        setLoading(false);
        return;
      }

      const { data } = await supabase.storage
        .from("test-drive-files")
        .download(path);

      if (!data) {
        setError(true);
        setLoading(false);
        return;
      }

      const text = await data.text();
      setHtml(text);
      setLoading(false);
    };

    fetchDoc();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-500">Document laden...</p>
      </div>
    );
  }

  if (error || !html) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-500">Document niet gevonden of niet beschikbaar.</p>
      </div>
    );
  }

  return (
    <iframe
      srcDoc={html}
      title="Proefritovereenkomst"
      className="w-full min-h-screen border-0"
      style={{ height: "100vh" }}
    />
  );
};

export default OvereenkomstViewer;
