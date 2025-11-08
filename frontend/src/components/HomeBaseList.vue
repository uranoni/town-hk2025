<template>
  <div class="home-base-container">
    <div class="list-header">
      <h3>常用歸屬點</h3>
      <button class="add-btn" @click="openAddModal" title="新增歸屬點">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        新增
      </button>
    </div>

    <!-- 歸屬點列表 -->
    <div class="base-list">
      <div v-if="homeBases.length === 0" class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        <p>還沒有設定歸屬點</p>
        <small>新增常用的出發點或終點位置</small>
      </div>

      <div v-for="base in homeBases" :key="base.id" class="base-card">
        <div class="card-header">
          <div class="base-info">
            <h4 class="base-name">{{ base.name }}</h4>
            <p class="base-type">{{ getTypeLabel(base.type) }}</p>
          </div>
          <div class="card-actions">
            <button class="action-btn edit-btn" @click="openEditModal(base)" title="編輯">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            <button class="action-btn delete-btn" @click="deleteBase(base.id)" title="刪除">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          </div>
        </div>

        <div class="card-content">
          <div class="location-row">
            <span class="label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              位置
            </span>
            <span class="coordinates">{{ base.latitude.toFixed(6) }}, {{ base.longitude.toFixed(6) }}</span>
          </div>

          <div class="address-row">
            <span class="label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10a10 10 0 1 1-20 0 10 10 0 0 1 20 0z" />
              </svg>
              地址
            </span>
            <span class="address-text">{{ base.address || '未設定' }}</span>
          </div>

          <div v-if="base.notes" class="notes-row">
            <span class="label">備註</span>
            <span class="notes-text">{{ base.notes }}</span>
          </div>

          <!-- 啟程按鈕 -->
          <button class="departure-btn" @click="startDeparture(base)" title="開始回家路徑">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
              <polyline points="10 17 14 13 10 9" />
            </svg>
            啟程
          </button>

          <!-- 緊急聯絡人 -->
          <div class="contacts-section">
            <div class="contacts-header">
              <span class="contacts-label">緊急聯絡人</span>
              <button class="add-contact-btn" @click="openAddContactModal(base.id)" title="新增聯絡人">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            </div>

            <div v-if="base.emergencyContacts && base.emergencyContacts.length > 0" class="contacts-list">
              <div v-for="contact in base.emergencyContacts" :key="contact.id" class="contact-item">
                <div class="contact-info">
                  <p class="contact-name">{{ contact.name }}</p>
                  <p class="contact-phone">{{ contact.phone }}</p>
                </div>
                <button class="remove-contact-btn" @click="removeContact(base.id, contact.id)" title="移除">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>
            <div v-else class="no-contacts">
              <small>未設定聯絡人</small>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 新增/編輯歸屬點 Modal -->
    <AddHomeBaseModal :is-open="isAddModalOpen" :edit-data="editingBase" @close="closeAddModal" @save="saveBase" />

    <!-- 新增緊急聯絡人 Modal -->
    <AddContactModal :is-open="isAddContactModalOpen" :base-id="selectedBaseId" @close="closeAddContactModal"
      @save="saveContact" />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import AddHomeBaseModal from './AddHomeBaseModal.vue';
import AddContactModal from './AddContactModal.vue';

