<template>
  <Transition name="modal">
    <div v-if="isOpen" class="modal-overlay" @click="closeModal">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h2>選擇報告位置</h2>
          <button class="close-btn" @click="closeModal">✕</button>
        </div>

        <div class="modal-content">
          <!-- 地圖容器 -->
          <div class="map-wrapper">
            <GoogleMap ref="reportMap" :api-key="ApiKey" :map-id="MapId" style="width: 100%; height: 100%"
              :center="mapCenter" :zoom="16" gesture-handling="greedy" :disable-default-ui="true"
              @dragend="handleMapDragEnd" @center_changed="handleCenterChanged" />

            <!-- 固定在畫面中央的 Marker（純 CSS，不會移動） -->
            <div class="center-marker">
              <div class="marker-pin"></div>
              <div class="marker-shadow"></div>
            </div>
          </div>

          <!-- 座標顯示和確認區域 -->
          <div class="location-info">
            <div class="info-row">
              <span class="label">緯度：</span>
              <span class="value">{{ selectedLocation.lat.toFixed(7) }}</span>
            </div>
            <div class="info-row">
              <span class="label">經度：</span>
              <span class="value">{{ selectedLocation.lng.toFixed(7) }}</span>
            </div>
            <div class="info-row">
              <span class="label">提示：</span>
              <span class="value hint">拖動地圖來選擇位置</span>
            </div>
          </div>

          <!-- 操作按鈕 -->
          <div class="button-group">
            <button class="btn btn-cancel" @click="closeModal">取消</button>
            <button class="btn bg-primary-500 text-white" @click="confirmLocation">確認位置</button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, reactive, watch } from 'vue';
import { GoogleMap } from 'vue3-google-map';

const ApiKey = import.meta.env.VITE_GOOGLE_API_KEY;
const MapId = import.meta.env.VITE_GOOGLE_MAP_ID;

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  initialLat: {
    type: Number,
    default: 25.0376146
  },
  initialLng: {
    type: Number,
    default: 121.563844
  }
});

const emit = defineEmits(['close', 'confirm']);

const reportMap = ref(null);
const mapCenter = reactive({
  lat: props.initialLat,
  lng: props.initialLng
});

const selectedLocation = reactive({
  lat: props.initialLat,
  lng: props.initialLng
});

// 監聽 props 變化
watch(() => props.initialLat, (newVal) => {
  selectedLocation.lat = newVal;
  mapCenter.lat = newVal;
});

watch(() => props.initialLng, (newVal) => {
  selectedLocation.lng = newVal;
  mapCenter.lng = newVal;
});

// 當地圖拖動結束時更新選中位置
const handleMapDragEnd = () => {
  updateSelectedLocation();
};

// 當地圖中心改變時更新選中位置（用於點擊地圖等其他操作）
const handleCenterChanged = () => {
  updateSelectedLocation();
};

// 更新選中位置為當前地圖中心
const updateSelectedLocation = () => {
  if (!reportMap.value?.map) return;

  const center = reportMap.value.map.getCenter();
  if (center) {
    selectedLocation.lat = center.lat();
    selectedLocation.lng = center.lng();
  }
};

// 關閉模態框
const closeModal = () => {
  emit('close');
};

// 確認位置
const confirmLocation = () => {
  emit('confirm', {
    lat: selectedLocation.lat,
    lng: selectedLocation.lng
  });
  closeModal();
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.modal-container {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  height: 70vh;
  max-height: 700px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
  background: white;
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
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  gap: 0;
}

.map-wrapper {
  flex: 1;
  position: relative;
  overflow: hidden;
}

/* 固定在畫面中央的 Marker */
.center-marker {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -100%);
  pointer-events: none;
  z-index: 10;
}

.marker-pin {
  width: 0;
  height: 0;
  border-left: 15px solid transparent;
  border-right: 15px solid transparent;
  border-top: 40px solid #FF0000;
  position: relative;
  transform: translateX(-50%);
}

.marker-pin::before {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  top: -35px;
  left: 50%;
  transform: translateX(-50%);
}

.marker-pin::after {
  content: '';
  position: absolute;
  width: 12px;
  height: 12px;
  background: #FF0000;
  border-radius: 50%;
  top: -31px;
  left: 50%;
  transform: translateX(-50%);
}

.marker-shadow {
  width: 30px;
  height: 8px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 50%;
  position: absolute;
  top: 2px;
  left: 50%;
  transform: translateX(-50%);
  filter: blur(2px);
}

.location-info {
  padding: 16px 20px;
  background: #f8f9fa;
  border-top: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.info-row .label {
  color: #666;
  font-weight: 500;
  min-width: 50px;
}

.info-row .value {
  color: #333;
  font-family: monospace;
  font-weight: 500;
}

.info-row .hint {
  color: #ff6b6b;
  font-style: italic;
  font-family: inherit;
}

.button-group {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  background: white;
  border-top: 1px solid #e0e0e0;
}

.btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-cancel {
  background: #f0f0f0;
  color: #333;
}

.btn-cancel:hover {
  background: #e0e0e0;
}

.btn-confirm {
  background: #ff0000;
  color: white;
}

.btn-confirm:hover {
  background: #cc0000;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 0, 0, 0.3);
}

/* Modal 動畫 */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from {
  opacity: 0;
}

.modal-enter-from .modal-container {
  transform: scale(0.95);
}

.modal-leave-to {
  opacity: 0;
}

.modal-leave-to .modal-container {
  transform: scale(0.95);
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
  .modal-container {
    width: 95%;
    height: 80vh;
    max-height: 90vh;
  }

  .modal-header {
    padding: 12px 16px;
  }

  .location-info {
    padding: 12px 16px;
  }

  .button-group {
    padding: 12px 16px;
  }
}
</style>