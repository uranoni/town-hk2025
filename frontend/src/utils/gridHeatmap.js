import streetlightJSON from '../assets/converted_data.json';

// 地球半径（米）
const EARTH_RADIUS = 6371000;

/**
 * 將經緯度轉換為米
 * @param {number} lat - 緯度
 * @param {number} lng - 經度
 * @returns {Object} { x, y } 單位為米
 */
const latLngToMeters = (lat, lng) => {
  const x = lng * (EARTH_RADIUS * Math.PI / 180);
  const y = Math.log(Math.tan((90 + lat) * Math.PI / 360)) * EARTH_RADIUS;
  return { x, y };
};

/**
 * 將米轉換回經緯度
 * @param {number} x - X座標（米）
 * @param {number} y - Y座標（米）
 * @returns {Object} { lat, lng }
 */
const metersToLatLng = (x, y) => {
  const lng = x / (EARTH_RADIUS * Math.PI / 180);
  const lat = (2 * Math.atan(Math.exp(y / EARTH_RADIUS)) - Math.PI / 2) * 180 / Math.PI;
  return { lat, lng };
};

/**
 * 根據網格大小生成網格鍵
 * @param {number} lat - 緯度
 * @param {number} lng - 經度
 * @param {number} gridSizeMeters - 網格大小（米）
 * @returns {string} 網格鍵
 */
const getGridKey = (lat, lng, gridSizeMeters) => {
  const { x, y } = latLngToMeters(lat, lng);
  const gridX = Math.floor(x / gridSizeMeters);
  const gridY = Math.floor(y / gridSizeMeters);
  return `${gridX},${gridY}`;
};

/**
 * 獲取網格的中心點
 * @param {string} gridKey - 網格鍵
 * @param {number} gridSizeMeters - 網格大小（米）
 * @returns {Object} { lat, lng } 網格中心點
 */
const getGridCenter = (gridKey, gridSizeMeters) => {
  const [gridX, gridY] = gridKey.split(',').map(Number);
  const x = (gridX + 0.5) * gridSizeMeters;
  const y = (gridY + 0.5) * gridSizeMeters;
  return metersToLatLng(x, y);
};

/**
 * 計算路燈功率
 */
const calculateLightWatt = (light) => {
  let totalWatt = 0;
  for (let i = 1; i <= 5; i++) {
    const wattKey = `LightWatt${i}`;
    if (light[wattKey]) {
      totalWatt += parseInt(light[wattKey]) || 0;
    }
  }
  return totalWatt * (parseInt(light.Quantity) || 1);
};

/**
 * 根據功率獲取顏色
 * @param {number} watt - 總功率
 * @returns {string} RGB顏色字符串
 */
const getColorByWatt = (watt) => {
  // 0: 透明
  // 1-5: 紅色 rgba(255, 0, 0, 0.4)
  // 6-10: 黃色 rgba(255, 255, 0, 0.6)
  // 11+: 綠色 rgba(0, 255, 0, 0.8)

  if (watt === 0) {
    return 'rgba(0, 0, 0, 0)'; // 透明
  } else if (watt <= 5) {
    return 'rgba(255, 0, 0, 0.4)'; // 紅色
  } else if (watt <= 10) {
    return 'rgba(255, 255, 0, 0.6)'; // 黃色
  } else {
    return 'rgba(0, 255, 0, 0.8)'; // 綠色
  }
};

/**
 * 創建網格熱圖數據
 * @param {number} gridSizeMeters - 網格大小（默認 50 米）
 * @returns {Array} 網格數據陣列
 */
export const createGridHeatmap = (gridSizeMeters = 50) => {
  const gridMap = new Map();

  // 分組路燈到網格中
  streetlightJSON.forEach((light) => {
    const lat = parseFloat(light.WGS84Lat);
    const lng = parseFloat(light.WGS84Lon);
    const watt = calculateLightWatt(light);

    const gridKey = getGridKey(lat, lng, gridSizeMeters);

    if (!gridMap.has(gridKey)) {
      gridMap.set(gridKey, {
        totalWatt: 0,
        count: 0,
        lights: []
      });
    }

    const gridData = gridMap.get(gridKey);
    gridData.totalWatt += watt;
    gridData.count += 1;
    gridData.lights.push(light);
  });

  // 轉換為矩形陣列
  const rectangles = [];
  gridMap.forEach((data, gridKey) => {
    const center = getGridCenter(gridKey, gridSizeMeters);
    const halfSize = gridSizeMeters / 2 / EARTH_RADIUS * 180 / Math.PI;

    const bounds = {
      north: center.lat + halfSize,
      south: center.lat - halfSize,
      east: center.lng + halfSize,
      west: center.lng - halfSize
    };

    rectangles.push({
      bounds,
      totalWatt: data.totalWatt,
      count: data.count,
      avgWatt: data.totalWatt / data.count,
      color: getColorByWatt(data.totalWatt),
      gridKey
    });
  });

  return rectangles;
};

/**
 * 獲取網格統計信息
 */
export const getGridStats = (gridSizeMeters = 50) => {
  const gridMap = new Map();

  streetlightJSON.forEach((light) => {
    const lat = parseFloat(light.WGS84Lat);
    const lng = parseFloat(light.WGS84Lon);
    const watt = calculateLightWatt(light);

    const gridKey = getGridKey(lat, lng, gridSizeMeters);

    if (!gridMap.has(gridKey)) {
      gridMap.set(gridKey, { totalWatt: 0, count: 0 });
    }

    const gridData = gridMap.get(gridKey);
    gridData.totalWatt += watt;
    gridData.count += 1;
  });

  const stats = {
    totalGrids: gridMap.size,
    gridsWithLights: 0,
    totalWatt: 0,
    avgWattPerGrid: 0,
    distribution: {
      transparent: 0,
      red: 0,
      yellow: 0,
      green: 0
    }
  };

  gridMap.forEach((data) => {
    stats.totalWatt += data.totalWatt;
    stats.gridsWithLights += 1;

    if (data.totalWatt === 0) {
      stats.distribution.transparent += 1;
    } else if (data.totalWatt <= 5) {
      stats.distribution.red += 1;
    } else if (data.totalWatt <= 10) {
      stats.distribution.yellow += 1;
    } else {
      stats.distribution.green += 1;
    }
  });

  stats.avgWattPerGrid = stats.gridsWithLights > 0
    ? (stats.totalWatt / stats.gridsWithLights).toFixed(0)
    : 0;

  return stats;
};
