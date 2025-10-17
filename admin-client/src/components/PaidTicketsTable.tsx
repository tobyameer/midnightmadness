import { Loader2, Search } from "lucide-react";
import type { PaidTicket } from "../lib/api";
import { clsx } from "clsx";
import { useState } from "react";

type PaidTicketsTableProps = {
  tickets: PaidTicket[];
  isLoading: boolean;
  onSearch: (term: string) => Promise<void>;
};

const formatDate = (value?: string) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "--";
  }
  return date.toLocaleString();
};

const PaidTicketsTable = ({ tickets, isLoading, onSearch }: PaidTicketsTableProps) => {
  const [term, setTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSearching(true);
    try {
      await onSearch(term.trim());
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/60 shadow-soft">
      <div className="flex flex-col gap-4 border-b border-slate-800 px-6 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Paid Tickets</h2>
          <p className="text-sm text-slate-400">
            Search by ticket ID, email, or attendee name.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="flex w-full gap-2 md:w-auto">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Search tickets..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950/60 py-2 pl-9 pr-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
          </div>
          <button
            type="submit"
            className={clsx(
              "rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-brand/90",
              (isSearching || isLoading) && "opacity-70",
            )}
            disabled={isSearching}
          >
            {isSearching ? "Searching..." : "Search"}
          </button>
        </form>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-brand" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="px-6 py-16 text-center text-sm text-slate-400">
          No paid tickets match your search yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800 text-left text-sm">
            <thead className="bg-slate-900/80 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-6 py-3">Ticket ID</th>
                <th className="px-6 py-3">Names</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Package</th>
                <th className="px-6 py-3">Paid At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {tickets.map((ticket) => {
                const names =
                  ticket.attendees && ticket.attendees.length
                    ? ticket.attendees
                        .map((attendee) => attendee.fullName || "Guest")
                        .filter(Boolean)
                        .join(" & ")
                    : ticket.fullName || "Unnamed Ticket";
                const email = ticket.contactEmail || ticket.email || "";
                const genders = ticket.attendees
                  ?.map((attendee) => attendee.gender?.toUpperCase())
                  .filter(Boolean)
                  .join(" • ");
                return (
                  <tr key={ticket._id || ticket.ticketId || names} className="hover:bg-slate-900/50">
                    <td className="px-6 py-4 font-mono text-xs uppercase text-slate-300">
                      {ticket.ticketId || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{names}</div>
                      <div className="text-xs text-slate-400">{genders || "PAID"}</div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-300">
                      {email ? (
                        <a href={`mailto:${email}`} className="text-brand hover:underline">
                          {email}
                        </a>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 capitalize">{ticket.packageType || "-"}</td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {formatDate(ticket.payment?.paidAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PaidTicketsTable;
