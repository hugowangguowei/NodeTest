'use strict';

const repositorySample = require('../../DOC/CODEX_DOC/04_研发文档/01_标准规范/2026-04-03-P2.1-知识仓库对象模型样例数据.json');

function asBoolean(value, defaultValue = true) {
  if (value === undefined || value === null) {
    return defaultValue;
  }

  const normalized = String(value).trim().toLowerCase();
  if (normalized === 'true') {
    return true;
  }

  if (normalized === 'false') {
    return false;
  }

  return defaultValue;
}

function buildKnowledgeGraphProjection(options = {}) {
  const includeAudit = asBoolean(options.include_audit, true);
  const byStateDomain = typeof options.state_domain_ref === 'string' ? options.state_domain_ref : null;
  const byNodeType = typeof options.node_type === 'string' ? options.node_type : null;

  const repository = repositorySample.knowledge_repository;
  const nodeMap = new Map();
  const edgeMap = new Map();

  function addNode(node) {
    if (!node || typeof node.id !== 'string' || node.id.length === 0) {
      return;
    }

    nodeMap.set(node.id, node);
  }

  function ensureReferenceNode(refId) {
    if (nodeMap.has(refId)) {
      return;
    }

    addNode({
      id: refId,
      node_type: 'reference',
      label: refId,
      state_domain_ref: null,
      category: 'reference',
      raw: {
        id: refId
      }
    });
  }

  function addEdge(edge) {
    if (!edge || !edge.id || !edge.source || !edge.target) {
      return;
    }

    ensureReferenceNode(edge.source);
    ensureReferenceNode(edge.target);
    edgeMap.set(edge.id, edge);
  }

  function addCatalogObjects(items, category) {
    items.forEach((item) => {
      addNode({
        id: item.id,
        node_type: category,
        label: item.name || item.id,
        state_domain_ref: item.state_domain_ref || null,
        category,
        raw: item
      });

      addEdge({
        id: `edge-repo-object-${item.id}`,
        source: repository.repository_id,
        target: item.id,
        edge_type: 'contains_object',
        category: 'structure',
        raw: {
          repository_ref: repository.repository_id
        }
      });

      if (item.state_domain_ref) {
        addEdge({
          id: `edge-domain-object-${item.state_domain_ref}-${item.id}`,
          source: item.state_domain_ref,
          target: item.id,
          edge_type: 'contains',
          category: 'domain',
          raw: {
            state_domain_ref: item.state_domain_ref
          }
        });
      }
    });
  }

  addNode({
    id: repository.repository_id,
    node_type: 'knowledge_repository',
    label: repository.repository_name || repository.repository_id,
    state_domain_ref: null,
    category: 'root',
    raw: repository
  });

  const stateDomains = repository.domain_catalog.state_domains || [];
  stateDomains.forEach((domain) => {
    addNode({
      id: domain.id,
      node_type: 'state_domain',
      label: domain.name || domain.id,
      state_domain_ref: domain.id,
      category: 'domain',
      raw: domain
    });

    addEdge({
      id: `edge-repo-domain-${domain.id}`,
      source: repository.repository_id,
      target: domain.id,
      edge_type: 'contains_domain',
      category: 'structure',
      raw: {
        repository_ref: repository.repository_id
      }
    });
  });

  const semantic = repository.object_catalog.semantic_objects || {};
  const runtime = repository.object_catalog.runtime_objects || {};
  const audit = repository.object_catalog.audit_objects || {};

  addCatalogObjects(semantic.entities || [], 'entity');
  addCatalogObjects(semantic.behaviors || [], 'behavior');
  addCatalogObjects(semantic.events || [], 'event');
  addCatalogObjects(semantic.relationships || [], 'relationship');
  addCatalogObjects(semantic.business_flows || [], 'business_flow');
  addCatalogObjects(semantic.rules || [], 'rule');
  addCatalogObjects(runtime.flow_instances || [], 'flow_instance');
  addCatalogObjects(runtime.node_instances || [], 'node_instance');

  if (includeAudit) {
    addCatalogObjects(audit.operation_logs || [], 'operation_log');
    addCatalogObjects(audit.state_snapshots || [], 'state_snapshot');
  }

  (semantic.behaviors || []).forEach((behavior) => {
    (behavior.actor_refs || []).forEach((actorRef) => {
      addEdge({
        id: `edge-behavior-actor-${behavior.id}-${actorRef}`,
        source: actorRef,
        target: behavior.id,
        edge_type: 'acts',
        category: 'behavior',
        raw: {
          behavior_ref: behavior.id
        }
      });
    });

    (behavior.target_refs || []).forEach((targetRef) => {
      addEdge({
        id: `edge-behavior-target-${behavior.id}-${targetRef}`,
        source: behavior.id,
        target: targetRef,
        edge_type: 'targets',
        category: 'behavior',
        raw: {
          behavior_ref: behavior.id
        }
      });
    });

    (behavior.rule_refs || []).forEach((ruleRef) => {
      addEdge({
        id: `edge-behavior-rule-${behavior.id}-${ruleRef}`,
        source: behavior.id,
        target: ruleRef,
        edge_type: 'constrained_by',
        category: 'behavior',
        raw: {
          behavior_ref: behavior.id
        }
      });
    });
  });

  (semantic.events || []).forEach((eventItem) => {
    if (eventItem.trigger_behavior_ref) {
      addEdge({
        id: `edge-event-trigger-${eventItem.id}-${eventItem.trigger_behavior_ref}`,
        source: eventItem.trigger_behavior_ref,
        target: eventItem.id,
        edge_type: 'triggers',
        category: 'event',
        raw: {
          event_ref: eventItem.id
        }
      });
    }
  });

  (semantic.relationships || []).forEach((relation) => {
    if (relation.from_ref && relation.to_ref) {
      addEdge({
        id: `edge-relation-path-${relation.id}`,
        source: relation.from_ref,
        target: relation.to_ref,
        edge_type: relation.relationship_type || 'relates_to',
        category: 'relationship',
        raw: relation
      });
    }
  });

  (semantic.business_flows || []).forEach((flow) => {
    (flow.node_refs || []).forEach((nodeRef) => {
      addNode({
        id: nodeRef,
        node_type: 'flow_node',
        label: nodeRef,
        state_domain_ref: flow.state_domain_ref || null,
        category: 'flow_node',
        raw: {
          id: nodeRef,
          flow_ref: flow.id
        }
      });

      addEdge({
        id: `edge-flow-node-${flow.id}-${nodeRef}`,
        source: flow.id,
        target: nodeRef,
        edge_type: 'has_node',
        category: 'flow',
        raw: {
          flow_ref: flow.id
        }
      });
    });

    (flow.participant_role_refs || []).forEach((roleRef) => {
      addEdge({
        id: `edge-flow-participant-${flow.id}-${roleRef}`,
        source: roleRef,
        target: flow.id,
        edge_type: 'participates_in',
        category: 'flow',
        raw: {
          flow_ref: flow.id
        }
      });
    });
  });

  (semantic.rules || []).forEach((rule) => {
    (rule.scope_refs || []).forEach((scopeRef) => {
      addEdge({
        id: `edge-rule-scope-${rule.id}-${scopeRef}`,
        source: rule.id,
        target: scopeRef,
        edge_type: 'applies_to',
        category: 'rule',
        raw: {
          rule_ref: rule.id
        }
      });
    });
  });

  (runtime.node_instances || []).forEach((nodeInstance) => {
    if (nodeInstance.flow_instance_ref) {
      addEdge({
        id: `edge-nodeinst-flowinst-${nodeInstance.id}-${nodeInstance.flow_instance_ref}`,
        source: nodeInstance.id,
        target: nodeInstance.flow_instance_ref,
        edge_type: 'instance_of_flow',
        category: 'runtime',
        raw: nodeInstance
      });
    }

    if (nodeInstance.node_ref) {
      addEdge({
        id: `edge-nodeinst-flow-node-${nodeInstance.id}-${nodeInstance.node_ref}`,
        source: nodeInstance.id,
        target: nodeInstance.node_ref,
        edge_type: 'instance_of_node',
        category: 'runtime',
        raw: nodeInstance
      });
    }
  });

  (runtime.flow_instances || []).forEach((flowInstance) => {
    if (flowInstance.flow_ref) {
      addEdge({
        id: `edge-flowinst-flow-${flowInstance.id}-${flowInstance.flow_ref}`,
        source: flowInstance.id,
        target: flowInstance.flow_ref,
        edge_type: 'instance_of',
        category: 'runtime',
        raw: flowInstance
      });
    }

    if (flowInstance.current_node_ref) {
      addEdge({
        id: `edge-flowinst-current-node-${flowInstance.id}-${flowInstance.current_node_ref}`,
        source: flowInstance.id,
        target: flowInstance.current_node_ref,
        edge_type: 'current_node',
        category: 'runtime',
        raw: flowInstance
      });
    }
  });

  if (includeAudit) {
    (audit.operation_logs || []).forEach((logItem) => {
      if (logItem.operator_ref) {
        addEdge({
          id: `edge-oplog-operator-${logItem.id}-${logItem.operator_ref}`,
          source: logItem.operator_ref,
          target: logItem.id,
          edge_type: 'operates',
          category: 'audit',
          raw: logItem
        });
      }

      if (logItem.target_ref) {
        addEdge({
          id: `edge-oplog-target-${logItem.id}-${logItem.target_ref}`,
          source: logItem.id,
          target: logItem.target_ref,
          edge_type: 'targets',
          category: 'audit',
          raw: logItem
        });
      }
    });

    (audit.state_snapshots || []).forEach((snapshot) => {
      if (snapshot.target_ref) {
        addEdge({
          id: `edge-snapshot-target-${snapshot.id}-${snapshot.target_ref}`,
          source: snapshot.id,
          target: snapshot.target_ref,
          edge_type: 'snapshot_of',
          category: 'audit',
          raw: snapshot
        });
      }
    });
  }

  let nodes = Array.from(nodeMap.values());
  let edges = Array.from(edgeMap.values());

  if (byStateDomain) {
    const allowedNodeIds = new Set(
      nodes
        .filter((node) => node.state_domain_ref === byStateDomain || node.id === byStateDomain)
        .map((node) => node.id)
    );
    allowedNodeIds.add(repository.repository_id);

    nodes = nodes.filter((node) => allowedNodeIds.has(node.id));
    edges = edges.filter((edge) => allowedNodeIds.has(edge.source) && allowedNodeIds.has(edge.target));
  }

  if (byNodeType) {
    const allowedNodeIds = new Set(
      nodes
        .filter((node) => node.node_type === byNodeType || node.id === repository.repository_id)
        .map((node) => node.id)
    );
    allowedNodeIds.add(repository.repository_id);

    nodes = nodes.filter((node) => allowedNodeIds.has(node.id));
    edges = edges.filter((edge) => allowedNodeIds.has(edge.source) && allowedNodeIds.has(edge.target));
  }

  const stats = {
    node_count: nodes.length,
    edge_count: edges.length,
    by_node_type: nodes.reduce((acc, node) => {
      acc[node.node_type] = (acc[node.node_type] || 0) + 1;
      return acc;
    }, {}),
    by_edge_type: edges.reduce((acc, edge) => {
      acc[edge.edge_type] = (acc[edge.edge_type] || 0) + 1;
      return acc;
    }, {})
  };

  return {
    generated_at: new Date().toISOString(),
    source: 'knowledge_repository_sample',
    options: {
      include_audit: includeAudit,
      state_domain_ref: byStateDomain,
      node_type: byNodeType
    },
    nodes,
    edges,
    stats
  };
}

module.exports = { buildKnowledgeGraphProjection };
