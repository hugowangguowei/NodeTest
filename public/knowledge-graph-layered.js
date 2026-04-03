'use strict';

const NODE_COLORS = {
  knowledge_repository: '#1f6f8b',
  state_domain: '#2f7e4f',
  entity: '#5471c4',
  behavior: '#8d62c3',
  event: '#c96f4f',
  relationship: '#7e6f62',
  business_flow: '#a45e7f',
  rule: '#9b6b31',
  flow_node: '#6a7b91',
  flow_instance: '#4f8e97',
  node_instance: '#7b8c4e',
  operation_log: '#ad5454',
  state_snapshot: '#5d7ea5',
  reference: '#8899ac'
};

const LAYER_ORDER = [
  {
    key: 'repository',
    title: 'L1 仓库根',
    types: ['knowledge_repository']
  },
  {
    key: 'state_domain',
    title: 'L2 状态域',
    types: ['state_domain']
  },
  {
    key: 'semantic',
    title: 'L3 语义对象',
    types: ['entity', 'behavior', 'event', 'relationship', 'business_flow', 'rule']
  },
  {
    key: 'runtime',
    title: 'L4 运行态',
    types: ['flow_node', 'flow_instance', 'node_instance']
  },
  {
    key: 'audit',
    title: 'L5 审计态',
    types: ['operation_log', 'state_snapshot', 'reference']
  }
];

const state = {
  payload: null,
  selectedNodeId: null,
  nodesById: new Map(),
  edges: []
};

function getElements() {
  return {
    includeAudit: document.querySelector('[data-role="include-audit"]'),
    stateDomainSelect: document.querySelector('[data-role="state-domain-select"]'),
    nodeTypeSelect: document.querySelector('[data-role="node-type-select"]'),
    refreshButton: document.querySelector('[data-role="refresh-button"]'),
    graphSummary: document.querySelector('[data-role="graph-summary"]'),
    nodeDetail: document.querySelector('[data-role="node-detail"]'),
    graphStats: document.querySelector('[data-role="graph-stats"]'),
    errorBanner: document.querySelector('[data-role="error-banner"]'),
    graphSvg: document.querySelector('[data-role="layered-graph-svg"]'),
    graphScroll: document.querySelector('[data-role="graph-scroll"]')
  };
}

function setError(message) {
  const { errorBanner } = getElements();
  errorBanner.hidden = false;
  errorBanner.textContent = message;
}

function clearError() {
  const { errorBanner } = getElements();
  errorBanner.hidden = true;
  errorBanner.textContent = '';
}

function toJson(value) {
  return JSON.stringify(value, null, 2);
}

function createQueryString() {
  const { includeAudit, stateDomainSelect, nodeTypeSelect } = getElements();
  const params = new URLSearchParams();
  params.set('include_audit', includeAudit.checked ? 'true' : 'false');

  if (stateDomainSelect.value) {
    params.set('state_domain_ref', stateDomainSelect.value);
  }

  if (nodeTypeSelect.value) {
    params.set('node_type', nodeTypeSelect.value);
  }

  return params.toString();
}

function getLayerIndex(nodeType) {
  const index = LAYER_ORDER.findIndex((layer) => layer.types.includes(nodeType));
  if (index >= 0) {
    return index;
  }
  return LAYER_ORDER.length - 1;
}

const LAYER_GAP = 260;
const X_PADDING = 150;
const Y_PADDING = 80;
const NODE_VERTICAL_GAP = 88;
const ORDER_SWEEP_TIMES = 5;

function buildNeighborMap(edges) {
  const neighborMap = new Map();

  function ensureNode(nodeId) {
    if (!neighborMap.has(nodeId)) {
      neighborMap.set(nodeId, new Set());
    }
  }

  edges.forEach((edge) => {
    if (!edge || typeof edge.source !== 'string' || typeof edge.target !== 'string') {
      return;
    }

    ensureNode(edge.source);
    ensureNode(edge.target);
    neighborMap.get(edge.source).add(edge.target);
    neighborMap.get(edge.target).add(edge.source);
  });

  return neighborMap;
}

