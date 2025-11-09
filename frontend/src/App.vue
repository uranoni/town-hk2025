<template>
  <div class="container mx-auto px-2 h-full bg-primary-500">
    <TabGroup :selectedIndex="selectedTab" @change="changeTab">
      <TabList class="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
        <Tab as="template" v-slot="{ selected }">
          <button :class="[
            'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
            'ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
            selected
              ? 'bg-white text-blue-700 shadow'
              : 'text-blue-100 hover:bg-white/[0.12] hover:text-white',
          ]">
            路況資訊
          </button>
        </Tab>
        <Tab as="template" v-slot="{ selected }">
          <button :class="[
            'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
            'ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
            selected
              ? 'bg-white text-blue-700 shadow'
              : 'text-blue-100 hover:bg-white/[0.12] hover:text-white',
          ]">
            常用點
          </button>
        </Tab>
      </TabList>

      <TabPanels class="mt-2" style="height: calc(100% - 72px);">
        <TabPanel :unmount="false" :class="[
          'rounded-xl bg-white p-3',
          'ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2 h-full',
        ]">
          <GoogleMap ref="locationMap" :api-key="ApiKey" :map-id="MapId" style="width: 100%; height: 100%"
            :center="center" :zoom="17" gesture-handling="greedy" :disable-default-ui="true"
            :libraries="['visualization', 'marker']" @center_changed="mapCenterChanged">
            <AdvancedMarker :options="markerOptions">
            </AdvancedMarker>
            <Polyline v-if="pathCoordinates.length > 1" :options="{
              path: pathCoordinates,
              strokeColor: '#356c77',
              strokeOpacity: 1.0,
              strokeWeight: 10
            }" />
            <!-- 路燈網格熱圖層 -->
            <!-- <Rectangle v-for="cell in heatmapData" v-show="isHeatmapVisible" :key="cell.gridKey" :options="{
        bounds: cell.bounds,
        fillColor: cell.color,
        strokeColor: parseColorValue(cell.color),
        strokeOpacity: 0.3,
        strokeWeight: 1,
        clickable: true
      }" @click="showGridInfo(cell)" /> -->
            <!-- 報告標記由 JavaScript 直接管理 -->
          </GoogleMap>

          <!-- 路燈熱圖控制 -->
          <!-- <StreetlightHeatmap ref="heatmapRef" @toggle="isHeatmapVisible = $event" /> -->

          <button @click="openReportSheet"
            class="flex justify-around gap-2 bg-primary-500 text-white text-lg p-3 rounded-lg fixed bottom-6 left-1/2 -translate-x-1/2 w-40">
            <svg class="button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round">
              <!-- 報告/信號圖標 -->
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            回報路況
          </button>
          <!-- 浮動按鈕和歷史紀錄 -->
          <FloatingButton @click="openHistoryModal">
            歷
          </FloatingButton>
          <HistoryModal :is-open="isHistoryModalOpen" :reports="reports" @close="closeHistoryModal"
            @viewOnMap="handleViewOnMap" @deleteReport="handleDeleteReport" @clearHistory="handleClearHistory" />
          <ReportSheet :is-open="isReportSheetOpen" :latitude="center.lat" :longitude="center.lng"
            @close="closeReportSheet" @submit="handleReportSubmit" />
        </TabPanel>
        <TabPanel :unmount="false" :class="[
          'rounded-xl bg-white p-0',
          'ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2 h-full',
        ]">
          <!-- 回程通知 - 常用歸屬點 -->
          <HomeBaseList :home-bases="homeBases" @add-base="handleAddBase" @update-base="handleUpdateBase"
            @delete-base="handleDeleteBase" @add-contact="handleAddContact" @remove-contact="handleRemoveContact"
            @start-departure="handleStartDeparture" />
        </TabPanel>
      </TabPanels>
    </TabGroup>
  </div>
</template>

<script setup>
import { ref, defineModel, watchEffect, watch, reactive, onMounted, onUnmounted, computed } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import { GoogleMap, Polyline, Rectangle, AdvancedMarker } from 'vue3-google-map';

