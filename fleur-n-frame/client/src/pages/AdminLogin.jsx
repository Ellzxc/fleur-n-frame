import { useCallback, useState } from "react";
import { ArrowLeft, Lock, Cog, AlertCircle } from "lucide-react";

const ADMIN_PASSWORD = "fleurnframe123"; // Change this to your desired password

export default function AdminLogin({ navigate }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [unlocking, setUnlocking] = useState(false);

  const handleUnlock = useCallback(async () => {
    if (!password) {
      setError("Please enter the admin password.");
      return;
    }
    setUnlocking(true);
    try {
      if (password === ADMIN_PASSWORD) {
        sessionStorage.setItem("fleur_admin", "1");
        navigate("admin");
      } else {
        setError("Incorrect admin password.");
      }
    } finally {
      setUnlocking(false);
    }
  }, [password, navigate]);

  return (
    <div className="min-h-screen bg-fleur-cream flex items-center justify-center px-6">
      <div className="card p-10 w-full max-w-md animate-fade-in">
        <div className="flex items-center gap-2 mb-8">
          <Lock className="w-6 h-6 text-fleur-rose" />
          <h2 className="font-display font-bold text-xl text-fleur-ink">Admin Access</h2>
        </div>

        <p className="text-fleur-ink/60 text-sm mb-8">
          Only administrators can manage photo strip designs. Enter the password to continue.
        </p>

        <div className="space-y-4">
          <div>
            <label className="label">Admin password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={`input ${error ? "border-fleur-rose focus:ring-fleur-rose/50" : ""}`}
              disabled={unlocking}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-fleur-rose/10 border border-fleur-rose/30 text-fleur-rose text-sm">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}

          <button
            onClick={handleUnlock}
            disabled={unlocking}
            className="btn-primary w-full py-4 flex items-center justify-center gap-2 shadow-[0_10px_25px_rgba(212,165,165,0.35)] hover:shadow-[0_15px_35px_rgba(212,165,165,0.45)] disabled:opacity-60"
          >
            <Lock className="w-4 h-4" /> {unlocking ? "Unlocking…" : "Unlock Admin Panel"}
          </button>
        </div>

        <button onClick={() => navigate("welcome")} className="mt-6 btn-ghost text-sm text-fleur-ink/60 flex items-center justify-center gap-2">
          <ArrowLeft className="w-3 h-3" /> Back to customer booth
        </button>
      </div>
    </div>
  );
}
