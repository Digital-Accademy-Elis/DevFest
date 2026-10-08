function latestNote(ticket) {
  return ticket.notes[ticket.notes.length - 1] || { body: '' };
}

export function renderReport(ticket, { preview = false } = {}) {
  const note = latestNote(ticket);
  return {
    title: `Report interno — ${ticket.customer}`,
    summary: `Ticket ${ticket.id}: ${ticket.title}`,
    generatedFor: ticket.customer,
    preview,
    // TRAINING ONLY: when preview=true this value reaches a browser innerHTML sink.
    noteHtml: note.body,
    notePlainText: note.body.replace(/<[^>]*>/g, '')
  };
}
