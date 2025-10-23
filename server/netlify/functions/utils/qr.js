function buildTicketQrPayload(ticket) {
  return {
    v: 1,
    ticketId: ticket.ticketId,
    packageType: ticket.packageType,
    attendees: (ticket.attendees || []).map((a) => ({
      fullName: a.fullName,
      email: a.email,
      phone: a.phone,
      nationalId: a.nationalId,
      gender: a.gender,
    })),
    status: ticket.status,
  };
}
module.exports = { buildTicketQrPayload };
