<template>
  <Transition name="modal">
    <div v-if="isOpen" class="modal-overlay" @click="closeModal">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h2>新增緊急聯絡人</h2>
          <button class="close-btn" @click="closeModal">✕</button>
        </div>

        <div class="modal-content">
          <!-- 姓名 -->
          <div class="form-group">
            <label for="contact-name" class="form-label">姓名 *</label>
            <input id="contact-name" v-model="formData.name" type="text" class="form-input" placeholder="輸入姓名"
              required />
          </div>

          <!-- 電話 -->
          <div class="form-group">
            <label for="contact-phone" class="form-label">電話 *</label>
            <input id="contact-phone" v-model="formData.phone" type="tel" class="form-input" placeholder="09xx-xxx-xxx"
              required />
          </div>

          <!-- 關係 -->
          <div class="form-group">
            <label for="contact-relation" class="form-label">關係</label>
            <select id="contact-relation" v-model="formData.relation" class="form-select">
              <option value="">-- 請選擇 --</option>
              <option value="family">家人</option>
              <option value="friend">朋友</option>
              <option value="colleague">同事</option>
              <option value="other">其他</option>
            </select>
          </div>

          <!-- 備註 -->
          <div class="form-group">
            <label for="contact-notes" class="form-label">備註</label>
            <textarea id="contact-notes" v-model="formData.notes" class="form-input" placeholder="備註資訊" rows="2" />
          </div>

          <!-- 按鈕組 -->
          <div class="button-group">
            <button class="btn btn-cancel" @click="closeModal">取消</button>
            <button class="btn btn-primary" @click="handleSave" :disabled="!isFormValid">
              新增
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
  baseId: {
    type: [String, Number],
    default: null
  }
});

const emit = defineEmits(['close', 'save']);

const formData = ref({
  id: null,
  name: '',
  phone: '',
  relation: '',
  notes: ''
});

const isFormValid = computed(() => {
  return formData.value.name && formData.value.phone;
});

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    resetForm();
  }
});

const resetForm = () => {
  formData.value = {
    id: Date.now(),
    name: '',
    phone: '',
    relation: '',
    notes: ''
  };
};

const closeModal = () => {
  emit('close');
};

const handleSave = () => {
  if (isFormValid.value) {
    emit('save', formData.value);
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
  z-index: 1001;
  padding: 20px;
}

.modal-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  max-width: 450px;
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
}
</style>
