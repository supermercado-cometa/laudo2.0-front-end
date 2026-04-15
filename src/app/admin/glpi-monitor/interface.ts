interface GlpiMetrics {
  initSessions: number;
  sessionCacheHits: number;
  sessionCacheMisses: number;
  pendingInitWaits: number;
  sessionCacheSize: number;
  retries401: {
    followup: number;
    followupHeader: number;
    createTicket: number;
    linkTickets: number;
    setTicketRequester: number;
    setTicketAssigned: number;
  };
  operations: {
    createFollowup: number;
    createFollowupWithHeader: number;
    createTicket: number;
    linkTickets: number;
    setRequester: number;
    setAssigned: number;
  };
  db: {
    totalLaudos: number;
    totalLojas: number;
    totalSetores: number;
  };
}
