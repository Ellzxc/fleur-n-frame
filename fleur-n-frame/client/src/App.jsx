import { useState } from "react";
import WelcomePage from "@/pages/WelcomePage";
import PhotoboothPage from "@/pages/PhotoboothPage";
import StripSelectionPage from "@/pages/StripSelectionPage";
import CustomerPreviewPage from "@/pages/CustomerPreviewPage";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminLogin from "@/pages/AdminLogin";
import TemplateEditorPage from "@/pages/TemplateEditorPage";
import { PhotoProvider } from "@/context/PhotoContext";
import { usePhotos } from "@/context/PhotoContext";

function AppRoutes() {
  const { resetPhotos } = usePhotos();
  const [view, setView] = useState("welcome");
  const [isAdmin, setIsAdmin] = useState(() => sessionStorage.getItem("fleur_admin") === "1");
  const [editorTemplateId, setEditorTemplateId] = useState(null);
  const [customerSessionId, setCustomerSessionId] = useState(null);
  const [stripSessionId, setStripSessionId] = useState(null);
  const [toast, setToast] = useState(null);

  const navigate = async (to, id) => {
    if (to === "welcome") {
      resetPhotos();
      setStripSessionId(null);
      setCustomerSessionId(null);
      const sid = sessionStorage.getItem("fleur_last_session");
      if (sid) {
        try {
          await api.deletePhotoSession(sid);
          sessionStorage.removeItem("fleur_last_session");
          setToast({ message: "Ready to start new session", type: "success" });
          setTimeout(() => setToast(null), 4000);
        } catch (err) {
          setToast({ message: "Failed to clear previous session", type: "error" });
          setTimeout(() => setToast(null), 4000);
        }
      }
      setView("welcome");
      return;
    }
    if (to === "admin") {
      const admin = sessionStorage.getItem("fleur_admin") === "1";
      if (!admin) { setView("admin-login"); return; }
      setIsAdmin(true);
      setView("admin");
      return;
    }
    if (to === "editor") {
      const admin = sessionStorage.getItem("fleur_admin") === "1";
      if (!admin) { setView("admin-login"); return; }
      setIsAdmin(true);
      setEditorTemplateId(id);
      setView("editor");
      return;
    }
    if (to === "customer") setCustomerSessionId(id);
    if (to === "strips") setStripSessionId(id);
    setView(to);
  };

  const requireAdmin = (to) => {
    if (!isAdmin) {
      setView("admin-login");
      return false;
    }
    return true;
  };

  return (
    <>
      {view === "welcome" && <WelcomePage navigate={navigate} />}
      {view === "photobooth" && <PhotoboothPage navigate={navigate} />}
      {view === "strips" && <StripSelectionPage navigate={navigate} sessionId={stripSessionId} />}
      {view === "customer" && <CustomerPreviewPage navigate={navigate} sessionId={customerSessionId} />}
      {view === "admin-login" && <AdminLogin navigate={navigate} />}
      {view === "admin" && (
        <>
          {isAdmin ? <AdminDashboard navigate={navigate} /> : <AdminLogin navigate={navigate} />}
        </>
      )}
      {view === "editor" && (
        <>
          {isAdmin ? (
            <TemplateEditorPage navigate={navigate} templateId={editorTemplateId} />
          ) : (
            <AdminLogin navigate={navigate} />
          )}
        </>
      )}
      {view === "admin-logout" && (
        <div className="min-h-screen bg-fleur-cream flex items-center justify-center">
          <div className="text-center animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-fleur-rose flex items-center justify-center text-white font-bold text-lg mb-4">
              ✓
            </div>
            <h2 className="font-display font-bold text-xl text-fleur-ink mb-2">Logged out</h2>
            <p className="text-fleur-ink/50 text-sm mb-6">Admin session ended.</p>
            <button onClick={() => { sessionStorage.removeItem("fleur_admin"); setIsAdmin(false); setView("welcome"); }} className="btn-primary">
              Back to home
            </button>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-4 left-4 z-50 animate-slide-up">
          <div className={`px-6 py-4 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.2)] border text-sm font-medium flex items-center gap-3 ${
            toast.type === "error"
              ? "bg-fleur-rose/90 border-fleur-rose/50 text-white"
              : "bg-fleur-rose border-fleur-rose/30 text-fleur-ink"
          }`}>
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </>
  );
}

export default function App() {
  return (
    <PhotoProvider>
      <AppRoutes />
    </PhotoProvider>
  );
}
