import { useCallback, useEffect, useRef, useState } from "react";
import { Upload, Image, Trash2, Eye, RotateCw, RefreshCw, Cog, ChevronLeft, LogOut, Edit2 } from "lucide-react";
import { api } from "@/lib/api";

export default function AdminDashboard({ navigate }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState("");
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState(null);
  const [editingNameId, setEditingNameId] = useState(null);
  const [editNameValue, setEditNameValue] = useState("");
  const fileInputRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.listTemplates(false);
      setTemplates(data || []);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleFile = (e) => setFile(e.target.files[0]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return setMessage("Please choose a template image.");
    const form = new FormData();
    form.append("template", file);
    if (name) form.append("name", name);
    setUploading(true);
    setMessage(null);
    try {
      const created = await api.createTemplate(form);
      setMessage("Template uploaded. Open the editor to add photo frames.");
      setFile(null);
      setName("");
      fileInputRef.current && (fileInputRef.current.value = "");
      await load();
      navigate("editor", created.id);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handlePublish = async (id) => {
    try {
      await api.publishTemplate(id);
      await load();
      setMessage("Template published and available to customers.");
    } catch (err) {
      setMessage(err.message);
    }
  };

  const handleDelete = async (id, filename) => {
    if (!window.confirm("Delete this template design?")) return;
    try {
      await api.deleteTemplate(id);
      await load();
      setMessage("Template deleted.");
    } catch (err) {
      setMessage(err.message);
    }
  };

  const handleRename = async (id) => {
    if (!editNameValue.trim()) return;
    try {
      await api.updateTemplate(id, { name: editNameValue.trim() });
      setEditingNameId(null);
      setEditNameValue("");
      await load();
      setMessage("Template name updated.");
    } catch (err) {
      setMessage(err.message);
    }
  };

  const statusBadge = (status) => (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
      status === "published"
        ? "bg-fleur-rose/10 text-fleur-rose border-fleur-rose/30"
        : "bg-fleur-blush text-fleur-ink/60 border-fleur-blush/50"
    }`}>
      {status === "published" ? "Published" : "Draft"}
    </span>
  );

  return (
    <div className="min-h-screen bg-fleur-cream">
      <div className="px-6 py-4 border-b border-fleur-blush/60 bg-white/70 backdrop-blur-lg sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-fleur-rose flex items-center justify-center text-xs font-bold text-white shadow-[0_4px_12px_rgba(212,165,165,0.35)]">
              F&F
            </div>
            <span className="font-display font-bold text-lg text-fleur-ink">Fleur 'N Frame</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("welcome")} className="btn-ghost text-fleur-ink/70 text-sm hover:bg-fleur-blush/50">
              <Eye className="w-4 h-4" /> Customer booth
            </button>
            <button onClick={() => { sessionStorage.removeItem("fleur_admin"); navigate("admin-logout"); }} className="btn-soft text-xs text-fleur-rose border-fleur-rose/40 hover:bg-fleur-rose/10 px-3 py-2 flex items-center gap-1">
              <LogOut className="w-3 h-3" /> Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-10">
          <div>
            <h2 className="font-display font-bold text-2xl text-fleur-ink mb-1">Photo Strip Designs</h2>
            <p className="text-fleur-ink/60 text-sm">Upload and configure templates customers can choose from.</p>
          </div>
          <div className="flex items-end gap-3">
            <button onClick={() => navigate("welcome")} className="btn-soft px-5 py-3 text-sm flex items-center gap-2 hover:bg-fleur-blush/80">
              <Eye className="w-4 h-4" /> Customer preview
            </button>
          </div>
        </div>

        {/* Upload card */}
        <div className="card p-8 mb-10 animate-slide-up">
          <div className="flex items-center gap-2 mb-6">
            <Upload className="w-5 h-5 text-fleur-rose" />
            <h3 className="font-semibold text-fleur-ink">Upload new template</h3>
          </div>
          <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="md:col-span-2">
              <label className="label">Template name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Vintage Floral Strip"
                className="input"
              />
            </div>
            <div className="md:col-span-2">
              <label className="label">Template image</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFile}
                className="block w-full text-sm text-fleur-ink/60 file:mr-4 file:py-3 file:px-5 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-fleur-blush file:text-fleur-rose hover:file:bg-fleur-rose/20 cursor-pointer border border-dashed border-fleur-blush/50 rounded-xl px-4 py-4 bg-white/50 hover:bg-fleur-blush/30 transition-all"
              />
              {file && <p className="mt-2 text-xs text-fleur-rose">{file.name}</p>}
            </div>
            <div className="md:col-span-2 flex items-end">
              <button
                type="submit"
                disabled={uploading || !file}
                className="btn-primary w-full py-4 flex items-center justify-center gap-2 shadow-[0_10px_25px_rgba(212,165,165,0.35)] hover:shadow-[0_15px_35px_rgba(212,165,165,0.45)]"
              >
                <Image className="w-4 h-4" /> {uploading ? "Uploading…" : "Create template"}
              </button>
            </div>
          </form>
        </div>

        {message && (
          <div className="mb-8 p-5 rounded-xl bg-fleur-rose/10 border border-fleur-rose/30 text-fleur-rose text-sm flex items-center gap-2 animate-slide-up">
            <RotateCw className="w-4 h-4" /> {message}
          </div>
        )}

        {/* Templates list */}
        <div className="overflow-hidden animate-slide-up delay-100">
          <div className="card mb-6">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-fleur-blush/40 bg-fleur-blush/20">
                  <th className="py-4 text-left text-xs font-bold text-fleur-ink/50 uppercase tracking-widest">Design</th>
                  <th className="py-4 text-left text-xs font-bold text-fleur-ink/50 uppercase tracking-widest">Frames</th>
                  <th className="py-4 text-left text-xs font-bold text-fleur-ink/50 uppercase tracking-widest">Status</th>
                  <th className="py-4 text-right text-xs font-bold text-fleur-ink/50 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} className="h-24 text-center text-fleur-ink/40">Loading designs…</td></tr>
                ) : templates.length === 0 ? (
                  <tr><td colSpan={4} className="h-24 text-center text-fleur-ink/40">No templates uploaded yet.</td></tr>
                ) : (
                  templates.map((t) => (
                    <tr key={t.id} className="border-b border-fleur-blush/30 hover:bg-fleur-blush/100 transition-all duration-200 group">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-fleur-blush flex items-center justify-center text-fleur-rose font-bold text-xs shadow-sm">
                            {t.frames?.length || 0}
                          </div>
                          <div>
                            {editingNameId === t.id ? (
                              <div className="flex gap-2">
                                <input
                                  value={editNameValue}
                                  onChange={(e) => setEditNameValue(e.target.value)}
                                  autoFocus
                                  className="input text-sm border-fleur-rose/50 focus:border-fleur-rose"
                                />
                                <button
                                  onClick={() => handleRename(t.id)}
                                  className="btn-soft px-3 py-1.5 text-xs text-fleur-rose border-fleur-rose/40 hover:bg-fleur-rose/10 flex items-center gap-1"
                                >
                                  <Edit2 className="w-3 h-3" /> Save
                                </button>
                                <button
                                  onClick={() => { setEditingNameId(null); setEditNameValue(""); }}
                                  className="btn-ghost px-3 py-1.5 text-xs text-fleur-ink/50 hover:bg-fleur-blush/50"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div>
                                <div className="font-medium text-fleur-ink">{t.name}</div>
                                <div className="text-xs text-fleur-ink/40">{t.filename}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-sm font-medium text-fleur-ink/70">{t.frames?.length || 0}</td>
                      <td className="py-4">{statusBadge(t.status)}</td>
                      <td className="py-4 text-right">
                        <button
                          onClick={() => navigate("editor", t.id)}
                          className="btn-ghost text-xs text-fleur-ink/80 flex items-center gap-1.5 hover:bg-fleur-blush/50"
                        >
                          <Eye className="w-3 h-3" /> Edit
                        </button>
                        {t.status === "published" ? (
                          <button onClick={() => handlePublish(t.id)} className="mt-2 btn-ghost text-xs text-fleur-ink/80 hover:bg-fleur-blush/50">Unpublish</button>
                        ) : (
                          <button onClick={() => handlePublish(t.id)} className="mt-2 btn-soft text-xs text-fleur-rose border-fleur-rose/40 hover:bg-fleur-rose/10">Publish</button>
                        )}
                        <button onClick={() => handleDelete(t.id, t.filename)} className="mt-2 btn-ghost text-xs text-fleur-rose/70 hover:bg-fleur-rose/10">
                          <Trash2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => { setEditNameValue(t.name); setEditingNameId(t.id); }}
                          className="mt-2 btn-ghost text-xs text-fleur-ink/80 hover:bg-fleur-blush/50 flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3" /> Rename
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <p className="mt-6 text-xs text-fleur-ink/40 text-center">
            Published designs appear on the customer photo strip selection page.
          </p>
        </div>
      </div>
    </div>
  );
}
