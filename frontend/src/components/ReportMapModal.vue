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
              :center="mapCenter" :zoom="15" gesture-handling="greedy" :disable-default-ui="false"
              @center_changed="handleMapCenterChanged" @click="handleMapClick">
              <!-- 中心標記（可拖動） -->
              <div class="map-center-marker" />
            </GoogleMap>
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
              <span class="value hint">拖動地圖或點擊地圖選擇位置</span>
            </div>
          </div>

          <!-- 操作按鈕 -->
          <div class="button-group">
            <button class="btn btn-cancel" @click="closeModal">取消</button>
            <button class="btn btn-confirm" @click="confirmLocation">確認位置</button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue';
import { GoogleMap } from 'vue3-google-map';


const ApiKey = import.meta.env.VITE_GOOGLE_API_KEY
const MapId = import.meta.env.VITE_GOOGLE_MAP_ID


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

let dragMarker = null;
let isMapReady = false;

// 監聽 props 變化
watch(() => props.initialLat, (newVal) => {
  selectedLocation.lat = newVal;
  mapCenter.lat = newVal;
});

watch(() => props.initialLng, (newVal) => {
  selectedLocation.lng = newVal;
  mapCenter.lng = newVal;
});

// 初始化可拖動標記
const initDragMarker = () => {
  if (!reportMap.value?.map || !window.google) return;

  const map = reportMap.value.map;

  // 創建可拖動的標記
  dragMarker = new google.maps.Marker({
    position: {
      lat: selectedLocation.lat,
      lng: selectedLocation.lng
    },
    map: map,
    draggable: true,
    title: '拖動以選擇位置',
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 14,
      fillColor: '#FF6B6B',
      fillOpacity: 0.9,
      strokeColor: '#FFFFFF',
      strokeWeight: 3
    }
  });

  // 監聽標記拖動事件
  dragMarker.addListener('drag', () => {
    const pos = dragMarker.getPosition();
    selectedLocation.lat = pos.lat();
    selectedLocation.lng = pos.lng();
  });

  // 標記拖動結束
  dragMarker.addListener('dragend', () => {
    const pos = dragMarker.getPosition();
    selectedLocation.lat = pos.lat();
    selectedLocation.lng = pos.lng();
    mapCenter.lat = pos.lat();
    mapCenter.lng = pos.lng();
  });
};

// 處理地圖點擊
const handleMapClick = (event) => {
  if (event.latLng) {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();

    selectedLocation.lat = lat;
    selectedLocation.lng = lng;
    mapCenter.lat = lat;
    mapCenter.lng = lng;

    // 更新標記位置
    if (dragMarker) {
      dragMarker.setPosition({ lat, lng });
    }
  }
};

// 監聽地圖中心變化
const handleMapCenterChanged = () => {
  if (!isMapReady && reportMap.value?.map) {
    isMapReady = true;
    // 延遲初始化，確保地圖已準備好
    setTimeout(() => {
      initDragMarker();
    }, 100);
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

// 組件卸載時清理
onMounted(() => {
  // 延遲初始化確保地圖組件完全加載
  setTimeout(() => {
    if (reportMap.value?.map && !dragMarker) {
      initDragMarker();
    }
  }, 500);
});
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
  border-radius: 0;
}

.map-center-marker {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 30px;
  height: 30px;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 5;
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
