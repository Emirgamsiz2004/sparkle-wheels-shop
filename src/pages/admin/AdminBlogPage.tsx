import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Loader2, Pencil, X, Check } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

const AdminBlogPage = () => {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: "", excerpt: "", meta_title: "", meta_description: "", content: "" });

  const { data: posts, isLoading } = useQuery({
    queryKey: ["admin-blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*, vehicles(merk, model, bouwjaar)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const togglePublished = async (id: string, published: boolean) => {
    const { error } = await supabase.from("blog_posts").update({ published: !published }).eq("id", id);
    if (error) { toast.error("Fout bij bijwerken"); return; }
    toast.success(published ? "Post verborgen" : "Post gepubliceerd");
    queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
  };

  const startEdit = (post: any) => {
    setEditingId(post.id);
    setEditForm({
      title: post.title,
      excerpt: post.excerpt || "",
      meta_title: post.meta_title || "",
      meta_description: post.meta_description || "",
      content: post.content || "",
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const { error } = await supabase.from("blog_posts").update(editForm).eq("id", editingId);
    if (error) { toast.error("Fout bij opslaan"); return; }
    toast.success("Blogpost bijgewerkt");
    setEditingId(null);
    queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
  };

  const deletePost = async (id: string) => {
    if (!confirm("Weet je zeker dat je deze blogpost wilt verwijderen?")) return;
    const { error } = await supabase.from("blog_posts").delete().eq("id", id);
    if (error) { toast.error("Fout bij verwijderen"); return; }
    toast.success("Blogpost verwijderd");
    queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Blog Beheer</h1>

      {/* Edit modal */}
      {editingId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Blogpost bewerken</h2>
              <button onClick={() => setEditingId(null)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>
            <Field label="Titel" value={editForm.title} onChange={(v) => setEditForm(f => ({ ...f, title: v }))} />
            <Field label="Excerpt" value={editForm.excerpt} onChange={(v) => setEditForm(f => ({ ...f, excerpt: v }))} />
            <Field label="Meta Titel" value={editForm.meta_title} onChange={(v) => setEditForm(f => ({ ...f, meta_title: v }))} />
            <Field label="Meta Beschrijving" value={editForm.meta_description} onChange={(v) => setEditForm(f => ({ ...f, meta_description: v }))} />
            <div>
              <label className="block text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-1.5">Content (HTML)</label>
              <textarea
                value={editForm.content}
                onChange={(e) => setEditForm(f => ({ ...f, content: e.target.value }))}
                rows={12}
                className="w-full px-3 py-2.5 text-sm bg-secondary/50 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y font-mono"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditingId(null)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">Annuleren</button>
              <button onClick={saveEdit} className="inline-flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors">
                <Check className="w-4 h-4" /> Opslaan
              </button>
            </div>
          </div>
        </div>
      )}

      {posts && posts.length > 0 ? (
        <div className="space-y-3">
          {posts.map((post: any) => (
            <div key={post.id} className="bg-card border border-border rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-foreground truncate">{post.title}</h3>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span>{format(new Date(post.created_at), "d MMM yyyy", { locale: nl })}</span>
                  {post.vehicles && (
                    <span className="bg-accent/50 px-2 py-0.5 rounded-md text-[11px]">
                      {post.vehicles.merk} {post.vehicles.model} {post.vehicles.bouwjaar}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{post.published ? "Live" : "Verborgen"}</span>
                  <Switch checked={post.published} onCheckedChange={() => togglePublished(post.id, post.published)} />
                </div>
                <button onClick={() => startEdit(post)} className="p-2 text-muted-foreground hover:text-primary transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => deletePost(post.id)} className="p-2 text-muted-foreground hover:text-red-400 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-muted-foreground">Nog geen blogposts. Voeg een auto toe om automatisch een blogpost te genereren.</p>
        </div>
      )}
    </div>
  );
};

const Field = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
  <div>
    <label className="block text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-1.5">{label}</label>
    <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2.5 text-sm bg-secondary/50 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" />
  </div>
);

export default AdminBlogPage;
