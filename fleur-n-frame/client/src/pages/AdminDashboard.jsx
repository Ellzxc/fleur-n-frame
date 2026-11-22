import { useCallback, useEffect, useRef, useState } from "react";
import { Upload, Image, Trash2, Eye, RotateCw, RefreshCw, Cog, ChevronLeft, LogOut, Edit2, ChevronRight, SlidersHorizontal, Timer, Mic, Volume2, VolumeX } from "lucide-react";
import { api } from "@/lib/api";
import TemplateEditorPage from "@/pages/TemplateEditorPage";

const STORAGE_KEYS = {
  countdown: "fleur_countdown_timer",
  shutter: "fleur_shutter_sound",
  countdownTick: "fleur_countdown_tick",
};

const COUNTDOWN_OPTIONS = ["3", "5", "7"];
const SHUTTER_OPTIONS = ["classic", "loud", "studio", "silent"];
const SHUTTER_LABELS = {
  classic: "Classic click",
  loud: "Loud snap",
  studio: "Studio shutter",
  silent: "Silent",
};

export default function AdminDashboard({ navigate }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState("");
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState(null);
  const [editingNameId, setEditingNameId] = useState(null);
  const [editNameValue, setEditNameValue] = useState("");
  const [activeTab, setActiveTab] = useState("editor");
  const [editorTemplateId, setEditorTemplateId] = useState(null);
  const [countdownTimer, setCountdownTimer] = useState(localStorage.getItem(STORAGE_KEYS.countdown) || "3");
  const [shutterSound, setShutterSound] = useState(localStorage.getItem(STORAGE_KEYS.shutter) || "classic");
  const [countdownTick, setCountdownTick] = useState(localStorage.getItem(STORAGE_KEYS.countdownTick) !== "false");
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

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.countdown, countdownTimer); } catch (e) {}
  }, [countdownTimer]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.shutter, shutterSound); } catch (e) {}
  }, [shutterSound]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.countdownTick, String(countdownTick)); } catch (e) {}
  }, [countdownTick]);

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

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-1 mb-10 border-b border-fleur-blush/40">
          <button
            onClick={() => setActiveTab("editor")}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 ${
              activeTab === "editor"
                ? "border-fleur-rose text-fleur-rose bg-fleur-rose/10"
                : "text-fleur-ink/50 hover:text-fleur-ink/80 hover:bg-fleur-blush/50"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" /> Template Editor
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 ${
              activeTab === "settings"
                ? "border-fleur-rose text-fleur-rose bg-fleur-rose/10"
                : "text-fleur-ink/50 hover:text-fleur-ink/80 hover:bg-fleur-blush/50"
            }`}
          >
            <Cog className="w-4 h-4" /> Settings
          </button>
        </div>

        {activeTab === "editor" ? (
          <TemplateEditorTab
            templates={templates}
            loading={loading}
            setTemplates={setTemplates}
            editorTemplateId={editorTemplateId}
            setEditorTemplateId={setEditorTemplateId}
            handleUpload={handleUpload}
            handlePublish={handlePublish}
            handleDelete={handleDelete}
            handleRename={handleRename}
            editingNameId={editingNameId}
            editNameValue={editNameValue}
            setEditingNameId={setEditingNameId}
            setEditNameValue={setEditNameValue}
            file={file}
            setFile={setFile}
            name={name}
            setName={setName}
            uploading={uploading}
            message={message}
            setMessage={setMessage}
            fileInputRef={fileInputRef}
            handleFile={handleFile}
            load={load}
          />
        ) : (
          <SettingsTab
            countdownTimer={countdownTimer}
            setCountdownTimer={setCountdownTimer}
            shutterSound={shutterSound}
            setShutterSound={setShutterSound}
            countdownTick={countdownTick}
            setCountdownTick={setCountdownTick}
          />
        )}
      </div>
    </div>
  );
}

function TemplateEditorTab({
  templates,
  loading,
  setTemplates,
  editorTemplateId,
  setEditorTemplateId,
  handleUpload,
  handlePublish,
  handleDelete,
  handleRename,
  editingNameId,
  editNameValue,
  setEditingNameId,
  setEditNameValue,
  file,
  setFile,
  name,
  setName,
  uploading,
  message,
  setMessage,
  fileInputRef,
  handleFile,
  load,
}) {
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
    <div className="space-y-10">
      {/* Upload card */}
      <div className="card p-8 animate-slide-up">
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
        <div className="mb-6 p-5 rounded-xl bg-fleur-rose/10 border border-fleur-rose/30 text-fleur-rose text-sm flex items-center gap-2 animate-slide-up">
          <RotateCw className="w-4 h-4" /> {message}
        </div>
      )}

      {/* Template selector + inline editor */}
      <div className="card p-8 animate-slide-up delay-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-semibold text-fleur-ink">Edit template design</h3>
            <p className="text-fleur-ink/50 text-sm">Select a template to position photo frames.</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs font-bold text-fleur-ink/50 uppercase tracking-widest">Template</label>
            <select
              value={editorTemplateId || ""}
              onChange={(e) => setEditorTemplateId(e.target.value || null)}
              className="input text-sm border-fleur-rose/50 focus:border-fleur-rose"
            >
              <option value="">-- Select a template --</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.status})
                </option>
              ))}
            </select>
          </div>
        </div>

        {editorTemplateId ? (
          <div className="mt-6">
            <TemplateEditorPage
              navigate={(to, id) => {
                if (to === "admin") setActiveTab("editor");
                else if (to === "editor") setEditorTemplateId(id);
              }}
              templateId={editorTemplateId}
            />
          </div>
        ) : (
          <div className="h-96 flex items-center justify-center rounded-xl bg-fleur-blush/50 border border-fleur-blush/30 text-fleur-ink/40">
            Select a template above to begin editing frames.
          </div>
        )}
      </div>

      {/* Templates list */}
      <div className="overflow-hidden">
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
                        onClick={() => setEditorTemplateId(t.id)}
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
  );
}

function SettingsTab({ countdownTimer, setCountdownTimer, shutterSound, setShutterSound, countdownTick, setCountdownTick }) {
  return (
    <div className="card p-10 animate-slide-up">
      <div className="flex items-center gap-2 mb-8">
        <Cog className="w-5 h-5 text-fleur-rose" />
        <h3 className="font-semibold text-fleur-ink">Kiosk settings</h3>
      </div>

      <div className="space-y-8">
        {/* Countdown timer */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="font-medium text-fleur-ink">Countdown timer</h4>
              <p className="text-xs text-fleur-ink/50">Seconds before each photo is captured.</p>
            </div>
            <span className="text-xs font-bold text-fleur-rose">{countdownTimer}s</span>
          </div>
          <div className="flex gap-2">
            {COUNTDOWN_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => setCountdownTimer(opt)}
                className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                  countdownTimer === opt
                    ? "bg-fleur-rose border-fleur-rose text-white shadow-[0_4px_12px_rgba(212,165,165,0.35)]"
                    : "bg-white border-fleur-blush/60 text-fleur-ink/60 hover:bg-fleur-blush/50"
                }`}
              >
                {opt}s
              </button>
            ))}
          </div>
        </div>

        {/* Shutter sound */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="font-medium text-fleur-ink">Shutter sound</h4>
              <p className="text-xs text-fleur-ink/50">Sound played when each photo is captured.</p>
            </div>
          </div>
          <div className="space-y-2">
            {SHUTTER_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => setShutterSound(opt)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                  shutterSound === opt
                    ? "bg-fleur-rose/10 border-fleur-rose text-fleur-rose"
                    : "bg-white border-fleur-blush/60 text-fleur-ink/60 hover:bg-fleur-blush/50"
                }`}
              >
                <span>{SHUTTER_LABELS[opt]}</span>
                <span className="text-xs text-fleur-ink/30">{shutterSound === opt ? "Active" : ""}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Countdown tick */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="font-medium text-fleur-ink">Countdown tick audio</h4>
              <p className="text-xs text-fleur-ink/50">Play a short beep each second during countdown.</p>
            </div>
            <button
              onClick={() => setCountdownTick(!countdownTick)}
              className={`relative inline-flex w-10 h-5 rounded-full transition-colors ${
                countdownTick ? "bg-fleur-rose" : "bg-fleur-blush/40"
              }`}
            >
              <span className={`block w-3 h-3 rounded-full bg-white transition-transform ${
                countdownTick ? "translate-x-5" : "translate-x-1"
              }`} />
            </button>
          </div>
        </div>
      </div>

      <p className="mt-6 text-xs text-fleur-ink/40 text-center">
        Settings are saved locally on this kiosk device and apply to the customer photo booth.
      </p>
    </div>
  );
}
