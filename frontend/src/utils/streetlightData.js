import streetlightJSON from '../assets/converted_data.json';

/**
 * 處理路燈數據，轉換為地圖熱圖格式
 */
export const processStreetlightData = () => {
  if (!Array.isArray(streetlightJSON)) {
    console.error('Invalid streetlight data format');
    return [];
  }

  // 檢查 google.maps.LatLng 是否可用
  if (!window.google || !window.google.maps || !window.google.maps.LatLng) {
    console.warn('Google Maps LatLng not available, returning raw coordinates');
    return streetlightJSON.map((light) => ({
      location: {
        lat: parseFloat(light.WGS84Lat),
        lng: parseFloat(light.WGS84Lon)
      },
      weight: calculateWeight(light),
      raw: light
    }));
  }

  return streetlightJSON.map((light) => ({
    location: new google.maps.LatLng(
      parseFloat(light.WGS84Lat),
      parseFloat(light.WGS84Lon)
    ),
    weight: calculateWeight(light),
    raw: light
  }));
};

/**
 * 根據燈泡功率和數量計算權重
 * 權重越高，熱圖顏色越深
 */
const calculateWeight = (light) => {
  let totalWatt = 0;

  // 遍歷所有燈泡種類並累加功率
  for (let i = 1; i <= 5; i++) {
    const wattKey = `LightWatt${i}`;
    if (light[wattKey]) {
      totalWatt += parseInt(light[wattKey]) || 0;
    }
  }

  // 根據數量和功率計算權重
  const quantity = parseInt(light.Quantity) || 1;
  return (totalWatt * quantity) / 100; // 正規化
};

/**
 * 獲取按區域分組的路燈數據
 */
export const groupStreetlightsByDistrict = () => {
  const grouped = {};

  streetlightJSON.forEach((light) => {
    const dist = light.Dist || '未知';
    if (!grouped[dist]) {
      grouped[dist] = [];
    }
    grouped[dist].push(light);
  });

  return grouped;
};

/**
 * 獲取統計信息
 */
export const getStreetlightStats = () => {
  let totalLights = 0;
  let totalWatt = 0;
  const districtStats = {};

  streetlightJSON.forEach((light) => {
    const quantity = parseInt(light.Quantity) || 1;
    totalLights += quantity;

    let lightWatt = 0;
    for (let i = 1; i <= 5; i++) {
      const wattKey = `LightWatt${i}`;
      if (light[wattKey]) {
        lightWatt += parseInt(light[wattKey]) || 0;
      }
    }
    totalWatt += lightWatt * quantity;

    // 按區域統計
    const dist = light.Dist || '未知';
    if (!districtStats[dist]) {
      districtStats[dist] = { count: 0, watt: 0 };
    }
    districtStats[dist].count += quantity;
    districtStats[dist].watt += lightWatt * quantity;
  });

  return {
    totalLights,
    totalWatt,
    averageWatt: totalWatt / totalLights,
    districtStats
  };
};

/**
 * 獲取路燈信息詳情
 */
export const getLightDetails = (light) => {
  const lights = [];
  for (let i = 1; i <= 5; i++) {
    const kindKey = `LightKind${i}`;
    const wattKey = `LightWatt${i}`;
    if (light[kindKey]) {
      lights.push({
        kind: light[kindKey],
        watt: light[wattKey] || '未知'
      });
    }
  }

  return {
    serialNumber: light.SerialNumber,
    district: light.Dist,
    quantity: light.Quantity,
    lights: lights,
    height: light.LightHeight,
    year: light.LightYear,
    latitude: light.WGS84Lat,
    longitude: light.WGS84Lon,
    updDate: light.UpdDate
  };
};
