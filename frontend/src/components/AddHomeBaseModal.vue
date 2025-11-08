<template>
  <Transition name="modal">
    <div v-if="isOpen" class="modal-overlay" @click="closeModal">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h2>{{ editData ? '編輯歸屬點' : '新增歸屬點' }}</h2>
          <button class="close-btn" @click="closeModal">✕</button>
        </div>

        <div class="modal-content">
          <!-- 名稱 -->
          <div class="form-group">
            <label for="base-name" class="form-label">名稱 *</label>
            <input id="base-name" v-model="formData.name" type="text" class="form-input"
              placeholder="例：家、辦公室" required />
          </div>

          <!-- 類型 -->
          <div class="form-group">
            <label for="base-type" class="form-label">類型 *</label>
            <select id="base-type" v-model="formData.type" class="form-select" required>
              <option value="">-- 請選擇 --</option>
              <option value="home">家</option>
              <option value="work">工作</option>
              <option value="school">學校</option>
              <option value="other">其他</option>
            </select>
          </div>

          <!-- 座標輸入或地圖選擇 -->
          <div class="form-group">
            <label class="form-label">位置 *</label>
            <div class="location-input-group">
              <div class="coord-inputs">
                <div class="coord-field">
                  <label for="latitude" class="small-label">緯度</label>
                  <input id="latitude" v-model.number="formData.latitude" type="number" class="form-input small"
                    placeholder="25.0376" step="0.0001" required />
                </div>
                <div class="coord-field">
                  <label for="longitude" class="small-label">經度</label>
                  <input id="longitude" v-model.number="formData.longitude" type="number" class="form-input small"
                    placeholder="121.5638" step="0.0001" required />
                </div>
              </div>
              <button type="button" class="location-btn" @click="$emit('useCurrentLocation')" title="使用目前位置">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="1" />
                  <path d="M12 8a4 4 0 0 1 4 4" />
                  <path d="M12 4a8 8 0 0 1 8 8" />
                </svg>
              </button>
            </div>
          </div>

          <!-- 地址 -->
          <div class="form-group">
            <label for="base-address" class="form-label">地址</label>
            <input id="base-address" v-model="formData.address" type="text" class="form-input"
              placeholder="輸入完整地址" />
          </div>

          <!-- 備註 -->
          <div class="form-group">
            <label for="base-notes" class="form-label">備註</label>
            <textarea id="base-notes" v-model="formData.notes" class="form-input" placeholder="備註資訊" rows="2" />
          </div>

          <!-- 按鈕組 -->
          <div class="button-group">
            <button class="btn btn-cancel" @click="closeModal">取消</button>
            <button class="btn btn-primary" @click="handleSave" :disabled="!isFormValid">
              {{ editData ? '更新' : '新增' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch, computed } from 'vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  editData: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['close', 'save', 'useCurrentLocation']);

const formData = ref({
  name: '',
  type: '',
  latitude: null,
  longitude: null,
  address: '',
  notes: ''
});

const isFormValid = computed(() => {
  return formData.value.name && formData.value.type && formData.value.latitude !== null && formData.value.longitude !== null;
});

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    if (props.editData) {
      formData.value = { ...props.editData };
    } else {
      resetForm();
    }
  }
});

const resetForm = () => {
  formData.value = {
    name: '',
    type: '',
    latitude: null,
    longitude: null,
    address: '',
    notes: ''
  };
};

const closeModal = () => {
  emit('close');
};

const handleSave = () => {
  if (isFormValid.value) {
    emit('save', {
      id: props.editData?.id || Date.now(),
      ...formData.value
    });
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
  z-index: 1000;
  padding: 20px;
}

.modal-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
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
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.form-input,
.form-select {
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 13px;
  color: #333;
  font-family: inherit;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #ff0000;
  box-shadow: 0 0 0 2px rgba(255, 0, 0, 0.1);
}

.location-input-group {
  display: flex;
  gap: 8px;
  align-items: flex-end;
}

.coord-inputs {
  display: flex;
  gap: 8px;
  flex: 1;
}

.coord-field {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.small-label {
  font-size: 11px;
  font-weight: 600;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-input.small {
  font-size: 12px;
  padding: 8px 10px;
}

.location-btn {
  width: 40px;
  height: 36px;
  padding: 8px;
  background: #ff0000;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.location-btn:hover {
  background: #cc0000;
  transform: translateY(-2px);
}

.button-group {
  display: flex;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #e0e0e0;
  margin-top: 8px;
}

.btn {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background: #f5f5f5;
  color: #666;
}

.btn-cancel:hover {
  background: #e0e0e0;
}

.btn-primary {
  background: #ff0000;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #cc0000;
  transform: translateY(-2px);
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
  opacity: 0.6;
}

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

@media (max-width: 600px) {
  .modal-overlay {
    padding: 10px;
  }

  .modal-container {
    max-height: 95vh;
  }

  .coord-inputs {
    flex-direction: column;
  }
}
</style>