import FloatingButton from './components/FloatingButton.vue';
import ReportSheet from './components/ReportSheet.vue';
import HistoryModal from './components/HistoryModal.vue';
import HomeBaseList from './components/HomeBaseList.vue';
import StreetlightHeatmap from './components/StreetlightHeatmap.vue';
import { useConnectionMessage } from './composables/useConnectionMessage';
import { useHandleConnectionData } from './composables/useHandleConnectionData';

import { TabGroup, TabList, Tab, TabPanels, TabPanel } from '@headlessui/vue'

const ApiKey = import.meta.env.VITE_GOOGLE_API_KEY
const MapId = import.meta.env.VITE_GOOGLE_MAP_ID


const flightPlanCoordinates = [
  { lat: 37.772, lng: -122.214 },
  { lat: 21.291, lng: -157.821 },
  { lat: -18.142, lng: 178.431 },
  { lat: -27.467, lng: 153.027 },
]
const flightPath = {
  path: flightPlanCoordinates,
  geodesic: true,
  strokeColor: '#FF0000',
  strokeOpacity: 1.0,
  strokeWeight: 2,
}

const selectedTab = ref(0)

function changeTab(index) {
  selectedTab.value = index;
}

const center = reactive({ lat: 25.0376146, lng: 121.563844 });
const markerOptions = ref({ position: { lat: 25.0376146, lng: 121.563844 } })
const locationMap = ref(null);
const heatmapRef = ref(null);
const isPanning = ref(false);
const pathCoordinates = ref([]); // 儲存路徑座標
const gpsRecords = ref([]); // 儲存所有 GPS 紀錄
let gpsInterval = null; // 定時器
let simulationInterval = null; // 模擬定時器
const isSimulating = ref(false);
let simulationLat = 25.0376146; // 模擬起始緯度
let simulationLng = 121.563844; // 模擬起始經度
const isReportSheetOpen = ref(false); // 回報 Sheet 開啟狀態
const isHistoryModalOpen = ref(false); // 歷史記錄 Modal 開啟狀態
const reports = ref([]); // 儲存所有回報
const reportMarkers = ref([]); // 儲存標記引用
const isHeatmapVisible = ref(false); // 熱圖顯示狀態
const heatmapData = ref([]); // 熱圖數據
const homeBases = ref([
  { "id": 1762637482915, "name": "台大", "type": "school", "latitude": 25.0216891, "longitude": 121.5351162, "address": "", "notes": "", "emergencyContacts": [] },
  { "id": 1762637482915, "name": "台北火車站", "type": "work", "latitude": 25.048008, "longitude": 121.51705, "address": "", "notes": "", "emergencyContacts": [] }
]); // 儲存所有歸屬點
const waypointMarkers = ref([]); // 儲存 waypoint 標記

// 計算最近 10 筆紀錄
const recentGpsRecords = computed(() => {
  return gpsRecords.value.slice(-10).reverse();
});

// 載入路燈熱圖數據
const loadHeatmapData = async () => {
  try {
    const { createGridHeatmap } = await import('./utils/gridHeatmap');
    heatmapData.value = createGridHeatmap(100); // 使用 50 米網格
    console.log('Grid heatmap data loaded:', heatmapData.value.length, 'grid cells');
  } catch (error) {
    console.error('Error loading heatmap data:', error);
  }
};


const handleLocation = async (event) => {
  console.log('handleLocation')
  const result = JSON.parse(
    event.data
  );

  console.log('handleLocation', result)

  if (result.data.longitude && result.data.latitude) {
    const lat = result.data.latitude;
    const lng = result.data.longitude;

    // 設置 isPanning 避免觸發 mapCenterChanged
    isPanning.value = true;

    // 更新地圖中心點
    center.lat = lat;
    center.lng = lng;

    // 手動移動地圖到新位置
    if (locationMap.value && locationMap.value.map) {
      locationMap.value.map.panTo({ lat, lng });
    }

    // 添加到路徑座標陣列
    // pathCoordinates.value.push({ lat, lng });
    pathCoordinates.value = [
      ...pathCoordinates.value,
      { lat, lng }
    ]

    // 添加到 GPS 紀錄
    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    gpsRecords.value.push({
      index: gpsRecords.value.length + 1,
      lat: lat.toFixed(7),
      lng: lng.toFixed(7),
      time: timeString
    });

    const position = {
      lat,
      lng
    }
    markerOptions.value = { position }

    console.log('已添加路徑點:', { lat, lng, pathLength: pathCoordinates.value.length });
  }
};

