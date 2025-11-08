<template>
  <Transition name="modal">
    <div v-if="isOpen" class="modal-overlay" @click="closeModal">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h2>回報歷史記錄</h2>
          <button class="close-btn" @click="closeModal">✕</button>
        </div>

        <div class="modal-content">
          <!-- 篩選選項 -->
          <div class="filter-section">
            <div class="filter-group">
              <label for="status-filter">狀況篩選：</label>
              <select id="status-filter" v-model="selectedStatusFilter" class="filter-select">
                <option value="">全部狀況</option>
                <option value="crowded">擁擠</option>
                <option value="accident">意外</option>
                <option value="blocked">受阻</option>
                <option value="emergency">緊急情況</option>
                <option value="other">其他</option>
              </select>
            </div>

            <button class="clear-filter-btn" @click="clearHistory" v-if="reports.length > 0">
              清除所有記錄
            </button>
          </div>

          <!-- 歷史記錄列表 -->
          <div class="history-list">
            <div v-if="filteredReports.length === 0" class="no-records">
              <p>暫無回報記錄</p>
            </div>

            <div v-for="(report, index) in filteredReports" :key="report.id" class="history-item">
              <div class="item-header">
                <span class="item-index">#{{ filteredReports.length - index }}</span>
                <span class="item-status" :class="report.status">
                  {{ getStatusLabel(report.status) }}
                </span>
                <span class="item-time">
                  {{ formatTime(report.timestamp) }}
                </span>
              </div>

              <div class="item-body">
                <div class="location-info">
                  <strong>位置：</strong>
                  <span class="coordinates">
                    {{ report.latitude.toFixed(7) }}, {{ report.longitude.toFixed(7) }}
                  </span>
                </div>

                <div v-if="report.notes" class="notes-info">
                  <strong>備註：</strong>
                  <span>{{ report.notes }}</span>
                </div>
              </div>

              <div class="item-actions">
                <button class="action-btn view-btn" @click="viewOnMap(report)" title="在地圖上查看">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  查看
                </button>
                <button class="action-btn delete-btn" @click="deleteReport(report.id)" title="刪除記錄">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                  刪除
                </button>
              </div>
            </div>
          </div>

          <!-- 統計信息 -->
          <div v-if="reports.length > 0" class="statistics">
            <div class="stat-item">
              <span class="stat-label">總記錄數：</span>
              <span class="stat-value">{{ reports.length }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">今日記錄：</span>
              <span class="stat-value">{{ todayReports.length }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  reports: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['close', 'viewOnMap', 'deleteReport', 'clearHistory']);

const selectedStatusFilter = ref('');

// 過濾報告列表
const filteredReports = computed(() => {
  let filtered = [...props.reports].reverse(); // 最新的在前

  if (selectedStatusFilter.value) {
    filtered = filtered.filter(report => report.status === selectedStatusFilter.value);
  }

  return filtered;
});

// 今日報告
const todayReports = computed(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return props.reports.filter(report => {
    const reportDate = new Date(report.timestamp);
    reportDate.setHours(0, 0, 0, 0);
    return reportDate.getTime() === today.getTime();
  });
});

// 關閉模態框
const closeModal = () => {
  emit('close');
};

// 獲取狀況標籤文字
const getStatusLabel = (status) => {
  const statusMap = {
    normal: '正常',
    crowded: '擁擠',
    accident: '意外',
    blocked: '受阻',
    emergency: '緊急情況',
    other: '其他'
  };
  return statusMap[status] || status;
};

// 格式化時間
const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

// 在地圖上查看
const viewOnMap = (report) => {
  emit('viewOnMap', report);
  closeModal();
};

// 刪除記錄
const deleteReport = (reportId) => {
  if (confirm('確定要刪除這條記錄嗎？')) {
    emit('deleteReport', reportId);
  }
};

// 清除所有記錄
const clearHistory = () => {
  if (confirm('確定要清除所有回報記錄嗎？此操作無法恢復。')) {
    emit('clearHistory');
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  padding: 20px;
}

.modal-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
  position: sticky;
  top: 0;
  background: white;
  z-index: 10;
}

.modal-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  transition: color 0.2s;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #000;
}

.modal-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex: 1;
  overflow-y: auto;
}

.filter-section {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 8px;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  gap: 8px;
  align-items: center;
}

.filter-group label {
  font-size: 13px;
  font-weight: 600;
  color: #666;
  white-space: nowrap;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 13px;
  color: #333;
  background: white;
  cursor: pointer;
  transition: border-color 0.2s;
}

.filter-select:focus {
  outline: none;
  border-color: #ff0000;
  box-shadow: 0 0 0 2px rgba(255, 0, 0, 0.1);
}

.clear-filter-btn {
  padding: 8px 12px;
  background: #ff6b6b;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-left: auto;
}

.clear-filter-btn:hover {
  background: #ff5252;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
}

.no-records {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 150px;
  color: #999;
  font-size: 14px;
}

.history-item {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 12px;
  transition: all 0.2s;
}

.history-item:hover {
  border-color: #ff0000;
  box-shadow: 0 2px 8px rgba(255, 0, 0, 0.1);
}

.item-header {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 8px;
}

.item-index {
  font-weight: bold;
  color: #999;
  font-size: 12px;
  min-width: 30px;
}

.item-status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  color: white;
}

.item-status.crowded {
  background: #ff9800;
}

.item-status.accident {
  background: #f44336;
}

.item-status.blocked {
  background: #2196f3;
}

.item-status.emergency {
  background: #9c27b0;
}

.item-status.other {
  background: #757575;
}

.item-time {
  font-size: 12px;
  color: #999;
  margin-left: auto;
}

.item-body {
  margin: 8px 0;
  font-size: 13px;
  color: #555;
}

.location-info,
.notes-info {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
}

.location-info strong,
.notes-info strong {
  color: #333;
  font-weight: 600;
  min-width: 40px;
}

.coordinates {
  font-family: monospace;
  color: #666;
}

.item-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  border-color: #ff0000;
  color: #ff0000;
}

.view-btn {
  color: #ff0000;
  border-color: #ff0000;
}

.delete-btn {
  color: #f44336;
  border-color: #f44336;
  margin-left: auto;
}

.delete-btn:hover {
  background: #ffebee;
}

.statistics {
  display: flex;
  gap: 20px;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 8px;
  margin-top: auto;
  border-top: 1px solid #e0e0e0;
}

.stat-item {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 13px;
}

.stat-label {
  color: #666;
  font-weight: 600;
}

.stat-value {
  color: #ff0000;
  font-weight: bold;
  font-size: 16px;
}

/* Transition animations */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from {
  opacity: 0;
}

.modal-enter-from .modal-container {
  transform: scale(0.9);
}

.modal-leave-to {
  opacity: 0;
}

.modal-leave-to .modal-container {
  transform: scale(0.9);
}

/* 移動設備優化 */
@media (max-width: 600px) {
  .modal-overlay {
    padding: 10px;
  }

  .modal-container {
    max-height: 90vh;
  }

  .modal-header {
    padding: 16px;
  }

  .modal-content {
    padding: 16px;
  }

  .filter-section {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-group {
    width: 100%;
  }

  .filter-select {
    flex: 1;
  }

  .clear-filter-btn {
    margin-left: 0;
    width: 100%;
  }

  .statistics {
    flex-direction: column;
    gap: 10px;
  }
}
</style>
