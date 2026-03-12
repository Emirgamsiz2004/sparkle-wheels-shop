import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    const { data } = await supabase.from("app_settings").select("key, value");
    const map: Record<string, string> = {};
    (data || []).forEach((row: any) => { map[row.key] = row.value || ""; });
    setSettings(map);
    setLoading(false);
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const saveSetting = async (key: string, value: string) => {
    const { data: existing } = await supabase.from("app_settings").select("id").eq("key", key).maybeSingle();
    if (existing) {
      await supabase.from("app_settings").update({ value, updated_at: new Date().toISOString() } as any).eq("key", key);
    } else {
      await supabase.from("app_settings").insert({ key, value } as any);
    }
    await fetchSettings();
  };

  return { settings, loading, saveSetting, refetch: fetchSettings };
}