function buildOrderIndexMap(grouped) {
  const orderIndexMap = new Map();

  grouped.forEach((group, layerIndex) => {
    const layerSize = group.nodes.length;
    group.nodes.forEach((node, orderIndex) => {
      orderIndexMap.set(node.id, {
        layerIndex,
        orderIndex,
        layerSize
      });
    });
  });

  return orderIndexMap;
}

function projectedOrder(meta, targetLayerSize) {
  if (targetLayerSize <= 1) {
    return 0;
  }

  const normalized =
    meta.layerSize <= 1 ? 0.5 : meta.orderIndex / Math.max(meta.layerSize - 1, 1);
  return normalized * (targetLayerSize - 1);
}

function reorderLayerByConnectivity(grouped, layerIndex, neighborMap) {
  const currentNodes = grouped[layerIndex].nodes;
  if (currentNodes.length <= 2) {
    return;
  }

  const orderIndexMap = buildOrderIndexMap(grouped);
  const targetSize = currentNodes.length;

  const scored = currentNodes.map((node, fallbackIndex) => {
    const neighbors = Array.from(neighborMap.get(node.id) || []);
    const scoreItems = neighbors
      .map((neighborId) => {
        const meta = orderIndexMap.get(neighborId);
        if (!meta) {
          return null;
        }

        const layerDistance = Math.abs(meta.layerIndex - layerIndex);
        const weight = layerDistance === 0 ? 0.35 : 1 / layerDistance;
        return {
          value: projectedOrder(meta, targetSize),
          weight
        };
      })
      .filter(Boolean);

    if (scoreItems.length === 0) {
      return {
        node,
        score: fallbackIndex
      };
    }

    const totalWeight = scoreItems.reduce((sum, item) => sum + item.weight, 0);
    const weightedScore =
      scoreItems.reduce((sum, item) => sum + item.value * item.weight, 0) /
      Math.max(totalWeight, 0.0001);

    return {
      node,
      score: weightedScore
    };
  });

  scored.sort((left, right) => {
    if (Math.abs(left.score - right.score) > 0.001) {
      return left.score - right.score;
    }

    const leftLabel = left.node.label || left.node.id;
    const rightLabel = right.node.label || right.node.id;
    return leftLabel.localeCompare(rightLabel, 'zh-CN');
  });

  grouped[layerIndex].nodes = scored.map((item) => item.node);
}

function applyConnectivityOrdering(grouped, edges) {
  const neighborMap = buildNeighborMap(edges);
  if (neighborMap.size === 0) {
    return;
  }

  for (let sweep = 0; sweep < ORDER_SWEEP_TIMES; sweep += 1) {
    for (let layerIndex = 1; layerIndex < grouped.length; layerIndex += 1) {
      reorderLayerByConnectivity(grouped, layerIndex, neighborMap);
    }

    for (let layerIndex = grouped.length - 2; layerIndex >= 0; layerIndex -= 1) {
      reorderLayerByConnectivity(grouped, layerIndex, neighborMap);
    }
  }
}

