import { Loader2, RefreshCcw, Check, XCircle } from "lucide-react";
import type { PendingTicket } from "../lib/api";
import { clsx } from "clsx";

type PendingTicketsTableProps = {
  tickets: PendingTicket[];
  isLoading: boolean;
  confirmingId: string | null;
  decliningId: string | null;
  onConfirm: (ticketId: string) => void;
  onDecline: (ticketId: string) => void;
  onRefresh: () => void;
};

const formatDate = (value?: string) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "--";
  }
  return date.toLocaleString();
};

const PendingTicketsTable = ({
  tickets,
  isLoading,
  confirmingId,
  decliningId,
  onConfirm,
  onDecline,
  onRefresh,
}: PendingTicketsTableProps) => {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/80 shadow-soft">
      <div className="flex items-center justify-between border-b border-slate-800 px-8 py-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-100">Pending Manual Payments</h2>
          <p className="text-base text-slate-400">
            Tickets awaiting verification before we send the QR codes.
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-3 rounded-2xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-brand hover:text-brand"
        >
          <RefreshCcw className="h-5 w-5" />
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="px-8 py-20 text-center text-base text-slate-400">
          No tickets are waiting for manual payment confirmation.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800 text-left text-base">
            <thead className="bg-slate-900 text-sm uppercase tracking-wide text-slate-300">
              <tr>
                <th className="px-8 py-4">Ticket ID</th>
                <th className="px-8 py-4">Attendees</th>
                <th className="px-8 py-4">Package</th>
                <th className="px-8 py-4">Note</th>
                <th className="px-8 py-4">Email</th>
                <th className="px-8 py-4">Submitted</th>
                <th className="px-8 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-100">
              {tickets.map((ticket) => {
                const attendeeNames =
                  ticket.attendees && ticket.attendees.length
                    ? ticket.attendees
                        .map((attendee) => attendee.fullName || "Guest")
                        .filter(Boolean)
                        .join(" & ")
                    : ticket.fullName || "Unnamed Ticket";
                const attendeeContactDetails = (ticket.attendees || []).map((attendee, idx) => ({
                  key: `${ticket.ticketId || attendeeNames}-${idx}`,
                  email: attendee.email,
                  phone: attendee.phone,
                }));
                const fallbackEmail = ticket.contactEmail || ticket.email || "";
                const statusLabel = (ticket.status || "pending").toLowerCase();
                const genders = ticket.attendees
                  ?.map((attendee) => attendee.gender?.toUpperCase())
                  .filter(Boolean)
                  .join(" • ");
                return (
                  <tr
                    key={ticket._id || ticket.ticketId || attendeeNames}
                    className="hover:bg-slate-900/60 transition-colors"
                  >
                    <td className="px-8 py-5 font-mono text-sm uppercase text-slate-300">
                      {ticket.ticketId || "—"}
                    </td>
                    <td className="px-8 py-5">
                      <div className="text-lg font-semibold">{attendeeNames}</div>
                      <div className="text-xs text-slate-400">
                        {genders || statusLabel.toUpperCase()}
                      </div>
                    </td>
                    <td className="px-8 py-5 capitalize text-base text-slate-200">
                      {ticket.packageType}
                    </td>
                    <td className="px-8 py-5 text-sm text-slate-300">
                      {ticket.paymentNote || <span className="text-slate-500">-</span>}
                    </td>
                    <td className="px-8 py-5 text-sm text-slate-300">
                      {attendeeContactDetails.length ? (
                        <div className="space-y-2 text-left">
                          {attendeeContactDetails.map(({ key, email, phone }) => (
                            <div key={key} className="flex flex-col">
                              {email ? (
                                <a
                                  href={`mailto:${email}`}
                                  className="font-medium text-brand hover:underline"
                                >
                                  {email}
                                </a>
                              ) : (
                                <span className="text-slate-500">-</span>
                              )}
                              {phone && (
                                <span className="text-xs text-slate-400">{phone}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : fallbackEmail ? (
                        <a
                          href={`mailto:${fallbackEmail}`}
                          className="text-brand hover:underline"
                        >
                          {fallbackEmail}
                        </a>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="px-8 py-5 text-sm text-slate-400">
                      {formatDate(ticket.createdAt)}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex flex-col items-end gap-3">
                        <button
                          type="button"
                          onClick={() => ticket.ticketId && onConfirm(ticket.ticketId)}
                          disabled={
                            !ticket.ticketId ||
                            (Boolean(confirmingId) && confirmingId !== ticket.ticketId)
                          }
                          className={clsx(
                            "inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-60",
                            confirmingId === ticket.ticketId && "cursor-wait",
                          )}
                        >
                          {confirmingId === ticket.ticketId ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Marking...
                            </>
                          ) : (
                            <>
                              <Check className="h-4 w-4" />
                              Mark as Paid
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => ticket.ticketId && onDecline(ticket.ticketId)}
                          disabled={
                            !ticket.ticketId ||
                            (Boolean(decliningId) && decliningId !== ticket.ticketId)
                          }
                          className={clsx(
                            "inline-flex items-center gap-2 rounded-2xl bg-rose-500 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:bg-rose-400 disabled:opacity-60",
                            decliningId === ticket.ticketId && "cursor-wait",
                          )}
                        >
                          {decliningId === ticket.ticketId ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Declining...
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4" />
                              Decline
                            </>
                          )}
                        </button>
                      </div>
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

export default PendingTicketsTable;
