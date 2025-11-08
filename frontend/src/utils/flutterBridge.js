// utils/flutterBridge.js

export class FlutterBridge {
  /**
   * 向 Flutter 發送消息（修正版）
   * @param {string} handlerName - Handler 名稱
   * @param {any} data - 要傳送的數據
   * @returns {Promise} 返回 Flutter 的回應
   */
  static async sendMessage(handlerName, data = null) {
    return new Promise((resolve, reject) => {
      try {
        // 檢查是否在 Flutter WebView 環境中
        if (!window.flutterObject) {
          reject(new Error('Not in Flutter WebView environment'));
          return;
        }

        // 構建消息格式
        const message = {
          name: handlerName,
          data: data
        };

        // 將消息轉為 JSON 字串
        const messageString = JSON.stringify(message);

        // 創建一個唯一的回調函數名稱
        const callbackName = `flutterCallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // 設置回調函數
        window[callbackName] = function(response) {
          try {
            // 清理回調函數
            delete window[callbackName];
            
            // 解析回應
            if (response) {
              let result;
              if (typeof response === 'string') {
                try {
                  result = JSON.parse(response);
                } catch {
                  result = response;
                }
              } else {
                result = response;
              }
              
              // 檢查是否有 data 屬性
              if (result && typeof result === 'object' && 'data' in result) {
                resolve(result.data);
              } else {
                resolve(result);
              }
            } else {
              resolve(null);
            }
          } catch (error) {
            reject(error);
          }
        };

        // 發送消息
        window.flutterObject.postMessage(messageString);
        
        // 設置超時
        setTimeout(() => {
          if (window[callbackName]) {
            delete window[callbackName];
            reject(new Error('Request timeout'));
          }
        }, 10000); // 10秒超時

      } catch (error) {
        console.error('sendMessage error:', error);
        reject(error);
      }
    });
  }

  /**
   * 取得 GPS 位置
   */
  static async getLocation() {
    try {
      const result = await this.sendMessage('location');
      
      console.log('GPS 原始回應:', result);
      
      // 檢查是否為空陣列（權限被拒絕或錯誤）
      if (Array.isArray(result) && result.length === 0) {
        throw new Error('無法取得位置資訊，可能是權限被拒絕');
      }

      // 檢查是否為 null
      if (!result) {
        throw new Error('無法取得位置資訊');
      }

      return {
        latitude: result.latitude,
        longitude: result.longitude,
        accuracy: result.accuracy,
        altitude: result.altitude,
        heading: result.heading,
        speed: result.speed,
        timestamp: result.timestamp,
        floor: result.floor,
        speedAccuracy: result.speedAccuracy,
        altitudeAccuracy: result.altitudeAccuracy,
        headingAccuracy: result.headingAccuracy
      };
    } catch (error) {
      console.error('取得 GPS 失敗:', error);
      throw error;
    }
  }

  /**
   * 取得使用者資訊
   */
  static async getUserInfo() {
    return await this.sendMessage('userinfo');
  }

  /**
   * 啟動地圖
   */
  static async launchMap(mapUrl) {
    return await this.sendMessage('launch_map', mapUrl);
  }

  /**
   * 撥打電話
   */
  static async phoneCall(phoneNumber) {
    return await this.sendMessage('phone_call', phoneNumber);
  }

  /**
   * 取得裝置資訊
   */
  static async getDeviceInfo() {
    return await this.sendMessage('deviceinfo');
  }

  /**
   * 開啟連結
   */
  static async openLink(url) {
    return await this.sendMessage('open_link', url);
  }

  /**
   * 發送通知
   */
  static async notify(title, content) {
    return await this.sendMessage('notify', {
      title: title,
      content: content
    });
  }

  /**
   * 掃描 QR Code
   */
  static async scanQRCode() {
    return await this.sendMessage('qr_code_scan');
  }

  /**
   * 檢查是否在 Flutter WebView 環境中
   */
  static isFlutterWebView() {
    return typeof window.flutterObject !== 'undefined';
  }
}