function layoutGraph(nodes, edges) {
  const { graphScroll } = getElements();
  const minWidth = Math.max(graphScroll.clientWidth - 2, 1320);

  const grouped = LAYER_ORDER.map((layer) => ({
    ...layer,
    nodes: []
  }));

  nodes.forEach((node) => {
    grouped[getLayerIndex(node.node_type)].nodes.push(node);
  });

  grouped.forEach((layer) => {
    layer.nodes.sort((left, right) => {
      const leftLabel = left.label || left.id;
      const rightLabel = right.label || right.id;
      return leftLabel.localeCompare(rightLabel, 'zh-CN');
    });
  });

  applyConnectivityOrdering(grouped, edges);

  const maxLayerSize = grouped.reduce((max, layer) => Math.max(max, layer.nodes.length), 1);
  const viewHeight = Y_PADDING * 2 + maxLayerSize * NODE_VERTICAL_GAP + 80;
  const viewWidth = Math.max(minWidth, X_PADDING * 2 + (grouped.length - 1) * LAYER_GAP + 160);

  const positionedNodes = [];
  const positionedMap = new Map();

  grouped.forEach((layer, layerIndex) => {
    const x = X_PADDING + layerIndex * LAYER_GAP;
    const layerHeight = Math.max(layer.nodes.length * NODE_VERTICAL_GAP, NODE_VERTICAL_GAP);
    const startY = (viewHeight - layerHeight) / 2 + 20;
    layer.x = x;

    layer.nodes.forEach((node, nodeIndex) => {
      const y = startY + nodeIndex * NODE_VERTICAL_GAP;
      const positionedNode = {
        ...node,
        x,
        y,
        radius: node.node_type === 'knowledge_repository' ? 20 : node.node_type === 'state_domain' ? 14 : 11,
        layerTitle: layer.title
      };
      positionedNodes.push(positionedNode);
      positionedMap.set(positionedNode.id, positionedNode);
    });
  });

  const positionedEdges = edges
    .map((edge) => ({
      ...edge,
      sourceNode: positionedMap.get(edge.source),
      targetNode: positionedMap.get(edge.target)
    }))
    .filter((edge) => edge.sourceNode && edge.targetNode);

  return {
    width: viewWidth,
    height: viewHeight,
    groups: grouped,
    nodes: positionedNodes,
    nodesById: positionedMap,
    edges: positionedEdges
  };
}

function createSvgElement(name) {
  return document.createElementNS('http://www.w3.org/2000/svg', name);
}

function edgePath(sourceNode, targetNode) {
  const x1 = sourceNode.x + sourceNode.radius;
  const y1 = sourceNode.y;
  const x2 = targetNode.x - targetNode.radius;
  const y2 = targetNode.y;
  const bend = Math.max(40, Math.abs(x2 - x1) * 0.4);
  return `M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}`;
}

function clearSvg(svg) {
  while (svg.firstChild) {
    svg.removeChild(svg.firstChild);
  }
}

function drawLayerTitles(svg, layout) {
  layout.groups.forEach((group) => {
    const title = createSvgElement('text');
    title.setAttribute('x', String(group.x || 0));
    title.setAttribute('y', '34');
    title.setAttribute('class', 'layer-title');
    title.textContent = group.title;
    svg.appendChild(title);
  });
}

function truncateLabel(value) {
  if (typeof value !== 'string') {
    return '';
  }
  if (value.length <= 12) {
    return value;
  }
  return `${value.slice(0, 11)}…`;
}

function renderGraph() {
  const { graphSvg } = getElements();

  if (!state.payload) {
    return;
  }

  const layout = layoutGraph(state.payload.nodes, state.payload.edges);
  state.nodesById = layout.nodesById;
  state.edges = layout.edges;

  graphSvg.setAttribute('width', String(layout.width));
  graphSvg.setAttribute('height', String(layout.height));
  graphSvg.setAttribute('viewBox', `0 0 ${layout.width} ${layout.height}`);
  clearSvg(graphSvg);

  drawLayerTitles(graphSvg, layout);

  layout.edges.forEach((edge) => {
    const path = createSvgElement('path');
    path.setAttribute('d', edgePath(edge.sourceNode, edge.targetNode));
    path.setAttribute('class', 'edge-line');
    path.setAttribute('data-edge-id', edge.id);
    path.setAttribute('data-edge-type', edge.edge_type || '');
    graphSvg.appendChild(path);
  });

  layout.nodes.forEach((node) => {
    const group = createSvgElement('g');
    group.setAttribute('data-node-id', node.id);

    const circle = createSvgElement('circle');
    circle.setAttribute('cx', String(node.x));
    circle.setAttribute('cy', String(node.y));
    circle.setAttribute('r', String(node.radius));
    circle.setAttribute('fill', NODE_COLORS[node.node_type] || '#64768a');
    circle.setAttribute(
      'class',
      node.id === state.selectedNodeId ? 'node-shape is-selected' : 'node-shape'
    );
    circle.addEventListener('click', () => {
      state.selectedNodeId = node.id;
      renderGraph();
      renderNodeDetail();
    });

    const label = createSvgElement('text');
    label.setAttribute('x', String(node.x));
    label.setAttribute('y', String(node.y + node.radius + 16));
    label.setAttribute('class', 'node-label');
    label.textContent = truncateLabel(node.label || node.id);

    group.append(circle, label);
    graphSvg.appendChild(group);
  });
}