// 每 10 秒請求 GPS 位置
onMounted(async () => {
  // 載入熱圖數據
  await loadHeatmapData();

  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");

  const requestOptions = {
    method: "GET",
    headers: myHeaders,
    redirect: "follow"
  };

  fetch("/api/map-points?is_safe=false", requestOptions)
    .then((response) => response.json())
    .then((result) => {
      console.log('Obstacles data:', result);
      const { data } = result;

      // 將障礙物數據轉換為 reports 格式並顯示在地圖上
      if (data && Array.isArray(data)) {
        // 創建一個用於追蹤的臨時陣列
        const obstacleReports = data.map((obstacle) => ({
          id: obstacle.id,
          status: obstacle.metadata?.obstacle_type || 'other',
          latitude: parseFloat(obstacle.latitude),
          longitude: parseFloat(obstacle.longitude),
          notes: obstacle.description || `${obstacle.name}`,
          address: obstacle.address || '',
          timestamp: obstacle.created_at,
          position: {
            lat: parseFloat(obstacle.latitude),
            lng: parseFloat(obstacle.longitude)
          }
        }));

        // 添加到 reports 列表
        reports.value.push(...obstacleReports);

        // 開發環境：添加假的 bad point 數據進行測試
        if (import.meta.env.DEV) {
          console.log('🔧 開發模式：添加假的 bad point 數據');
          const fakeBadPoints = [
            {
              id: 'fake-1',
              status: 'pothole',
              latitude: 25.0380,
              longitude: 121.5640,
              notes: '測試坑洞 - 開發環境假資料',
              address: '台北市中正區',
              timestamp: new Date().toISOString(),
              position: { lat: 25.0380, lng: 121.5640 }
            },
            {
              id: 'fake-2',
              status: 'construction',
              latitude: 25.0370,
              longitude: 121.5645,
              notes: '測試施工區 - 開發環境假資料',
              address: '台北市中正區',
              timestamp: new Date().toISOString(),
              position: { lat: 25.0370, lng: 121.5645 }
            },
            {
              id: 'fake-3',
              status: 'flooding',
              latitude: 25.0385,
              longitude: 121.5635,
              notes: '測試淹水區 - 開發環境假資料',
              address: '台北市中正區',
              timestamp: new Date().toISOString(),
              position: { lat: 25.0385, lng: 121.5635 }
            },
            {
              id: 'fake-4',
              status: 'accident',
              latitude: 25.0375,
              longitude: 121.5650,
              notes: '測試事故 - 開發環境假資料',
              address: '台北市中正區',
              timestamp: new Date().toISOString(),
              position: { lat: 25.0375, lng: 121.5650 }
            },
            {
              id: 'fake-5',
              status: 'other',
              latitude: 25.0365,
              longitude: 121.5630,
              notes: '測試其他障礙 - 開發環境假資料',
              address: '台北市中正區',
              timestamp: new Date().toISOString(),
              position: { lat: 25.0365, lng: 121.5630 }
            }
          ];

          reports.value.push(...fakeBadPoints);
          console.log('✅ 已添加', fakeBadPoints.length, '個假的 bad points');
        }

        // 等待地圖準備好後創建標記
        let attempts = 0;
        const maxAttempts = 50;

        const createMarkersWhenReady = () => {
          attempts++;

          if (locationMap.value?.map && window.google) {
            console.log('Map is ready, creating markers for', reports.value.length, 'reports (including fake data in dev mode)');
            // 為所有報告創建標記（包含真實數據和開發環境的假數據）
            reports.value.forEach((report) => {
              const markerData = createMapMarker(report);
              if (markerData) {
                reportMarkers.value.push(markerData);
              }
            });
            console.log('Total markers created:', reportMarkers.value.length);
          } else if (attempts < maxAttempts) {
            // 如果地圖還沒準備好，等待 100ms 後重試
            console.log(`Waiting for map to be ready... (attempt ${attempts}/${maxAttempts})`);
            setTimeout(createMarkersWhenReady, 100);
          } else {
            console.error('Timeout: Map did not become ready after 5 seconds');
          }
        };

        createMarkersWhenReady();
      }
    })
    .catch((error) => console.error('Error fetching obstacles:', error));

  // 立即請求一次
  useConnectionMessage('location', null);

  // 設置定時器每 10 秒請求一次
  // gpsInterval = setInterval(() => {
  //   console.log('定時請求 GPS 位置...');
  //   useConnectionMessage('location', null);
  // }, 10000); // 10000 毫秒 = 10 秒
});

