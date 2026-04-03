'use strict';

const NODE_COLOR_MAP = {
  knowledge_repository: '#1d6f86',
  state_domain: '#2f7f4f',
  entity: '#4d6ec9',
  behavior: '#8c60c0',
  event: '#c9694f',
  relationship: '#7a6b5f',
  business_flow: '#ad5f7f',
  rule: '#a36731',
  flow_node: '#6c7c91',
  flow_instance: '#4e8f99',
  node_instance: '#778b4e',
  operation_log: '#a64848',
  state_snapshot: '#557da4',
  reference: '#8997a8'
};

const DEFAULT_NODE_COLOR = '#61758a';
const MIN_SCALE = 0.35;
const MAX_SCALE = 3.2;

const graphState = {
  payload: null,
  nodes: [],
  edges: [],
  nodeById: new Map(),
  selectedNodeId: null,
  hoveredNodeId: null,
  draggingNodeId: null,
  dragMoved: false,
  panning: false,
  panStart: null,
  width: 0,
  height: 0,
  dpr: window.devicePixelRatio || 1,
  view: {
    scale: 1,
    offsetX: 0,
    offsetY: 0
  },
  animationHandle: null
};

function getElements() {
  return {
    canvas: document.querySelector('[data-role="graph-canvas"]'),
    includeAudit: document.querySelector('[data-role="include-audit"]'),
    stateDomainSelect: document.querySelector('[data-role="state-domain-select"]'),
    nodeTypeSelect: document.querySelector('[data-role="node-type-select"]'),
    refreshButton: document.querySelector('[data-role="refresh-button"]'),
    graphSummary: document.querySelector('[data-role="graph-summary"]'),
    graphStats: document.querySelector('[data-role="graph-stats"]'),
    nodeDetail: document.querySelector('[data-role="node-detail"]'),
    errorBanner: document.querySelector('[data-role="error-banner"]')
  };
}

function formatJson(value) {
  return JSON.stringify(value, null, 2);
}