const props = defineProps({
  homeBases: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['addBase', 'updateBase', 'deleteBase', 'addContact', 'removeContact', 'startDeparture']);

const isAddModalOpen = ref(false);
const isAddContactModalOpen = ref(false);
const editingBase = ref(null);
const selectedBaseId = ref(null);

const getTypeLabel = (type) => {
  const typeMap = {
    home: '家',
    work: '工作',
    school: '學校',
    other: '其他'
  };
  return typeMap[type] || type;
};

const openAddModal = () => {
  editingBase.value = null;
  isAddModalOpen.value = true;
};

const openEditModal = (base) => {
  editingBase.value = { ...base };
  isAddModalOpen.value = true;
};

const closeAddModal = () => {
  isAddModalOpen.value = false;
  editingBase.value = null;
};

const saveBase = (baseData) => {
  if (editingBase.value?.id) {
    emit('updateBase', baseData);
  } else {
    emit('addBase', baseData);
  }
  closeAddModal();
};

const deleteBase = (baseId) => {
  if (confirm('確定要刪除這個歸屬點嗎？')) {
    emit('deleteBase', baseId);
  }
};

const openAddContactModal = (baseId) => {
  selectedBaseId.value = baseId;
  isAddContactModalOpen.value = true;
};

const closeAddContactModal = () => {
  isAddContactModalOpen.value = false;
  selectedBaseId.value = null;
};

const saveContact = (contactData) => {
  emit('addContact', {
    baseId: selectedBaseId.value,
    contact: contactData
  });
  closeAddContactModal();
};

const removeContact = (baseId, contactId) => {
  if (confirm('確定要移除這個聯絡人嗎？')) {
    emit('removeContact', { baseId, contactId });
  }
};

const startDeparture = (base) => {
  emit('startDeparture', base);
};
</script>

<style scoped>
.home-base-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 16px;
  padding: 0;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  position: sticky;
  top: 0;
  z-index: 10;
}

.list-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.add-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: #ff0000;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.add-btn:hover {
  background: #cc0000;
  transform: translateY(-1px);
}

.add-btn svg {
  width: 16px;
  height: 16px;
}

.base-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px 20px;
  color: #999;
  text-align: center;
}

.empty-state svg {
  color: #ddd;
}

.empty-state p {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #666;
}

.empty-state small {
  font-size: 13px;
  color: #999;
}

.base-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 12px;
  transition: all 0.2s;
}

.base-card:hover {
  border-color: #ff0000;
  box-shadow: 0 2px 8px rgba(255, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.base-info {
  flex: 1;
}

.base-name {
  margin: 0 0 4px 0;
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.base-type {
  margin: 0;
  font-size: 12px;
  color: #999;
  display: inline-block;
  padding: 2px 6px;
  background: #f5f5f5;
  border-radius: 3px;
}

.card-actions {
  display: flex;
  gap: 4px;
}

.action-btn {
  width: 32px;
  height: 32px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  color: #666;
}

.action-btn:hover {
  border-color: #ff0000;
  color: #ff0000;
  background: #fff5f5;
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 13px;
}

.location-row,
.address-row,
.notes-row {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.label {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #666;
  font-weight: 600;
  min-width: 50px;
  flex-shrink: 0;
}

.label svg {
  color: #ff0000;
}

.coordinates {
  font-family: monospace;
  color: #555;
  word-break: break-all;
}

.address-text {
  color: #555;
  flex: 1;
  word-break: break-word;
}

.notes-text {
  color: #777;
  font-style: italic;
  flex: 1;
}

/* 啟程按鈕 */
.departure-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  background: linear-gradient(135deg, #ff0000 0%, #cc0000 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  margin-top: 4px;
}

.departure-btn:hover {
  background: linear-gradient(135deg, #ff3333 0%, #bb0000 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 0, 0, 0.3);
}

.departure-btn:active {
  transform: translateY(0);
}

.departure-btn svg {
  width: 16px;
  height: 16px;
}

/* 緊急聯絡人區域 */
.contacts-section {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
}

.contacts-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.contacts-label {
  font-weight: 600;
  color: #666;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.add-contact-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: #f0f0f0;
  border-radius: 3px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  transition: all 0.2s;
}

.add-contact-btn:hover {
  background: #ff0000;
  color: white;
}

.contacts-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.contact-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f9f9f9;
  padding: 6px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.contact-info {
  flex: 1;
}

.contact-name {
  margin: 0;
  font-weight: 600;
  color: #333;
}

.contact-phone {
  margin: 2px 0 0 0;
  color: #999;
  font-family: monospace;
}

.remove-contact-btn {
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: #999;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.remove-contact-btn:hover {
  color: #ff0000;
}

.no-contacts {
  color: #bbb;
  font-size: 11px;
  text-align: center;
  padding: 4px;
}

@media (max-width: 600px) {
  .list-header {
    padding: 12px;
  }

  .base-list {
    padding: 8px 12px;
  }

  .card-header {
    flex-direction: column;
    gap: 8px;
  }

  .card-actions {
    align-self: flex-start;
  }
}
</style>