// 創建 waypoint 標記
const createWaypointMarker = (waypoint) => {
  if (!locationMap.value?.map || !window.google) {
    console.warn('Map not ready for waypoint marker creation');
    return null;
  }

  try {
    const map = locationMap.value.map;

    // 根據類型選擇樣式
    let color, title, label;
    switch (waypoint.type) {
      case 'start':
        // 藍色 - 起點，顯示「起」
        color = '#0074c2';
        title = '起點';
        label = '起';
        break;
      case 'end':
        // 紅色 - 終點，顯示「終」
        color = '#F44336';
        title = '終點';
        label = '終';
        break;
      case 'safe_point':
        // 綠色 - 安全點，顯示「安」
        color = '#00c26e';
        title = '安全點';
        label = '安';
        break;
      default:
        color = '#9E9E9E';
        title = '位置點';
        label = '•';
    }

    // 信息窗口內容
    const infoContent = `
      <div style="padding: 12px; font-size: 13px; min-width: 200px; font-family: system-ui, -apple-system, sans-serif;">
        <strong style="color: ${color}; font-size: 14px;">${title}</strong><br>
        <strong>名稱：</strong> ${waypoint.name || '未命名'}<br>
        ${waypoint.description ? `<strong>描述：</strong> ${waypoint.description}<br>` : ''}
        <strong>位置：</strong> ${waypoint.latitude.toFixed(7)}, ${waypoint.longitude.toFixed(7)}<br>
        <strong>類型：</strong> ${waypoint.type}
      </div>
    `;

    const infowindow = new google.maps.InfoWindow({
      content: infoContent
    });

    // 建立標記 - 使用自訂圖標和文字標籤
    const marker = new google.maps.Marker({
      position: {
        lat: parseFloat(waypoint.latitude),
        lng: parseFloat(waypoint.longitude)
      },
      map: map,
      title: waypoint.name || title,
      label: {
        text: label,
        color: '#FFFFFF',
        fontSize: '16px',
        fontWeight: 'bold'
      },
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 14,
        fillColor: color,
        fillOpacity: 0.9,
        strokeColor: '#FFFFFF',
        strokeWeight: 3
      },
      clickable: true
    });

    // 點擊標記顯示信息窗口
    marker.addListener('click', () => {
      // 關閉其他打開的窗口
      waypointMarkers.value.forEach((markerInfo) => {
        if (markerInfo && markerInfo.infowindow && markerInfo.infowindow !== infowindow) {
          markerInfo.infowindow.close();
        }
      });
      // 打開當前窗口
      infowindow.open(map, marker);
    });

    console.log('Waypoint marker created:', waypoint.name, waypoint.latitude, waypoint.longitude);
    return { marker, infowindow, waypoint };
  } catch (error) {
    console.error('Error creating waypoint marker:', error);
    return null;
  }
};