function renderNodeDetail() {
  const { nodeDetail } = getElements();

  if (!state.selectedNodeId) {
    nodeDetail.textContent = '点击节点查看详细信息。';
    return;
  }

  const node = state.nodesById.get(state.selectedNodeId);
  if (!node) {
    nodeDetail.textContent = '当前选中节点不在筛选结果中。';
    return;
  }

  const incoming = state.edges
    .filter((edge) => edge.target === node.id)
    .map((edge) => ({
      id: edge.id,
      source: edge.source,
      edge_type: edge.edge_type
    }));

  const outgoing = state.edges
    .filter((edge) => edge.source === node.id)
    .map((edge) => ({
      id: edge.id,
      target: edge.target,
      edge_type: edge.edge_type
    }));

  nodeDetail.textContent = toJson({
    id: node.id,
    label: node.label || node.id,
    node_type: node.node_type,
    state_domain_ref: node.state_domain_ref || null,
    layer: node.layerTitle,
    degree: {
      incoming: incoming.length,
      outgoing: outgoing.length
    },
    incoming_edges: incoming,
    outgoing_edges: outgoing,
    raw: node.raw
  });
}

function renderStats() {
  const { graphStats, graphSummary } = getElements();
  if (!state.payload) {
    graphSummary.textContent = '暂无数据';
    graphStats.textContent = '暂无统计';
    return;
  }

  graphSummary.textContent = `节点 ${state.payload.stats.node_count} | 连线 ${state.payload.stats.edge_count}`;
  graphStats.textContent = toJson({
    generated_at: state.payload.generated_at,
    options: state.payload.options,
    stats: state.payload.stats
  });
}

function setSelectOptions(selectElement, options, placeholder) {
  const previousValue = selectElement.value;
  selectElement.innerHTML = '';
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = placeholder;
  selectElement.append(defaultOption);

  options.forEach((optionItem) => {
    const option = document.createElement('option');
    option.value = optionItem.value;
    option.textContent = optionItem.label;
    selectElement.append(option);
  });

  if (previousValue && options.some((item) => item.value === previousValue)) {
    selectElement.value = previousValue;
  }
}

function refreshFilterOptions(payload) {
  const { stateDomainSelect, nodeTypeSelect } = getElements();
  const domains = payload.nodes
    .filter((node) => node.node_type === 'state_domain')
    .map((node) => ({ value: node.id, label: node.label || node.id }))
    .sort((left, right) => left.label.localeCompare(right.label, 'zh-CN'));

  const nodeTypes = Object.keys(payload.stats.by_node_type || {})
    .sort((left, right) => left.localeCompare(right))
    .map((nodeType) => ({ value: nodeType, label: nodeType }));

  setSelectOptions(stateDomainSelect, domains, '全部状态域');
  setSelectOptions(nodeTypeSelect, nodeTypes, '全部节点类型');
}

async function loadGraph() {
  const queryString = createQueryString();
  const response = await fetch(`/api/visualization/knowledge-graph?${queryString}`);

  if (!response.ok) {
    throw new Error(`接口异常: HTTP ${response.status}`);
  }

  const payload = await response.json();
  state.payload = payload;

  if (state.selectedNodeId && !payload.nodes.some((node) => node.id === state.selectedNodeId)) {
    state.selectedNodeId = null;
  }

  refreshFilterOptions(payload);
  renderStats();
  renderGraph();
  renderNodeDetail();
}

function bindControls() {
  const { includeAudit, stateDomainSelect, nodeTypeSelect, refreshButton } = getElements();
  const reload = async () => {
    try {
      clearError();
      await loadGraph();
    } catch (error) {
      setError(error.message);
    }
  };

  includeAudit.addEventListener('change', reload);
  stateDomainSelect.addEventListener('change', reload);
  nodeTypeSelect.addEventListener('change', reload);
  refreshButton.addEventListener('click', reload);
}

async function init() {
  bindControls();
  await loadGraph();
}

init().catch((error) => {
  setError(error.message);
});
