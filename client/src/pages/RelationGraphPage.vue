<template>
  <div class="page-container relation-graph-page">
    <div class="page-header">
      <div class="page-title">关系图</div>
      <div class="graph-controls">
        <button class="ctrl-btn" @click="zoomIn" title="放大">＋</button>
        <button class="ctrl-btn" @click="zoomOut" title="缩小">－</button>
        <button class="ctrl-btn" @click="resetView" title="重置">↺</button>
      </div>
    </div>

    <div v-if="loading" class="graph-empty">
      <div class="empty-state-icon">⏳</div>
      <div class="empty-state-text">加载中...</div>
    </div>

    <div v-else-if="loadError" class="graph-empty">
      <div class="empty-state-icon">😵</div>
      <div class="empty-state-text">{{ loadError }}</div>
      <button class="retry-btn" @click="loadGraphData">重新加载</button>
    </div>

    <div v-else-if="graphData.nodes.length === 0" class="graph-empty">
      <div class="empty-state-icon">🕸️</div>
      <div class="empty-state-text">暂无关系数据，请先添加人物关系</div>
    </div>

    <div v-else class="graph-wrapper">
      <div ref="cyContainer" class="cy-container"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { getRelationGraph } from '../api/personRelations'
import cytoscape from 'cytoscape'

const router = useRouter()
const cyContainer = ref(null)
const loading = ref(true)
const loadError = ref('')
const graphData = ref({ nodes: [], edges: [] })

let cy = null

const COLORS = [
  '#667eea', '#f5576c', '#4facfe', '#43e97b',
  '#fa709a', '#30cfd0', '#ff9a9e', '#f093fb',
  '#fccb90', '#a18cd1', '#fbc2eb', '#84fab0',
  '#8fd3f4', '#d4fc79', '#ffecd2', '#fcb69f'
]

function getNodeColor(name) {
  if (!name) return COLORS[0]
  return COLORS[name.charCodeAt(0) % COLORS.length]
}

function getAvatarUrl(avatar) {
  if (!avatar) return ''
  if (avatar.startsWith('http') || avatar.startsWith('/uploads')) return avatar
  return avatar
}

function buildCytoscapeElements(data) {
  const elements = []

  data.nodes.forEach(node => {
    elements.push({
      data: {
        id: String(node.id),
        name: node.name,
        avatar: getAvatarUrl(node.avatar),
        label: node.name
      }
    })
  })

  data.edges.forEach(edge => {
    elements.push({
      data: {
        id: `edge-${edge.id}`,
        source: String(edge.source),
        target: String(edge.target),
        label: edge.label
      }
    })
  })

  return elements
}