const draw = (startLat, startLng, endLat, endLng) => {
  console.log('🎨 draw() 被調用，參數:', { startLat, startLng, endLat, endLng });

  // 如果沒有提供參數，使用預設值（台北車站到台大體育場）
  const actualStartLat = startLat !== undefined ? startLat : 25.048008;
  const actualStartLng = startLng !== undefined ? startLng : 121.51705;
  const actualEndLat = endLat !== undefined ? endLat : 25.0216891;
  const actualEndLng = endLng !== undefined ? endLng : 121.5351162;

  console.log('🗺️ 最終使用的座標 - 起點:', actualStartLat, actualStartLng, '終點:', actualEndLat, actualEndLng);

  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");

  const raw = JSON.stringify({
    "start": {
      "latitude": actualStartLat,
      "longitude": actualStartLng
    },
    "end": {
      "latitude": actualEndLat,
      "longitude": actualEndLng
    }
  });

  console.log('📤 發送給 API 的請求:', raw);

  const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: raw,
    redirect: "follow"
  };

  // 清除之前的 waypoint 標記
  waypointMarkers.value.forEach(markerInfo => {
    if (markerInfo && markerInfo.marker) {
      markerInfo.marker.setMap(null);
    }
  });
  waypointMarkers.value = [];

  // 清除之前的報告標記
  reportMarkers.value.forEach(markerInfo => {
    if (markerInfo && markerInfo.marker) {
      markerInfo.marker.setMap(null);
    }
  });
  reportMarkers.value = [];

  // 清除之前的路徑
  pathCoordinates.value = [];

  fetch("/api/routes/safe-route", requestOptions)
    .then((response) => response.json())
    .then((result) => {
      console.log('📥 API 返回的完整結果:', result);
      const { route } = result;
      const { waypoints } = route;
      console.log('🚩 API 返回的 waypoints:', waypoints)

      // 繪製路線
      if (route) {
        const { geometry } = route;
        const { coordinates } = geometry;
        console.log('Route coordinates:', coordinates);

        for (let i = 0; i < coordinates.length; i += 1) {
          pathCoordinates.value = [
            ...pathCoordinates.value,
            { lat: coordinates[i][1], lng: coordinates[i][0] }
          ]
        }
      }

      // 創建 waypoint 標記
      if (waypoints && Array.isArray(waypoints)) {
        console.log('Creating waypoint markers:', waypoints.length);
        waypoints.forEach(waypoint => {
          const markerData = createWaypointMarker(waypoint);
          if (markerData) {
            waypointMarkers.value.push(markerData);
          }
        });

        // 重新創建報告標記
        reports.value.forEach(report => {
          const markerData = createMapMarker(report);
          if (markerData) {
            reportMarkers.value.push(markerData);
          }
        });

        // 調整地圖視圖以顯示所有標記
        if (waypointMarkers.value.length > 0 && locationMap.value?.map) {
          const bounds = new google.maps.LatLngBounds();
          waypointMarkers.value.forEach(markerInfo => {
            const position = markerInfo.marker.getPosition();
            bounds.extend(position);
          });
          locationMap.value.map.fitBounds(bounds);
        }
      }
    })
    .catch((error) => console.error('Error fetching route:', error));
}

// 清理定時器
onUnmounted(() => {
  if (gpsInterval) {
    clearInterval(gpsInterval);
    gpsInterval = null;
  }
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
  }
});

// 模擬 GPS 位置移動（向東）
const addSimulatedPoint = () => {
  // 向東移動：經度增加約 0.0001 度（約 10 公尺）
  simulationLng += 0.0001;
  // 稍微變化緯度，讓路徑不是完全直線
  simulationLat += (Math.random() - 0.5) * 0.00002;

  const lat = simulationLat;
  const lng = simulationLng;

  // 設置 isPanning 避免觸發 mapCenterChanged
  isPanning.value = true;

  // 更新地圖中心點
  center.lat = lat;
  center.lng = lng;

  // 手動移動地圖到新位置
  if (locationMap.value && locationMap.value.map) {
    locationMap.value.map.panTo({ lat, lng });
  }

  // 添加到路徑座標陣列
  pathCoordinates.value.push({ lat, lng });

  // 添加到 GPS 紀錄
  const now = new Date();
  const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
  gpsRecords.value.push({
    index: gpsRecords.value.length + 1,
    lat: lat.toFixed(7),
    lng: lng.toFixed(7),
    time: timeString
  });

  console.log('模擬路徑點:', { lat, lng, pathLength: pathCoordinates.value.length });
};

// 開始模擬
const startSimulation = () => {
  if (isSimulating.value) return;

  isSimulating.value = true;

  // 如果沒有路徑，從初始位置開始
  if (pathCoordinates.value.length === 0) {
    simulationLat = 25.0376146;
    simulationLng = 121.563844;
  } else {
    // 從最後一個點繼續
    const lastPoint = pathCoordinates.value[pathCoordinates.value.length - 1];
    simulationLat = lastPoint.lat;
    simulationLng = lastPoint.lng;
  }

  // 立即添加第一個點
  addSimulatedPoint();

  // 每 2 秒添加一個新點
  simulationInterval = setInterval(() => {
    addSimulatedPoint();
  }, 2000);

  console.log('開始向東模擬移動');
};