function asQueryString() {
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

function nodeRadius(nodeType) {
  if (nodeType === 'knowledge_repository') {
    return 20;
  }

  if (nodeType === 'state_domain') {
    return 14;
  }

  if (nodeType === 'flow_node') {
    return 9;
  }

  return 11;
}

function seedNodePositions(nodes, width, height) {
  const centerX = width / 2;
  const centerY = height / 2;
  const groups = new Map();

  nodes.forEach((node) => {
    const key = node.node_type || 'unknown';
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(node);
  });

  const types = Array.from(groups.keys()).sort();
  const typeOrbit = Math.min(width, height) * 0.32;
  const rootNode = nodes.find((item) => item.node_type === 'knowledge_repository');

  if (rootNode) {
    rootNode.x = centerX;
    rootNode.y = centerY;
  }

  types.forEach((type, typeIndex) => {
    const group = groups.get(type);
    const typeAngle = (Math.PI * 2 * typeIndex) / Math.max(types.length, 1);
    const groupCenterX = centerX + Math.cos(typeAngle) * typeOrbit;
    const groupCenterY = centerY + Math.sin(typeAngle) * typeOrbit;
    const ringRadius = 38 + group.length * 3;

    group.forEach((node, index) => {
      if (node.node_type === 'knowledge_repository') {
        return;
      }

      const angle = (Math.PI * 2 * index) / Math.max(group.length, 1);
      node.x = groupCenterX + Math.cos(angle) * ringRadius;
      node.y = groupCenterY + Math.sin(angle) * ringRadius;
    });
  });
}

function rebuildGraph(payload) {
  graphState.nodeById = new Map();
  graphState.nodes = payload.nodes.map((node) => {
    const nextNode = {
      ...node,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      ax: 0,
      ay: 0,
      radius: nodeRadius(node.node_type)
    };
    graphState.nodeById.set(nextNode.id, nextNode);
    return nextNode;
  });

  seedNodePositions(graphState.nodes, graphState.width, graphState.height);

  graphState.edges = payload.edges
    .map((edge) => ({
      ...edge,
      sourceNode: graphState.nodeById.get(edge.source),
      targetNode: graphState.nodeById.get(edge.target)
    }))
    .filter((edge) => edge.sourceNode && edge.targetNode);

  graphState.view = {
    scale: 1,
    offsetX: 0,
    offsetY: 0
  };

  if (graphState.selectedNodeId && !graphState.nodeById.has(graphState.selectedNodeId)) {
    graphState.selectedNodeId = null;
  }
}

function toScreenPoint(worldX, worldY) {
  return {
    x: worldX * graphState.view.scale + graphState.view.offsetX,
    y: worldY * graphState.view.scale + graphState.view.offsetY
  };
}

function toWorldPoint(screenX, screenY) {
  return {
    x: (screenX - graphState.view.offsetX) / graphState.view.scale,
    y: (screenY - graphState.view.offsetY) / graphState.view.scale
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function stepSimulation() {
  if (graphState.nodes.length === 0) {
    return;
  }

  const centerX = graphState.width / 2;
  const centerY = graphState.height / 2;
  const repulsionBase = 3200;

  graphState.nodes.forEach((node) => {
    node.ax = 0;
    node.ay = 0;
  });

  for (let i = 0; i < graphState.nodes.length; i += 1) {
    const nodeA = graphState.nodes[i];
    for (let j = i + 1; j < graphState.nodes.length; j += 1) {
      const nodeB = graphState.nodes[j];
      const dx = nodeA.x - nodeB.x;
      const dy = nodeA.y - nodeB.y;
      const distSq = dx * dx + dy * dy + 0.001;
      const dist = Math.sqrt(distSq);
      const minDist = (nodeA.radius + nodeB.radius) * 2.4;
      let force = repulsionBase / distSq;

      if (dist < minDist) {
        force += (minDist - dist) * 0.24;
      }

      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;

      nodeA.ax += fx;
      nodeA.ay += fy;
      nodeB.ax -= fx;
      nodeB.ay -= fy;
    }
  }

  graphState.edges.forEach((edge) => {
    const source = edge.sourceNode;
    const target = edge.targetNode;
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 0.001;
    const desired = 120;
    const springForce = (dist - desired) * 0.016;
    const fx = (dx / dist) * springForce;
    const fy = (dy / dist) * springForce;

    source.ax += fx;
    source.ay += fy;
    target.ax -= fx;
    target.ay -= fy;
  });

  graphState.nodes.forEach((node) => {
    const centerForce = node.node_type === 'knowledge_repository' ? 0.04 : 0.006;
    node.ax += (centerX - node.x) * centerForce;
    node.ay += (centerY - node.y) * centerForce;

    if (node.id === graphState.draggingNodeId) {
      node.vx = 0;
      node.vy = 0;
      return;
    }

    node.vx = (node.vx + node.ax) * 0.78;
    node.vy = (node.vy + node.ay) * 0.78;
    node.x += node.vx;
    node.y += node.vy;

    node.x = clamp(node.x, 30, graphState.width - 30);
    node.y = clamp(node.y, 30, graphState.height - 30);
  });
}

function truncateLabel(value, length) {
  if (typeof value !== 'string') {
    return '';
  }

  if (value.length <= length) {
    return value;
  }

  return `${value.slice(0, length - 1)}…`;
}

function drawGraph() {
  const { canvas } = getElements();
  const context = canvas.getContext('2d');

  context.setTransform(graphState.dpr, 0, 0, graphState.dpr, 0, 0);
  context.clearRect(0, 0, graphState.width, graphState.height);

  graphState.edges.forEach((edge) => {
    const source = toScreenPoint(edge.sourceNode.x, edge.sourceNode.y);
    const target = toScreenPoint(edge.targetNode.x, edge.targetNode.y);
    context.beginPath();
    context.moveTo(source.x, source.y);
    context.lineTo(target.x, target.y);
    context.strokeStyle = 'rgba(46, 69, 92, 0.28)';
    context.lineWidth = 1;
    context.stroke();
  });

  graphState.nodes.forEach((node) => {
    const point = toScreenPoint(node.x, node.y);
    const radius = node.radius * graphState.view.scale;
    const isSelected = node.id === graphState.selectedNodeId;
    const isHovered = node.id === graphState.hoveredNodeId;
    context.beginPath();
    context.arc(point.x, point.y, radius, 0, Math.PI * 2);
    context.fillStyle = NODE_COLOR_MAP[node.node_type] || DEFAULT_NODE_COLOR;
    context.fill();
    context.strokeStyle = isSelected ? '#102132' : 'rgba(16, 33, 50, 0.38)';
    context.lineWidth = isSelected ? 2.8 : 1.3;
    context.stroke();

    if (isHovered && !isSelected) {
      context.beginPath();
      context.arc(point.x, point.y, radius + 4, 0, Math.PI * 2);
      context.strokeStyle = 'rgba(16, 33, 50, 0.36)';
      context.lineWidth = 1.2;
      context.stroke();
    }

    if (graphState.view.scale >= 0.62 || isSelected) {
      context.fillStyle = '#102132';
      context.font = '12px "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif';
      context.textAlign = 'center';
      context.textBaseline = 'top';
      context.fillText(truncateLabel(node.label || node.id, 14), point.x, point.y + radius + 5);
    }
  });
}

function findNodeAt(clientX, clientY) {
  const { canvas } = getElements();
  const rect = canvas.getBoundingClientRect();
  const localX = clientX - rect.left;
  const localY = clientY - rect.top;

  for (let i = graphState.nodes.length - 1; i >= 0; i -= 1) {
    const node = graphState.nodes[i];
    const point = toScreenPoint(node.x, node.y);
    const radius = node.radius * graphState.view.scale + 4;
    const dx = localX - point.x;
    const dy = localY - point.y;
    if (dx * dx + dy * dy <= radius * radius) {
      return node;
    }
  }

  return null;
}

function renderDetails() {
  const { nodeDetail, graphStats } = getElements();

  if (!graphState.payload) {
    nodeDetail.textContent = '暂无图谱数据。';
    graphStats.textContent = '暂无图谱统计。';
    return;
  }

  graphStats.textContent = formatJson({
    generated_at: graphState.payload.generated_at,
    options: graphState.payload.options,
    stats: graphState.payload.stats
  });

  if (!graphState.selectedNodeId) {
    nodeDetail.textContent = '点击图中的节点查看详情。';
    return;
  }

  const node = graphState.nodeById.get(graphState.selectedNodeId);
  if (!node) {
    nodeDetail.textContent = '当前选中节点不在筛选结果中。';
    return;
  }

  const incoming = graphState.edges
    .filter((edge) => edge.target === node.id)
    .map((edge) => ({
      id: edge.id,
      source: edge.source,
      edge_type: edge.edge_type
    }));

  const outgoing = graphState.edges
    .filter((edge) => edge.source === node.id)
    .map((edge) => ({
      id: edge.id,
      target: edge.target,
      edge_type: edge.edge_type
    }));

  nodeDetail.textContent = formatJson({
    id: node.id,
    label: node.label,
    node_type: node.node_type,
    state_domain_ref: node.state_domain_ref || null,
    degree: {
      incoming: incoming.length,
      outgoing: outgoing.length
    },
    incoming_edges: incoming,
    outgoing_edges: outgoing,
    raw: node.raw
  });
}

function renderSummary() {
  const { graphSummary } = getElements();

  if (!graphState.payload) {
    graphSummary.textContent = '暂无数据';
    return;
  }

  graphSummary.textContent = `节点 ${graphState.payload.stats.node_count} | 连线 ${graphState.payload.stats.edge_count}`;
}

function replaceSelectOptions(selectElement, items, placeholderLabel) {
  const previousValue = selectElement.value;
  selectElement.innerHTML = '';

  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = placeholderLabel;
  selectElement.append(placeholder);

  items.forEach((item) => {
    const option = document.createElement('option');
    option.value = item.value;
    option.textContent = item.label;
    selectElement.append(option);
  });

  if (previousValue && items.some((item) => item.value === previousValue)) {
    selectElement.value = previousValue;
  }
}

function refreshFilters(payload) {
  const { stateDomainSelect, nodeTypeSelect } = getElements();
  const domainItems = payload.nodes
    .filter((node) => node.node_type === 'state_domain')
    .map((node) => ({ value: node.id, label: node.label || node.id }))
    .sort((left, right) => left.label.localeCompare(right.label, 'zh-CN'));

  const nodeTypeItems = Object.keys(payload.stats.by_node_type || {})
    .sort((left, right) => left.localeCompare(right))
    .map((nodeType) => ({ value: nodeType, label: nodeType }));

  replaceSelectOptions(stateDomainSelect, domainItems, '全部状态域');
  replaceSelectOptions(nodeTypeSelect, nodeTypeItems, '全部节点类型');
}

async function loadGraph() {
  clearError();

  const queryString = asQueryString();
  const response = await fetch(`/api/visualization/knowledge-graph?${queryString}`);

  if (!response.ok) {
    throw new Error(`知识图谱接口返回异常: HTTP ${response.status}`);
  }

  const payload = await response.json();
  graphState.payload = payload;
  rebuildGraph(payload);
  refreshFilters(payload);
  renderSummary();
  renderDetails();
}

function resizeCanvas() {
  const { canvas } = getElements();
  const rect = canvas.getBoundingClientRect();
  graphState.width = Math.max(320, rect.width);
  graphState.height = Math.max(420, rect.height);
  graphState.dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(graphState.width * graphState.dpr);
  canvas.height = Math.floor(graphState.height * graphState.dpr);
}

function bindCanvasEvents() {
  const { canvas } = getElements();

  canvas.addEventListener('pointerdown', (event) => {
    const targetNode = findNodeAt(event.clientX, event.clientY);
    graphState.dragMoved = false;

    if (targetNode) {
      graphState.draggingNodeId = targetNode.id;
      canvas.setPointerCapture(event.pointerId);
      return;
    }

    graphState.panning = true;
    graphState.panStart = {
      x: event.clientX,
      y: event.clientY,
      offsetX: graphState.view.offsetX,
      offsetY: graphState.view.offsetY
    };
    canvas.setPointerCapture(event.pointerId);
  });

  canvas.addEventListener('pointermove', (event) => {
    if (graphState.draggingNodeId) {
      const { left, top } = canvas.getBoundingClientRect();
      const localX = event.clientX - left;
      const localY = event.clientY - top;
      const world = toWorldPoint(localX, localY);
      const node = graphState.nodeById.get(graphState.draggingNodeId);
      if (node) {
        node.x = world.x;
        node.y = world.y;
        graphState.dragMoved = true;
      }
      return;
    }

    if (graphState.panning && graphState.panStart) {
      graphState.view.offsetX = graphState.panStart.offsetX + (event.clientX - graphState.panStart.x);
      graphState.view.offsetY = graphState.panStart.offsetY + (event.clientY - graphState.panStart.y);
      return;
    }

    const targetNode = findNodeAt(event.clientX, event.clientY);
    graphState.hoveredNodeId = targetNode ? targetNode.id : null;
  });

  canvas.addEventListener('pointerup', (event) => {
    const targetNode = findNodeAt(event.clientX, event.clientY);
    if (graphState.draggingNodeId && !graphState.dragMoved && targetNode) {
      graphState.selectedNodeId = targetNode.id;
      renderDetails();
    }

    graphState.draggingNodeId = null;
    graphState.dragMoved = false;
    graphState.panning = false;
    graphState.panStart = null;
    canvas.releasePointerCapture(event.pointerId);
  });

  canvas.addEventListener('pointerleave', () => {
    graphState.hoveredNodeId = null;
  });

  canvas.addEventListener(
    'wheel',
    (event) => {
      event.preventDefault();
      const { left, top } = canvas.getBoundingClientRect();
      const localX = event.clientX - left;
      const localY = event.clientY - top;
      const anchor = toWorldPoint(localX, localY);
      const scaleDelta = Math.exp(-event.deltaY * 0.0012);
      const nextScale = clamp(graphState.view.scale * scaleDelta, MIN_SCALE, MAX_SCALE);
      graphState.view.scale = nextScale;
      graphState.view.offsetX = localX - anchor.x * nextScale;
      graphState.view.offsetY = localY - anchor.y * nextScale;
    },
    { passive: false }
  );
}

function bindControlEvents() {
  const { includeAudit, stateDomainSelect, nodeTypeSelect, refreshButton } = getElements();

  includeAudit.addEventListener('change', async () => {
    try {
      await loadGraph();
    } catch (error) {
      setError(error.message);
    }
  });

  stateDomainSelect.addEventListener('change', async () => {
    try {
      await loadGraph();
    } catch (error) {
      setError(error.message);
    }
  });

  nodeTypeSelect.addEventListener('change', async () => {
    try {
      await loadGraph();
    } catch (error) {
      setError(error.message);
    }
  });

  refreshButton.addEventListener('click', async () => {
    try {
      await loadGraph();
    } catch (error) {
      setError(error.message);
    }
  });
}

function startRenderLoop() {
  const tick = () => {
    stepSimulation();
    drawGraph();
    graphState.animationHandle = window.requestAnimationFrame(tick);
  };

  graphState.animationHandle = window.requestAnimationFrame(tick);
}

async function init() {
  bindCanvasEvents();
  bindControlEvents();
  resizeCanvas();
  window.addEventListener('resize', () => {
    resizeCanvas();
    if (graphState.payload) {
      seedNodePositions(graphState.nodes, graphState.width, graphState.height);
    }
  });

  await loadGraph();
  startRenderLoop();
}

init().catch((error) => {
  setError(error.message);
});
