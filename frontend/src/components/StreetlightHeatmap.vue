<template>
  <div class="heatmap-control">
    <!-- 切換開關 -->
    <div class="toggle-container">
      <label class="toggle-label">
        <span class="label-text">路燈熱圖</span>
        <div class="toggle-switch">
          <input
            type="checkbox"
            :checked="isVisible"
            @change="toggleHeatmap"
            class="toggle-input"
          />
          <span class="toggle-slider" />
        </div>
      </label>
      <div v-if="isVisible" class="heatmap-info">
        <p class="info-title">網格熱圖統計</p>
        <p class="info-stat">網格總數：{{ stats.totalGrids }}</p>
        <p class="info-stat">含燈網格：{{ stats.gridsWithLights }}</p>
        <p class="info-stat">總功率：{{ stats.totalWatt }} W</p>
        <p class="info-stat">平均功率：{{ stats.avgWattPerGrid }} W</p>
        <div class="distribution">
          <p class="dist-title">顏色分佈</p>
          <p class="dist-item">
            <span class="dist-box red"></span>
            <span>紅(1-5W)：{{ stats.distribution.red }}</span>
          </p>
          <p class="dist-item">
            <span class="dist-box yellow"></span>
            <span>黃(6-10W)：{{ stats.distribution.yellow }}</span>
          </p>
          <p class="dist-item">
            <span class="dist-box green"></span>
            <span>綠(11+W)：{{ stats.distribution.green }}</span>
          </p>
        </div>
      </div>
    </div>

    <!-- 圖例 -->
    <div v-if="isVisible" class="legend">
      <div class="legend-title">熱度等級</div>
      <div class="legend-items">
        <div class="legend-item">
          <div class="legend-color low"></div>
          <span>低 (冷)</span>
        </div>
        <div class="legend-item">
          <div class="legend-color medium"></div>
          <span>中 (暖)</span>
        </div>
        <div class="legend-item">
          <div class="legend-color high"></div>
          <span>高 (熱)</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getGridStats } from '../utils/gridHeatmap';

const emit = defineEmits(['toggle']);

const isVisible = ref(false);
const stats = ref({
  totalGrids: 0,
  gridsWithLights: 0,
  totalWatt: 0,
  avgWattPerGrid: 0,
  distribution: {
    transparent: 0,
    red: 0,
    yellow: 0,
    green: 0
  }
});

// 初始化統計數據
const initStats = () => {
  try {
    const statsData = getGridStats();
    stats.value = statsData;
    console.log('Grid heatmap stats loaded:', statsData);
  } catch (error) {
    console.error('Error loading heatmap stats:', error);
  }
};

// 切換熱圖顯示
const toggleHeatmap = (event) => {
  isVisible.value = event.target.checked;
  emit('toggle', isVisible.value);
};

// 隱藏熱圖
const hideHeatmap = () => {
  isVisible.value = false;
  emit('toggle', false);
};

// 顯示熱圖
const showHeatmap = () => {
  isVisible.value = true;
  emit('toggle', true);
};

onMounted(() => {
  initStats();
});

defineExpose({
  showHeatmap,
  hideHeatmap,
  toggleHeatmap
});
</script>

<style scoped>
.heatmap-control {
  position: absolute;
  top: 80px;
  right: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 50;
  overflow: hidden;
  max-width: 250px;
}

.toggle-container {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.toggle-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
}

.label-text {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.toggle-switch {
  position: relative;
  width: 50px;
  height: 26px;
  background: #ccc;
  border-radius: 13px;
  transition: background 0.3s;
  display: inline-block;
}

.toggle-input {
  display: none;
}

.toggle-input:checked + .toggle-slider {
  background: #ff0000;
  transform: translateX(24px);
}

.toggle-slider {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 22px;
  height: 22px;
  background: white;
  border-radius: 50%;
  transition: all 0.3s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.toggle-input:checked ~ .toggle-slider {
  background: white;
  transform: translateX(24px);
}

.toggle-switch:has(.toggle-input:checked) {
  background: #ff0000;
}

.heatmap-info {
  padding-top: 12px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-title {
  font-size: 12px;
  font-weight: 600;
  color: #666;
  margin: 0;
  text-transform: uppercase;
}

.info-stat {
  font-size: 12px;
  color: #333;
  margin: 0;
  display: flex;
  justify-content: space-between;
}

.legend {
  padding: 12px 16px;
  border-top: 1px solid #e0e0e0;
  background: #f9f9f9;
}

.legend-title {
  font-size: 12px;
  font-weight: 600;
  color: #666;
  margin-bottom: 8px;
  text-transform: uppercase;
}

.legend-items {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #666;
}

.legend-color {
  width: 20px;
  height: 12px;
  border-radius: 2px;
}

.legend-color.low {
  background: linear-gradient(to right, rgba(0, 255, 255, 0.5), rgba(0, 255, 255, 1));
}

.legend-color.medium {
  background: linear-gradient(to right, rgba(255, 127, 0, 0.5), rgba(255, 127, 0, 1));
}

.legend-color.high {
  background: linear-gradient(to right, rgba(255, 0, 0, 0.5), rgba(255, 255, 0, 1));
}

.distribution {
  padding-top: 8px;
  border-top: 1px solid #e0e0e0;
}

.dist-title {
  font-size: 11px;
  font-weight: 600;
  color: #666;
  margin: 0 0 6px 0;
  text-transform: uppercase;
}

.dist-item {
  font-size: 11px;
  color: #333;
  margin: 4px 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.dist-box {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.dist-box.red {
  background-color: rgba(255, 0, 0, 0.4);
}

.dist-box.yellow {
  background-color: rgba(255, 255, 0, 0.6);
}

.dist-box.green {
  background-color: rgba(0, 255, 0, 0.8);
}

/* 移動設備優化 */
@media (max-width: 600px) {
  .heatmap-control {
    top: 60px;
    right: 10px;
    max-width: calc(100vw - 20px);
  }

  .toggle-container {
    padding: 12px;
  }
}
</style>