// 停止模擬
const stopSimulation = () => {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
  }
  isSimulating.value = false;
  console.log('停止模擬');
};

// 清除路徑
const clearPath = () => {
  pathCoordinates.value = [];
  gpsRecords.value = [];
  simulationLat = 25.0376146;
  simulationLng = 121.563844;
  center.lat = 25.0376146;
  center.lng = 121.563844;
  console.log('已清除所有路徑');
};

// 開啟回報表單
const openReportSheet = () => {
  isReportSheetOpen.value = true;
};

// 關閉回報表單
const closeReportSheet = () => {
  isReportSheetOpen.value = false;
};

// 直接在地圖上創建標記
const createMapMarker = (report) => {
  if (!locationMap.value?.map || !window.google) {
    console.warn('Map not ready for marker creation');
    return null;
  }

  try {
    const map = locationMap.value.map;

    // 信息窗口內容
    const infoContent = `
      <div style="padding: 12px; font-size: 13px; min-width: 200px; font-family: system-ui, -apple-system, sans-serif;">
        <strong style="color: #FF0000; font-size: 14px;">狀況：${getStatusLabel(report.status)}</strong><br>
        <strong>位置：</strong> ${report.latitude.toFixed(7)}, ${report.longitude.toFixed(7)}<br>
        <strong>時間：</strong> ${new Date(report.timestamp).toLocaleString('zh-TW')}<br>
        ${report.notes ? `<strong>備註：</strong> ${report.notes}` : ''}
      </div>
    `;

    const infowindow = new google.maps.InfoWindow({
      content: infoContent
    });

    // 建立標記
    const marker = new google.maps.Marker({
      position: {
        lat: parseFloat(report.latitude),
        lng: parseFloat(report.longitude)
      },
      map: map,
      title: `${getStatusLabel(report.status)} - ${new Date(report.timestamp).toLocaleTimeString('zh-TW')}`,
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
      // 關閉其他打開的窗口
      reportMarkers.value.forEach((markerInfo) => {
        if (markerInfo && markerInfo.infowindow && markerInfo.infowindow !== infowindow) {
          markerInfo.infowindow.close();
        }
      });
      // 打開當前窗口
      infowindow.open(map, marker);
    });

    console.log('Marker created at', report.latitude, report.longitude);
    return { marker, infowindow };
  } catch (error) {
    console.error('Error creating marker:', error);
    return null;
  }
};

// 處理回報提交
const handleReportSubmit = (report) => {
  console.log('收到回報：', report);

  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: JSON.stringify({
      "latitude": report.latitude,
      "longitude": report.longitude,
      "address": "",
      "obstacle_type": report.status,
      "description": report.notes
    }),
    redirect: "follow"
  };

  fetch("/api/map-points/report-obstacle", requestOptions)
    .then((response) => response.json())
    .then((result) => {
      console.log('Route result:', result)
    })

  // 保存報告到前端存儲
  const reportWithId = {
    id: Date.now(),
    ...report,
    position: {
      lat: report.latitude,
      lng: report.longitude
    }
  };
  reports.value.push(reportWithId);

  // 直接在地圖上創建標記
  const markerData = createMapMarker(reportWithId);
  if (markerData) {
    reportMarkers.value.push(markerData);
  }

  // 顯示確認訊息
  alert(`已回報狀況：${getStatusLabel(report.status)}\n位置：${report.latitude.toFixed(7)}, ${report.longitude.toFixed(7)}`);
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

// 開啟歷史記錄 Modal
const openHistoryModal = () => {
  isHistoryModalOpen.value = true;
};

// 關閉歷史記錄 Modal
const closeHistoryModal = () => {
  isHistoryModalOpen.value = false;
};

// 處理在地圖上查看報告
const handleViewOnMap = (report) => {
  // 將地圖中心移動到報告位置
  center.lat = report.latitude;
  center.lng = report.longitude;

  if (locationMap.value && locationMap.value.map) {
    locationMap.value.map.panTo({
      lat: report.latitude,
      lng: report.longitude
    });
    locationMap.value.map.setZoom(18);
  }

  // 打開該報告的信息窗口
  const markerInfo = reportMarkers.value.find(m => m.marker.title && m.marker.title.includes(new Date(report.timestamp).toLocaleTimeString('zh-TW')));
  if (markerInfo && markerInfo.infowindow) {
    markerInfo.infowindow.open(locationMap.value.map, markerInfo.marker);
  }
};

