<template>
  <div ref="markerRef" />
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';

const props = defineProps({
  map: {
    type: Object,
    default: null
  },
  position: {
    type: Object,
    required: true
  },
  status: {
    type: String,
    default: 'normal'
  },
  timestamp: {
    type: String,
    required: true
  },
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  notes: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['marker-click']);

const markerRef = ref(null);
let marker = null;
let infowindow = null;

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

const createMarker = () => {
  // 檢查必要的條件
  if (!props.map) {
    console.warn('Map not ready for marker', props.latitude, props.longitude);
    return false;
  }

  if (!window.google || !google.maps) {
    console.warn('Google Maps API not loaded');
    return false;
  }

  try {
    // 建立信息窗口
    const infowindowContent = `
      <div style="padding: 12px; font-size: 13px; min-width: 200px; font-family: system-ui, -apple-system, sans-serif;">
        <strong style="color: #FF0000; font-size: 14px;">狀況：${getStatusLabel(props.status)}</strong><br>
        <strong>位置：</strong> ${props.latitude.toFixed(7)}, ${props.longitude.toFixed(7)}<br>
        <strong>時間：</strong> ${new Date(props.timestamp).toLocaleString('zh-TW')}<br>
        ${props.notes ? `<strong>備註：</strong> ${props.notes}` : ''}
      </div>
    `;

    infowindow = new google.maps.InfoWindow({
      content: infowindowContent
    });

    // 驗證位置資料
    if (!props.position || typeof props.position.lat !== 'number' || typeof props.position.lng !== 'number') {
      console.error('Invalid position:', props.position);
      return false;
    }

    // 建立標記
    marker = new google.maps.Marker({
      position: {
        lat: parseFloat(props.position.lat),
        lng: parseFloat(props.position.lng)
      },
      map: props.map,
      title: `${getStatusLabel(props.status)} - ${new Date(props.timestamp).toLocaleTimeString('zh-TW')}`,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: '#FF0000',
        fillOpacity: 0.8,
        strokeColor: '#FFFFFF',
        strokeWeight: 2
      },
      clickable: true
    });

    // 點擊標記顯示信息窗口
    marker.addListener('click', () => {
      // 關閉其他窗口
      const event = new CustomEvent('marker-clicked');
      window.dispatchEvent(event);

      emit('marker-click', {
        markerId: `${props.position.lat}-${props.position.lng}`,
        status: props.status,
        infowindow: infowindow
      });

      // 延遲打開以確保其他窗口已關閉
      setTimeout(() => {
        infowindow.open(props.map, marker);
      }, 50);
    });

    console.log('Marker created successfully at', props.position);
    return true;
  } catch (error) {
    console.error('Error creating marker:', error);
    return false;
  }
};

const closeInfowindow = () => {
  if (infowindow) {
    infowindow.close();
  }
};

const removeMarker = () => {
  if (marker) {
    marker.setMap(null);
    marker = null;
  }
  if (infowindow) {
    infowindow.close();
    infowindow = null;
  }
};

onMounted(() => {
  // 延遲創建以確保地圖完全加載
  if (props.map) {
    // 如果 map 已存在，立即嘗試建立標記
    const success = createMarker();
    if (!success) {
      // 如果失敗，延遲後重試
      setTimeout(() => {
        createMarker();
      }, 300);
    }
  }
});

onBeforeUnmount(() => {
  removeMarker();
});

// 監聽 map 物件變化
watch(
  () => props.map,
  (newMap) => {
    if (newMap) {
      // 移除舊標記
      removeMarker();
      // 延遲建立新標記，確保地圖已準備好
      setTimeout(() => {
        createMarker();
      }, 100);
    } else {
      removeMarker();
    }
  },
  { immediate: false }
);

// 監聽位置資料變化
watch(
  () => [props.position, props.latitude, props.longitude],
  () => {
    if (props.map && marker) {
      // 更新標記位置
      if (props.position && props.position.lat && props.position.lng) {
        marker.setPosition({
          lat: parseFloat(props.position.lat),
          lng: parseFloat(props.position.lng)
        });
      }
    }
  }
);

defineExpose({
  closeInfowindow,
  removeMarker
});
</script>
