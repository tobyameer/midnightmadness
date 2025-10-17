import { useState } from "react";
import { KeyRound } from "lucide-react";
import { login } from "../lib/api";

type LoginFormProps = {
  onSuccess: (token: string) => void;
  onError: (message: string) => void;
};

const LoginForm = ({ onSuccess, onError }: LoginFormProps) => {
  const [apiKey, setApiKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!apiKey.trim()) {
      onError("Enter the ADMIN_API_KEY to continue.");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await login(apiKey.trim());
      onSuccess(token);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Login failed. Check the API key.";
      onError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-soft backdrop-blur">
      <div className="mb-6 flex items-center gap-3">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/20 text-brand">
          <KeyRound className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold">Admin Login</h1>
          <p className="text-sm text-slate-400">
            Enter the secret ADMIN_API_KEY to review manual payments.
          </p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="apiKey" className="text-sm font-medium text-slate-200">
            ADMIN_API_KEY
          </label>
          <input
            id="apiKey"
            type="password"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder="••••••••••••"
            className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40"
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
};

export default LoginForm;