// 處理刪除報告
const handleDeleteReport = (reportId) => {
  const index = reports.value.findIndex(r => r.id === reportId);
  if (index !== -1) {
    const report = reports.value[index];

    // 移除標記
    const markerIndex = reportMarkers.value.findIndex(m => {
      return m.marker.getTitle().includes(new Date(report.timestamp).toLocaleTimeString('zh-TW'));
    });

    if (markerIndex !== -1) {
      reportMarkers.value[markerIndex].marker.setMap(null);
      reportMarkers.value.splice(markerIndex, 1);
    }

    // 移除報告
    reports.value.splice(index, 1);
    console.log('已刪除報告:', reportId);
  }
};

// 處理清除所有歷史記錄
const handleClearHistory = () => {
  // 清除所有標記
  reportMarkers.value.forEach(markerInfo => {
    if (markerInfo && markerInfo.marker) {
      markerInfo.marker.setMap(null);
    }
  });

  reportMarkers.value = [];
  reports.value = [];
  console.log('已清除所有回報記錄');
};

// 從顏色字符串提取 RGB 值用於邊框
const parseColorValue = (colorStr) => {
  // 從 rgba 或 rgb 字符串中提取 RGB 值
  if (colorStr.includes('rgba')) {
    return colorStr.replace(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)/, 'rgb($1, $2, $3)');
  }
  return colorStr;
};

// 顯示網格信息
const showGridInfo = (cell) => {
  if (!window.google) return;

  const map = locationMap.value?.map;
  if (!map) return;

  const wattLabel = cell.totalWatt <= 5 ? '紅(1-5W)' : cell.totalWatt <= 10 ? '黃(6-10W)' : '綠(11+W)';

  const infoContent = `
    <div style="padding: 12px; font-size: 13px; font-family: system-ui, -apple-system, sans-serif;">
      <strong style="color: #333; font-size: 14px;">網格信息</strong><br>
      <strong>顏色等級：</strong> ${wattLabel}<br>
      <strong>總功率：</strong> ${cell.totalWatt} W<br>
      <strong>路燈數：</strong> ${cell.count}<br>
      <strong>平均功率：</strong> ${cell.avgWatt.toFixed(2)} W<br>
      <strong>網格ID：</strong> ${cell.gridKey}
    </div>
  `;

  const infowindow = new google.maps.InfoWindow({
    content: infoContent,
    position: {
      lat: (cell.bounds.north + cell.bounds.south) / 2,
      lng: (cell.bounds.east + cell.bounds.west) / 2
    }
  });

  infowindow.open(map);
};


// 歸屬點管理方法
const handleAddBase = (baseData) => {
  const newBase = {
    id: baseData.id || Date.now(),
    ...baseData,
    emergencyContacts: []
  };
  homeBases.value.push(newBase);
  console.log('新增歸屬點:', newBase);
};

const handleUpdateBase = (baseData) => {
  const index = homeBases.value.findIndex(b => b.id === baseData.id);
  if (index !== -1) {
    homeBases.value[index] = { ...homeBases.value[index], ...baseData };
    console.log('更新歸屬點:', baseData);
  }
};

const handleDeleteBase = (baseId) => {
  const index = homeBases.value.findIndex(b => b.id === baseId);
  if (index !== -1) {
    homeBases.value.splice(index, 1);
    console.log('刪除歸屬點:', baseId);
  }
};

const handleAddContact = ({ baseId, contact }) => {
  const base = homeBases.value.find(b => b.id === baseId);
  if (base) {
    if (!base.emergencyContacts) {
      base.emergencyContacts = [];
    }
    base.emergencyContacts.push(contact);
    console.log('新增緊急聯絡人:', contact, '至歸屬點:', baseId);
  }
};

const handleRemoveContact = ({ baseId, contactId }) => {
  const base = homeBases.value.find(b => b.id === baseId);
  if (base && base.emergencyContacts) {
    const index = base.emergencyContacts.findIndex(c => c.id === contactId);
    if (index !== -1) {
      base.emergencyContacts.splice(index, 1);
      console.log('移除緊急聯絡人:', contactId, '從歸屬點:', baseId);
    }
  }
};

