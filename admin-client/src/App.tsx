import { useCallback, useEffect, useState } from "react";
import { LogOut, ShieldCheck } from "lucide-react";
import LoginForm from "./components/LoginForm";
import PendingTicketsTable from "./components/PendingTicketsTable";
import PaidTicketsTable from "./components/PaidTicketsTable";
import {
  markTicketPaid,
  declineTicket,
  fetchPaidTickets,
  fetchPendingTickets,
  type PaidTicket,
  type PendingTicket,
} from "./lib/api";
import { clsx } from "clsx";

type BannerState = {
  type: "success" | "error";
  message: string;
};

const TOKEN_KEY = "admin_token";

const App = () => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [banner, setBanner] = useState<BannerState | null>(null);
  const [activeView, setActiveView] = useState<"pending" | "paid">("pending");
  const [pendingTickets, setPendingTickets] = useState<PendingTicket[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [decliningId, setDecliningId] = useState<string | null>(null);
  const [paidTickets, setPaidTickets] = useState<PaidTicket[]>([]);
  const [paidLoading, setPaidLoading] = useState(false);
  const [lastPaidSearch, setLastPaidSearch] = useState("");

  const showBanner = useCallback((state: BannerState) => {
    setBanner(state);
    const timer = setTimeout(() => setBanner(null), 4000);
    return () => clearTimeout(timer);
  }, []);

  const loadPending = useCallback(async () => {
    if (!token) return;
    setPendingLoading(true);
    try {
      const tickets = await fetchPendingTickets();
      setPendingTickets(tickets);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to load pending tickets.";
      showBanner({ type: "error", message });
    } finally {
      setPendingLoading(false);
    }
  }, [token, showBanner]);

  const loadPaid = useCallback(
    async (term?: string) => {
      if (!token) return;
      setPaidLoading(true);
      try {
        const tickets = await fetchPaidTickets(term);
        setPaidTickets(tickets);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to load paid tickets.";
        showBanner({ type: "error", message });
      } finally {
        setPaidLoading(false);
      }
    },
    [token, showBanner],
  );

  useEffect(() => {
    if (token) {
      loadPending();
    } else {
      setPendingTickets([]);
      setPaidTickets([]);
    }
  }, [token, loadPending]);

  useEffect(() => {
    if (token && activeView === "paid") {
      loadPaid(lastPaidSearch);
    }
  }, [token, activeView, loadPaid, lastPaidSearch]);

  const handleLoginSuccess = (newToken: string) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    showBanner({ type: "success", message: "Signed in successfully." });
  };

  const handleLoginError = (message: string) => {
    showBanner({ type: "error", message });
  };

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setBanner({ type: "success", message: "Signed out." });
  };

  const handleConfirm = async (ticketId: string) => {
    const confirmed = window.confirm(
      "Mark this ticket as paid and trigger the QR email?",
    );
    if (!confirmed) return;

    setConfirmingId(ticketId);
    try {
      await markTicketPaid(ticketId);
      showBanner({ type: "success", message: "Ticket marked paid and emails sent." });
      setPendingTickets((current) =>
        current.filter((ticket) => ticket.ticketId !== ticketId),
      );
      if (activeView === "paid") {
        await loadPaid(lastPaidSearch);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to confirm ticket.";
      showBanner({ type: "error", message });
    } finally {
      setConfirmingId(null);
    }
  };

  const handleDecline = async (ticketId: string) => {
    const confirmed = window.confirm(
      "Decline this ticket and notify the attendee?",
    );
    if (!confirmed) return;

    setDecliningId(ticketId);
    try {
      await declineTicket(ticketId);
      showBanner({ type: "success", message: "Ticket declined." });
      setPendingTickets((current) =>
        current.filter((ticket) => ticket.ticketId !== ticketId),
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to decline ticket.";
      showBanner({ type: "error", message });
    } finally {
      setDecliningId(null);
    }
  };

  const handlePaidSearch = async (term: string) => {
    setLastPaidSearch(term);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3 text-lg font-semibold">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/20 text-brand">
              <ShieldCheck className="h-5 w-5" />
            </span>
            Midnight Madness Admin
          </div>
          {token && (
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-brand hover:text-brand"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          )}
        </div>
      </header>

      {banner && (
        <div
          className={clsx(
            "border-b border-slate-800 py-3",
            banner.type === "success" ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300",
          )}
        >
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 text-sm">
            <span>{banner.message}</span>
            <button
              type="button"
              onClick={() => setBanner(null)}
              className="text-xs uppercase tracking-wide text-slate-200/80 transition hover:text-slate-50"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
        {!token ? (
          <LoginForm onSuccess={handleLoginSuccess} onError={handleLoginError} />
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="inline-flex rounded-2xl border border-slate-800 bg-slate-900/60 p-1">
                <button
                  type="button"
                  onClick={() => setActiveView("pending")}
                  className={clsx(
                    "rounded-2xl px-4 py-2 text-sm font-semibold transition",
                    activeView === "pending"
                      ? "bg-brand text-slate-950 shadow-soft"
                      : "text-slate-400 hover:text-slate-100",
                  )}
                >
                  Pending Payments
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView("paid")}
                  className={clsx(
                    "rounded-2xl px-4 py-2 text-sm font-semibold transition",
                    activeView === "paid"
                      ? "bg-brand text-slate-950 shadow-soft"
                      : "text-slate-400 hover:text-slate-100",
                  )}
                >
                  Paid Tickets
                </button>
              </div>
              {activeView === "pending" && (
                <p className="text-xs text-slate-400">
                  {pendingTickets.length} ticket
                  {pendingTickets.length === 1 ? "" : "s"} awaiting review.
                </p>
              )}
            </div>

            {activeView === "pending" ? (
              <PendingTicketsTable
                tickets={pendingTickets}
                isLoading={pendingLoading}
                confirmingId={confirmingId}
                decliningId={decliningId}
                onConfirm={handleConfirm}
                onDecline={handleDecline}
                onRefresh={loadPending}
              />
            ) : (
              <PaidTicketsTable
                tickets={paidTickets}
                isLoading={paidLoading}
                onSearch={handlePaidSearch}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default App;
