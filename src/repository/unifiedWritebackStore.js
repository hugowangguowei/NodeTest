'use strict';

const EMPTY_DOMAINS = () => ({
  master_data: {},
  knowledge_semantic: {},
  process_runtime: {},
  projection_state: {},
  audit_trace: {}
});

const store = {
  domains: EMPTY_DOMAINS(),
  logs: []
};

function resetWritebackStore() {
  store.domains = EMPTY_DOMAINS();
  store.logs = [];
}

function nextLogId() {
  return `writeback-log-${store.logs.length + 1}`;
}

function applyWriteback(requestPayload) {
  const domainBucket = store.domains[requestPayload.target_domain];

  if (!domainBucket) {
    throw new Error(`unknown target_domain: ${requestPayload.target_domain}`);
  }

  const previousSnapshot = domainBucket[requestPayload.target_ref] ?? null;
  let nextSnapshot = null;

  if (requestPayload.mutation_type === 'replace') {
    nextSnapshot = requestPayload.payload;
  } else if (requestPayload.mutation_type === 'append') {
    const base = Array.isArray(previousSnapshot) ? previousSnapshot : [];
    nextSnapshot = [...base, requestPayload.payload];
  } else {
    const base = previousSnapshot && typeof previousSnapshot === 'object' ? previousSnapshot : {};
    nextSnapshot = { ...base, ...requestPayload.payload };
  }

  domainBucket[requestPayload.target_ref] = nextSnapshot;

  const log = {
    operation_log_id: nextLogId(),
    operation_id: requestPayload.operation_id,
    source_type: requestPayload.source_type,
    target_domain: requestPayload.target_domain,
    target_ref: requestPayload.target_ref,
    mutation_type: requestPayload.mutation_type,
    trace: requestPayload.trace,
    previous_snapshot: previousSnapshot,
    next_snapshot: nextSnapshot,
    requested_at: requestPayload.requested_at,
    applied_at: new Date().toISOString(),
    status: 'applied'
  };

  store.logs.push(log);

  return {
    status: 'applied',
    operation_log_id: log.operation_log_id,
    target_domain: log.target_domain,
    target_ref: log.target_ref,
    next_snapshot: log.next_snapshot,
    log_count: store.logs.length
  };
}

function getWritebackLogs(limit = 20) {
  if (!Number.isFinite(limit) || limit <= 0) {
    return [];
  }

  return store.logs.slice(-limit);
}

function getWritebackSnapshot() {
  return {
    domains: store.domains,
    logs_count: store.logs.length
  };
}

module.exports = {
  resetWritebackStore,
  applyWriteback,
  getWritebackLogs,
  getWritebackSnapshot
};