// 處理啟程 - 獲取安全路線並顯示
const handleStartDeparture = (base) => {
  console.log('🚀 啟程前往:', base.name, '位置:', base.latitude, base.longitude);
  console.log('📍 當前 center 值:', center.lat, center.lng);

  // 立即保存當前位置作為起點（在任何可能改變 center 的操作之前）
  const startLat = center.lat;
  const startLng = center.lng;

  // 設定目標位置為歸屬點
  const targetLat = base.latitude;
  const targetLng = base.longitude;

  console.log('✅ 已保存起點座標:', startLat, startLng);
  console.log('🎯 目標座標:', targetLat, targetLng);

  // 切換到「路況資訊」標籤頁
  selectedTab.value = 0;
  console.log('📑 已切換到路況資訊標籤');

  // 調用安全路徑規劃 API（使用保存的起點座標）
  console.log('🛣️ 即將調用 draw() - 起點:', startLat, startLng, '終點:', targetLat, targetLng);
  draw(startLat, startLng, targetLat, targetLng);

  // 顯示通知
  alert(`規劃前往 ${base.name} 的安全路徑\n起點: ${startLat.toFixed(6)}, ${startLng.toFixed(6)}\n終點: ${base.latitude.toFixed(6)}, ${base.longitude.toFixed(6)}`);
};

const mapCenterChanged = useDebounceFn(async () => {
  console.log('mapCenterChanged...')
  if (locationMap.value) {
    if (isPanning.value) {
      isPanning.value = false;
      return;
    }

    const gmap = locationMap.value.map;
    const newCenter = gmap.getCenter();
    const lat = parseFloat(newCenter.lat().toFixed(7));
    const lng = parseFloat(newCenter.lng().toFixed(7));

    // const { data } = await axios.get(
    //   `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=`
    // );

    center.lat = lat;
    center.lng = lng;

    // markerOptions.value = position

    // if (data.results.length) {
    //   center.lat = lat;
    //   center.lng = lng;
    //   addressText.value = data.results[0]?.formatted_address;
    // } else {
    //   isNoResultModalShow.value = true;
    // }
  }
}, 1000);



useConnectionMessage('location', null);
useHandleConnectionData(handleLocation);
</script>

<style scoped>
.button-icon {
  width: 28px;
  height: 28px;
}

.controls {
  display: flex;
  gap: 10px;
  width: 500px;
}

.sim-button {
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  flex: 1;
}

.sim-button:not(:disabled) {
  background: #FF0000;
  color: white;
}

.sim-button:not(:disabled):hover {
  background: #cc0000;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(255, 0, 0, 0.3);
}

.sim-button:disabled {
  background: #ccc;
  color: #666;
  cursor: not-allowed;
}

.sim-button.stop:not(:disabled) {
  background: #ff9800;
}

.sim-button.stop:not(:disabled):hover {
  background: #e68900;
  box-shadow: 0 4px 8px rgba(255, 152, 0, 0.3);
}

.sim-button.clear:not(:disabled) {
  background: #555;
}

.sim-button.clear:not(:disabled):hover {
  background: #333;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.debug-info {
  width: 500px;
  background: #e3f2fd;
  padding: 10px 15px;
  border-radius: 6px;
  font-size: 14px;
  color: #1976d2;
}

.debug-info p {
  margin: 5px 0;
}

.gps-records {
  width: 500px;
  background: #f5f5f5;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.gps-records h3 {
  margin: 0 0 15px 0;
  font-size: 18px;
  color: #333;
  border-bottom: 2px solid #FF0000;
  padding-bottom: 8px;
}

.no-records {
  text-align: center;
  color: #999;
  padding: 20px;
  font-size: 14px;
}

.records-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.record-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 10px 12px;
  border-radius: 6px;
  border-left: 3px solid #FF0000;
  font-size: 14px;
}

.record-index {
  font-weight: bold;
  color: #FF0000;
  min-width: 40px;
}

.record-coords {
  flex: 1;
  color: #555;
  font-family: monospace;
}

.record-time {
  color: #888;
  font-size: 13px;
  min-width: 70px;
  text-align: right;
}
</style>