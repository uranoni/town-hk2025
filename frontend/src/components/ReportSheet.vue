<template>
  <Transition name="sheet">
    <div v-if="isOpen" class="sheet-overlay" @click="closeSheet">
      <div class="sheet-container" @click.stop>
        <div class="sheet-header">
          <h2>回報狀況</h2>
          <button class="close-btn" @click="closeSheet">✕</button>
        </div>

        <div class="sheet-content">
          <!-- 地理位置選擇 -->
          <div class="location-section">
            <label class="section-label">報告位置</label>
            <div class="location-display">
              <div class="location-info-box">
                <div class="location-row">
                  <span class="label">緯度：</span>
                  <span class="value">{{ formatCoordinate(selectedLat) }}</span>
                </div>
                <div class="location-row">
                  <span class="label">經度：</span>
                  <span class="value">{{ formatCoordinate(selectedLng) }}</span>
                </div>
                <div class="location-row">
                  <span class="label">時間：</span>
                  <span class="value">{{ currentTime }}</span>
                </div>
              </div>
              <button class="location-btn" @click="openMapModal">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                在地圖上選擇
              </button>
            </div>
          </div>

          <!-- 狀況下拉菜單 -->
          <div class="status-section">
            <label class="section-label" for="status-select">回報狀況</label>
            <select
              id="status-select"
              v-model="selectedStatus"
              class="status-select"
            >
              <option value="">-- 請選擇 --</option>
              <option value="normal">正常</option>
              <option value="crowded">擁擠</option>
              <option value="accident">意外</option>
              <option value="blocked">受阻</option>
              <option value="emergency">緊急情況</option>
              <option value="other">其他</option>
            </select>
          </div>

          <!-- 備註欄位（可選） -->
          <div class="notes-section">
            <label class="section-label" for="notes">備註（可選）</label>
            <textarea
              id="notes"
              v-model="notes"
              class="notes-input"
              placeholder="輸入詳細說明..."
              rows="3"
            />
          </div>

          <!-- 提交按鈕 -->
          <button
            class="submit-btn"
            :disabled="!selectedStatus"
            @click="submitReport"
          >
            確認回報
          </button>
        </div>
      </div>
    </div>
  </Transition>

  <!-- 地圖選擇模態框 -->
  <ReportMapModal
    :is-open="isMapModalOpen"
    :initial-lat="selectedLat"
    :initial-lng="selectedLng"
    @close="closeMapModal"
    @confirm="confirmMapLocation"
  />
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import ReportMapModal from './ReportMapModal.vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  latitude: {
    type: Number,
    default: 0
  },
  longitude: {
    type: Number,
    default: 0
  }
});

const emit = defineEmits(['close', 'submit']);

const selectedStatus = ref('');
const notes = ref('');
const currentTime = ref('');
const isMapModalOpen = ref(false);
const selectedLat = ref(props.latitude);
const selectedLng = ref(props.longitude);

// 監聽外部位置變化
watch(() => props.latitude, (newVal) => {
  selectedLat.value = newVal;
});

watch(() => props.longitude, (newVal) => {
  selectedLng.value = newVal;
});

// 更新當前時間
const updateTime = () => {
  const now = new Date();
  currentTime.value = now.toLocaleString('zh-TW');
};

// 格式化座標顯示
const formatCoordinate = (coord) => {
  return coord.toFixed(7);
};

// 關閉 sheet
const closeSheet = () => {
  emit('close');
  resetForm();
};

// 重置表單
const resetForm = () => {
  selectedStatus.value = '';
  notes.value = '';
};

// 開啟地圖選擇模態框
const openMapModal = () => {
  isMapModalOpen.value = true;
};

// 關閉地圖模態框
const closeMapModal = () => {
  isMapModalOpen.value = false;
};

// 確認地圖上選擇的位置
const confirmMapLocation = (location) => {
  selectedLat.value = location.lat;
  selectedLng.value = location.lng;
  closeMapModal();
};

// 提交報告
const submitReport = () => {
  if (!selectedStatus.value) return;

  const report = {
    status: selectedStatus.value,
    latitude: selectedLat.value,
    longitude: selectedLng.value,
    notes: notes.value,
    timestamp: new Date().toISOString()
  };

  emit('submit', report);
  closeSheet();
};

// 初始化和清理時間更新
onMounted(() => {
  updateTime();
  const interval = setInterval(updateTime, 1000);

  onUnmounted(() => {
    clearInterval(interval);
  });
});
</script>

<style scoped>
.sheet-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  z-index: 999;
  animation: fadeIn 0.3s ease;
}

.sheet-container {
  background: white;
  width: 100%;
  max-width: 500px;
  border-radius: 20px 20px 0 0;
  box-shadow: 0 -2px 20px rgba(0, 0, 0, 0.15);
  max-height: 80vh;
  overflow-y: auto;
}

.sheet-header {
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

.sheet-header h2 {
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

.sheet-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.location-section,
.status-section,
.notes-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-label {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.location-display {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.location-info-box {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.location-info {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.location-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.location-row .label {
  color: #666;
  font-weight: 500;
}

.location-row .value {
  color: #333;
  font-family: monospace;
  font-weight: 500;
}

.location-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: #ff0000;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.location-btn:hover {
  background: #cc0000;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(255, 0, 0, 0.3);
}

.location-btn svg {
  width: 16px;
  height: 16px;
}

.status-select {
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  color: #333;
  background: white;
  cursor: pointer;
  transition: border-color 0.2s;
}

.status-select:focus {
  outline: none;
  border-color: #ff0000;
  box-shadow: 0 0 0 2px rgba(255, 0, 0, 0.1);
}

.notes-input {
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  color: #333;
  font-family: inherit;
  resize: vertical;
  transition: border-color 0.2s;
}

.notes-input:focus {
  outline: none;
  border-color: #ff0000;
  box-shadow: 0 0 0 2px rgba(255, 0, 0, 0.1);
}

.submit-btn {
  padding: 12px 20px;
  background: #ff0000;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  margin-top: 10px;
}

.submit-btn:hover:not(:disabled) {
  background: #cc0000;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(255, 0, 0, 0.3);
}

.submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  opacity: 0.6;
}

/* Transition animations */
.sheet-enter-active,
.sheet-leave-active {
  transition: all 0.3s ease;
}

.sheet-enter-from {
  opacity: 0;
}

.sheet-enter-from .sheet-container {
  transform: translateY(100%);
}

.sheet-leave-to {
  opacity: 0;
}

.sheet-leave-to .sheet-container {
  transform: translateY(100%);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* 移動設備優化 */
@media (max-width: 600px) {
  .sheet-container {
    max-width: 100%;
  }

  .sheet-header {
    padding: 16px;
  }

  .sheet-content {
    padding: 16px;
    gap: 16px;
  }
}
</style>