function initCytoscape(data) {
  if (cy) {
    cy.destroy()
    cy = null
  }

  const elements = buildCytoscapeElements(data)

  cy = cytoscape({
    container: cyContainer.value,
    elements: elements,
    style: [
      {
        selector: 'node',
        style: {
          'label': 'data(label)',
          'text-valign': 'bottom',
          'text-margin-y': 8,
          'font-size': '13px',
          'color': '#323233',
          'text-outline-color': '#ffffff',
          'text-outline-width': 3,
          'width': 56,
          'height': 56,
          'background-color': function(ele) {
            return getNodeColor(ele.data('name'))
          },
          'background-image': function(ele) {
            const avatar = ele.data('avatar')
            return avatar ? avatar : 'none'
          },
          'background-fit': 'cover',
          'background-width': '100%',
          'background-height': '100%',
          'border-width': 3,
          'border-color': '#ffffff',
          'font-weight': 600,
          'text-wrap': 'ellipsis',
          'text-max-width': '90px',
          'shadow-blur': 6,
          'shadow-color': 'rgba(0,0,0,0.15)',
          'shadow-offset-x': 0,
          'shadow-offset-y': 2,
          'shadow-opacity': 1
        }
      },
      {
        selector: 'node:active',
        style: {
          'overlay-opacity': 0.15,
          'overlay-padding': 6,
          'overlay-color': '#1989fa'
        }
      },
      {
        selector: 'node:selected',
        style: {
          'border-color': '#1989fa',
          'border-width': 4
        }
      },
      {
        selector: 'edge',
        style: {
          'width': 2.5,
          'line-color': '#c8c9cc',
          'target-arrow-color': '#c8c9cc',
          'target-arrow-shape': 'triangle',
          'arrow-scale': 0.9,
          'curve-style': 'bezier',
          'label': 'data(label)',
          'font-size': '12px',
          'color': '#576b95',
          'text-rotation': 'autorotate',
          'text-outline-color': '#ffffff',
          'text-outline-width': 3,
          'text-background-color': '#ffffff',
          'text-background-opacity': 0.85,
          'text-background-padding': '3px 5px',
          'text-background-shape': 'roundrectangle',
          'text-border-opacity': 1,
          'text-border-width': 1,
          'text-border-color': '#e8e8e8',
          'text-wrap': 'ellipsis',
          'text-max-width': '100px',
          'source-endpoint': 'inside-to-node',
          'target-endpoint': 'inside-to-node'
        }
      },
      {
        selector: 'edge:active',
        style: {
          'line-color': '#1989fa',
          'target-arrow-color': '#1989fa',
          'width': 3.5
        }
      }
    ],
    layout: {
      name: 'cose',
      padding: 50,
      nodeRepulsion: function() { return 10000 },
      idealEdgeLength: function() { return 140 },
      gravity: 0.25,
      animate: true,
      animationDuration: 800,
      animationEasing: 'ease-out-cubic',
      randomize: true,
      componentSpacing: 100,
      nodeOverlap: 20,
      edgeElasticity: function() { return 100 },
      nestingFactor: 1.2,
      gravityRange: 3.8,
      initialTemp: 1000,
      coolingFactor: 0.99,
      minTemp: 1.0
    },
    userZoomingEnabled: true,
    userPanningEnabled: true,
    boxSelectionEnabled: false,
    selectionType: 'single',
    touchTapThreshold: 12,
    desktopTapThreshold: 6,
    autoungrabify: false,
    autounselectify: false,
    minZoom: 0.25,
    maxZoom: 3.5,
    wheelSensitivity: 0.2,
    hideEdgesOnViewport: false,
    hideLabelsOnViewport: false,
    textureOnViewport: false,
    motionBlur: false,
    pixelRatio: 'auto'
  })

  cy.on('tap', 'node', function(evt) {
    const node = evt.target
    const personId = node.id()
    if (personId) {
      cy.elements().removeClass('highlighted')
      node.addClass('highlighted')
      setTimeout(() => {
        router.push(`/people/${personId}`)
      }, 150)
    }
  })

  cy.on('tap', function(evt) {
    if (evt.target === cy) {
      cy.elements().removeClass('highlighted')
    }
  })
}

function zoomIn() {
  if (cy) {
    cy.zoom(cy.zoom() * 1.3)
    cy.center()
  }
}

function zoomOut() {
  if (cy) {
    cy.zoom(cy.zoom() / 1.3)
    cy.center()
  }
}

function resetView() {
  if (cy) {
    cy.fit(undefined, 40)
  }
}

async function loadGraphData() {
  loading.value = true
  loadError.value = ''
  try {
    const res = await getRelationGraph()
    graphData.value = res.data
    await nextTick()
    if (res.data.nodes.length > 0) {
      initCytoscape(res.data)
    }
  } catch (err) {
    const msg = err?.message || '加载关系图失败'
    loadError.value = msg
    showToast(msg)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadGraphData()
})

onBeforeUnmount(() => {
  if (cy) {
    cy.destroy()
    cy = null
  }
})
</script>

<style scoped>
.relation-graph-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.relation-graph-page .page-header {
  flex-shrink: 0;
}

.graph-controls {
  display: flex;
  gap: 6px;
}

.ctrl-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background-color: var(--white);
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-color);
  line-height: 1;
}

.ctrl-btn:active {
  background-color: var(--background-color);
}

.graph-wrapper {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.cy-container {
  width: 100%;
  height: 100%;
  min-height: calc(100vh - 120px);
}

.graph-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  color: var(--text-color-3);
}

.empty-state-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-state-text {
  font-size: 15px;
  text-align: center;
  line-height: 1.6;
}

.retry-btn {
  margin-top: 16px;
  padding: 8px 24px;
  background-color: var(--primary-color);
  color: var(--white);
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}

.retry-btn:active {
  opacity: 0.85;
}
</style>
