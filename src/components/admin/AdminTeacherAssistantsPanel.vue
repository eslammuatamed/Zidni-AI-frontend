<template>
  <section class="admin-teachers__section admin-teacher-assistants">
    <header class="admin-teacher-assistants__header">
      <div>
        <h3>{{ t('adminTeachers.assistants.title') }}</h3>
        <p class="admin-teacher-assistants__subtitle">{{ t('adminTeachers.assistants.subtitle') }}</p>
        <p v-if="lastUpdatedLabel" class="admin-teacher-assistants__meta">{{ lastUpdatedLabel }}</p>
      </div>
      <div class="admin-teacher-assistants__actions">
        <UiButton
          size="sm"
          variant="outline"
          :disabled="loadingAny || !canManage"
          @click="openRoleDialog()"
        >
          {{ t('adminTeachers.assistants.actions.addRole') }}
        </UiButton>
        <UiButton
          size="sm"
          color="primary"
          :disabled="loadingAny || !canManage"
          @click="openAssistantDialog()"
        >
          {{ t('adminTeachers.assistants.actions.addAssistant') }}
        </UiButton>
        <UiButton
          size="sm"
          variant="link"
          :loading="refreshing"
          :disabled="refreshing || !canManage"
          @click="refresh"
        >
          {{ refreshing ? t('adminTeachers.assistants.actions.refreshing') : t('adminTeachers.assistants.actions.refresh') }}
        </UiButton>
      </div>
    </header>

    <UiAlert
      v-if="assistantsDisabled"
      color="info"
      variant="soft"
      class="admin-teacher-assistants__alert"
    >
      <strong>{{ t('adminTeachers.assistants.disabled.title') }}</strong>
      <p class="admin-teacher-assistants__disabled-copy">
        {{ t('adminTeachers.assistants.disabled.description') }}
      </p>
    </UiAlert>

    <UiAlert
      v-if="assistantsEnabled && (store.rolesError || store.assistantsError)"
      color="warning"
      variant="soft"
      class="admin-teacher-assistants__alert"
    >
      {{ t('adminTeachers.assistants.errors.load') }}
    </UiAlert>

    <div v-if="assistantsEnabled" class="admin-teacher-assistants__stats" role="list">
      <UiStatCard
        role="listitem"
        color="primary"
        :label="t('adminTeachers.assistants.summary.totalLabel')"
        :value="summary.total"
        icon="TeamOutlined"
        :secondary-stat="t('adminTeachers.assistants.summary.totalDescription')"
      />
      <UiStatCard
        role="listitem"
        color="success"
        :label="t('adminTeachers.assistants.summary.activeLabel')"
        :value="summary.active"
        icon="UserSwitchOutlined"
        :secondary-stat="t('adminTeachers.assistants.summary.activeDescription')"
      />
      <UiStatCard
        role="listitem"
        color="warning"
        :label="t('adminTeachers.assistants.summary.pendingLabel')"
        :value="summary.pending"
        icon="ClockCircleOutlined"
        :secondary-stat="t('adminTeachers.assistants.summary.pendingDescription')"
      />
    </div>

    <div v-if="assistantsEnabled" class="admin-teacher-assistants__grid">
      <UiCard class="admin-teacher-assistants__card" hover>
        <template #title>{{ t('adminTeachers.assistants.roles.title') }}</template>
        <template #subtitle>{{ t('adminTeachers.assistants.roles.subtitle') }}</template>

        <UiTable
          :headers="roleHeaders"
          :items="store.roles"
          :loading="store.rolesLoading || loadingInitial"
          :empty-text="t('adminTeachers.assistants.roles.empty')"
          class="admin-teacher-assistants__table"
        >
          <template #item.permissions="{ item }">
            <div class="admin-teacher-assistants__permission-tags">
              <UiTag
                v-for="permission in item.permissions"
                :key="permission"
                color="primary"
                size="sm"
              >
                {{ permissionLabel(permission) }}
              </UiTag>
              <span v-if="!item.permissions || !item.permissions.length" class="admin-teacher-assistants__empty-tag">
                {{ t('adminTeachers.assistants.roles.noPermissions') }}
              </span>
            </div>
          </template>
          <template #item.actions="{ item }">
            <div class="admin-teacher-assistants__row-actions">
              <UiButton size="sm" variant="link" @click="openRoleDialog(item)">
                {{ t('adminTeachers.assistants.roles.edit') }}
              </UiButton>
              <UiButton size="sm" variant="link" color="danger" @click="confirmDeleteRole(item)">
                {{ t('adminTeachers.assistants.roles.delete') }}
              </UiButton>
            </div>
          </template>
        </UiTable>
      </UiCard>

      <UiCard class="admin-teacher-assistants__card" hover>
        <template #title>{{ t('adminTeachers.assistants.team.title') }}</template>
        <template #subtitle>{{ t('adminTeachers.assistants.team.subtitle') }}</template>

        <UiTable
          :headers="assistantHeaders"
          :items="assistantRows"
          :loading="store.assistantsLoading || loadingInitial"
          :empty-text="t('adminTeachers.assistants.team.empty')"
          class="admin-teacher-assistants__table"
        >
          <template #item.status="{ item }">
            <UiTag :color="item.statusColor" size="sm">{{ item.statusLabel }}</UiTag>
          </template>
          <template #item.lastLogin="{ item }">
            <span>{{ item.lastLoginLabel }}</span>
          </template>
          <template #item.actions="{ item }">
            <div class="admin-teacher-assistants__row-actions">
              <UiButton size="sm" variant="link" @click="openAssistantDialog(item)">
                {{ t('adminTeachers.assistants.team.edit') }}
              </UiButton>
              <UiButton size="sm" variant="link" color="danger" @click="confirmDeleteAssistant(item)">
                {{ t('adminTeachers.assistants.team.delete') }}
              </UiButton>
            </div>
          </template>
        </UiTable>
      </UiCard>
    </div>

    <UiDialog v-model="roleDialog.open" :title="roleDialogTitle" width="520px">
      <form class="admin-teacher-assistants__form" @submit.prevent="submitRole">
        <UiInput v-model="roleDialog.form.name" :label="t('adminTeachers.assistants.roles.form.name')" required />
        <UiTextarea
          v-model="roleDialog.form.description"
          :label="t('adminTeachers.assistants.roles.form.description')"
        />
        <fieldset class="admin-teacher-assistants__permissions">
          <legend>{{ t('adminTeachers.assistants.roles.form.permissions') }}</legend>
          <p class="admin-teacher-assistants__hint">{{ t('adminTeachers.assistants.roles.form.permissionsHint') }}</p>
          <div class="admin-teacher-assistants__permissions-grid">
            <label v-for="option in permissionOptions" :key="option.id" class="admin-teacher-assistants__permission">
              <UiCheckbox v-model="roleDialog.form.permissionsMap[option.id]" />
              <div>
                <span class="admin-teacher-assistants__permission-title">{{ t(option.labelKey) }}</span>
                <p class="admin-teacher-assistants__permission-description">{{ t(option.descriptionKey) }}</p>
              </div>
            </label>
          </div>
        </fieldset>
        <p v-if="roleDialog.error" class="admin-teacher-assistants__error">{{ roleDialog.error }}</p>
        <div class="admin-teacher-assistants__dialog-actions">
          <UiButton type="button" variant="link" @click="closeRoleDialog">{{ t('common.cancel') }}</UiButton>
          <UiButton type="submit" color="primary" :loading="roleDialog.submitting">
            {{ roleDialogSubmitLabel }}
          </UiButton>
        </div>
      </form>
    </UiDialog>

    <UiDialog v-model="assistantDialog.open" :title="assistantDialogTitle" width="520px">
      <form class="admin-teacher-assistants__form" @submit.prevent="submitAssistant">
        <UiInput v-model="assistantDialog.form.name" :label="t('adminTeachers.assistants.team.form.name')" required />
        <UiInput
          v-model="assistantDialog.form.email"
          type="email"
          :label="t('adminTeachers.assistants.team.form.email')"
          required
        />
        <UiInput
          v-model="assistantDialog.form.username"
          :label="t('adminTeachers.assistants.team.form.username')"
          required
        />
        <UiInput
          v-model="assistantDialog.form.password"
          type="password"
          :label="t('adminTeachers.assistants.team.form.password')"
          :required="assistantDialog.requirePassword"
        />
        <UiSelect v-model="assistantDialog.form.roleId" :label="t('adminTeachers.assistants.team.form.role')">
          <option :value="null">{{ t('adminTeachers.assistants.team.form.rolePlaceholder') }}</option>
          <option v-for="role in store.roles" :key="role.id" :value="role.id">{{ role.name }}</option>
        </UiSelect>
        <p v-if="assistantDialog.error" class="admin-teacher-assistants__error">{{ assistantDialog.error }}</p>
        <div class="admin-teacher-assistants__dialog-actions">
          <UiButton type="button" variant="link" @click="closeAssistantDialog">{{ t('common.cancel') }}</UiButton>
          <UiButton type="submit" color="primary" :loading="assistantDialog.submitting">
            {{ assistantDialogSubmitLabel }}
          </UiButton>
        </div>
      </form>
    </UiDialog>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import UiCard from '@/components/ui/UiCard.vue';
import UiTable, { type UiTableHeader } from '@/components/ui/UiTable.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiAlert from '@/components/ui/UiAlert.vue';
import UiTag from '@/components/ui/UiTag.vue';
import UiDialog from '@/components/ui/UiDialog.vue';
import UiInput from '@/components/ui/UiInput.vue';
import UiTextarea from '@/components/ui/UiTextarea.vue';
import UiCheckbox from '@/components/ui/UiCheckbox.vue';
import UiSelect from '@/components/ui/UiSelect.vue';
import UiStatCard from '@/components/ui/UiStatCard.vue';
import { useToast } from '@/composables/useToast';
import { useAdminTeacherAssistantsStore } from '@/stores/adminTeacherAssistants';
import { useAdminStore } from '@/stores/admin';
import { ASSISTANT_PERMISSION_OPTIONS } from '@/stores/teacherAssistants';
import type { AssistantPayload } from '@/services/teacherAssistants';
import { formatDateTime } from '@/utils/formatters';

const props = defineProps<{ teacherId: number | null }>();

const { t } = useI18n();
const toast = useToast();
const store = useAdminTeacherAssistantsStore();
const adminStore = useAdminStore();

const MIN_PASSWORD_LENGTH = 8;

const loadingInitial = ref(false);
const refreshing = ref(false);

const permissionOptions = ASSISTANT_PERMISSION_OPTIONS;

const roleHeaders = computed<UiTableHeader[]>(() => [
  { key: 'name', title: t('adminTeachers.assistants.roles.table.name') },
  { key: 'permissions', title: t('adminTeachers.assistants.roles.table.permissions') },
  { key: 'assistantCount', title: t('adminTeachers.assistants.roles.table.members'), align: 'center' },
  { key: 'actions', title: t('adminTeachers.assistants.roles.table.actions'), align: 'end', sortable: false }
]);

const assistantHeaders = computed<UiTableHeader[]>(() => [
  { key: 'name', title: t('adminTeachers.assistants.team.table.name') },
  { key: 'email', title: t('adminTeachers.assistants.team.table.email') },
  { key: 'role', title: t('adminTeachers.assistants.team.table.role') },
  { key: 'status', title: t('adminTeachers.assistants.team.table.status'), align: 'center' },
  { key: 'lastLogin', title: t('adminTeachers.assistants.team.table.lastLogin') },
  { key: 'actions', title: t('adminTeachers.assistants.team.table.actions'), align: 'end', sortable: false }
]);

const selectedTeacher = computed(() => {
  const teacher = adminStore.selectedTeacher;
  if (!teacher || teacher.id !== props.teacherId) {
    return null;
  }
  return teacher;
});

const hasAssistantsFeature = (flags: Record<string, unknown> | undefined | null): boolean => {
  if (!flags || typeof flags.teacherAssistants === 'undefined' || flags.teacherAssistants === null) {
    return true;
  }

  const value = flags.teacherAssistants;
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    return value !== 0;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return !(normalized === 'false' || normalized === '0' || normalized === 'disabled');
  }
  return Boolean(value);
};

const assistantsEnabled = computed(() => {
  const teacher = selectedTeacher.value;
  if (!teacher) {
    return false;
  }

  const featureAllowed = hasAssistantsFeature(teacher.flags?.effective as Record<string, unknown> | undefined);
  const staffLimit = teacher.entitlements?.staffAccountLimit;
  const entitlementAllowed = staffLimit == null || staffLimit > 0;

  return featureAllowed && entitlementAllowed;
});

const assistantsDisabled = computed(() => Boolean(props.teacherId) && !assistantsEnabled.value);

const canManage = computed(() => Boolean(props.teacherId) && assistantsEnabled.value);
const loadingAny = computed(() => loadingInitial.value || store.rolesLoading || store.assistantsLoading);

const summary = computed(() => {
  let active = 0;
  let pending = 0;
  let disabled = 0;
  for (const assistant of store.assistants) {
    const status = (assistant.status || 'active').toLowerCase();
    if (status === 'pending') {
      pending += 1;
    } else if (status === 'disabled' || status === 'inactive') {
      disabled += 1;
    } else {
      active += 1;
    }
  }
  return {
    total: store.assistants.length,
    active,
    pending: pending + disabled
  };
});

const assistantRows = computed(() =>
  store.assistants.map((assistant) => {
    const role = assistant.role ?? (assistant.roleId != null ? store.roleById(assistant.roleId) : null);
    const rawStatus = (assistant.status || 'active').toLowerCase();
    const statusKey = `adminTeachers.assistants.team.status.${rawStatus}`;
    const statusLabel = t(statusKey);
    let statusColor: 'success' | 'warning' | 'danger' | 'info' = 'success';
    if (rawStatus === 'inactive') {
      statusColor = 'warning';
    } else if (rawStatus === 'disabled') {
      statusColor = 'danger';
    } else if (rawStatus === 'pending') {
      statusColor = 'info';
    }
    const lastLoginLabel = assistant.lastLoginAt ? formatDateTime(assistant.lastLoginAt) : t('adminTeachers.assistants.team.noLastLogin');
    return {
      id: assistant.id,
      name: assistant.name,
      email: assistant.email,
      role: role?.name || t('adminTeachers.assistants.team.roleUnassigned'),
      statusLabel,
      statusColor,
      lastLoginLabel,
      roleId: role?.id ?? assistant.roleId ?? null
    };
  })
);

const lastUpdatedLabel = computed(() => {
  if (!assistantsEnabled.value) {
    return '';
  }
  if (!store.lastLoadedAt) {
    return t('adminTeachers.assistants.summary.neverLoaded');
  }
  return t('adminTeachers.assistants.summary.lastUpdated', {
    date: formatDateTime(store.lastLoadedAt)
  });
});

const roleDialog = reactive({
  open: false,
  submitting: false,
  editingId: null as number | null,
  error: '',
  form: {
    name: '',
    description: '',
    permissionsMap: {} as Record<string, boolean>
  }
});

const assistantDialog = reactive({
  open: false,
  submitting: false,
  editingId: null as number | null,
  error: '',
  form: {
    name: '',
    email: '',
    username: '',
    password: '',
    roleId: null as number | string | null
  },
  get requirePassword() {
    return assistantDialog.editingId === null;
  }
});

const roleDialogTitle = computed(() =>
  roleDialog.editingId
    ? t('adminTeachers.assistants.roles.dialog.editTitle')
    : t('adminTeachers.assistants.roles.dialog.createTitle')
);

const roleDialogSubmitLabel = computed(() =>
  roleDialog.editingId
    ? t('adminTeachers.assistants.roles.form.update')
    : t('adminTeachers.assistants.roles.form.create')
);

const assistantDialogTitle = computed(() =>
  assistantDialog.editingId
    ? t('adminTeachers.assistants.team.dialog.editTitle')
    : t('adminTeachers.assistants.team.dialog.createTitle')
);

const assistantDialogSubmitLabel = computed(() =>
  assistantDialog.editingId
    ? t('adminTeachers.assistants.team.form.update')
    : t('adminTeachers.assistants.team.form.create')
);

const permissionLabel = (permissionId: string) => {
  const option = permissionOptions.find((item) => item.id === permissionId);
  return option ? t(option.labelKey) : permissionId;
};

const resetRoleForm = () => {
  roleDialog.form.name = '';
  roleDialog.form.description = '';
  roleDialog.form.permissionsMap = permissionOptions.reduce<Record<string, boolean>>((acc, option) => {
    acc[option.id] = false;
    return acc;
  }, {});
  roleDialog.error = '';
  roleDialog.submitting = false;
  roleDialog.editingId = null;
};

const resetAssistantForm = () => {
  assistantDialog.form.name = '';
  assistantDialog.form.email = '';
  assistantDialog.form.username = '';
  assistantDialog.form.password = '';
  assistantDialog.form.roleId = null;
  assistantDialog.error = '';
  assistantDialog.submitting = false;
  assistantDialog.editingId = null;
};

const openRoleDialog = (role?: { id: number; name: string; description?: string | null; permissions?: string[] }) => {
  if (!canManage.value) {
    return;
  }
  resetRoleForm();
  if (role) {
    roleDialog.form.name = role.name;
    roleDialog.form.description = role.description || '';
    roleDialog.form.permissionsMap = permissionOptions.reduce<Record<string, boolean>>((acc, option) => {
      acc[option.id] = Boolean(role.permissions?.includes(option.id));
      return acc;
    }, {});
    roleDialog.editingId = role.id;
  }
  roleDialog.open = true;
};

const closeRoleDialog = () => {
  roleDialog.open = false;
};

const openAssistantDialog = (assistant?: { id: number; name: string; email: string; roleId: number | null; username: string }) => {
  if (!canManage.value) {
    return;
  }
  resetAssistantForm();
  if (assistant) {
    const source = store.assistants.find((item) => item.id === assistant.id);
    if (source) {
      assistantDialog.form.name = source.name;
      assistantDialog.form.email = source.email;
      assistantDialog.form.username = source.username;
      assistantDialog.form.roleId = source.roleId ?? null;
      assistantDialog.editingId = source.id;
    }
  }
  assistantDialog.open = true;
};

const closeAssistantDialog = () => {
  assistantDialog.open = false;
};

const submitRole = async () => {
  if (!canManage.value) {
    return;
  }
  roleDialog.submitting = true;
  roleDialog.error = '';
  const payload = {
    name: roleDialog.form.name.trim(),
    description: roleDialog.form.description.trim() || null,
    permissions: Object.entries(roleDialog.form.permissionsMap)
      .filter(([, enabled]) => enabled)
      .map(([permission]) => permission)
  };
  if (!payload.name) {
    roleDialog.error = t('adminTeachers.assistants.roles.form.nameRequired');
    roleDialog.submitting = false;
    return;
  }
  try {
    if (roleDialog.editingId) {
      await store.updateRole(roleDialog.editingId, payload);
      toast.success(t('adminTeachers.assistants.roles.toast.updated', { name: payload.name }));
    } else {
      await store.createRole(payload);
      toast.success(t('adminTeachers.assistants.roles.toast.created', { name: payload.name }));
    }
    roleDialog.open = false;
  } catch (error) {
    console.error('Failed to save assistant role', error);
    roleDialog.error = t('adminTeachers.assistants.roles.form.saveError');
    toast.error(roleDialog.error);
  } finally {
    roleDialog.submitting = false;
  }
};

const submitAssistant = async () => {
  if (!canManage.value) {
    return;
  }
  assistantDialog.submitting = true;
  assistantDialog.error = '';
  let roleId: number | null = null;
  if (assistantDialog.form.roleId !== null && assistantDialog.form.roleId !== '') {
    const parsed = Number(assistantDialog.form.roleId);
    roleId = Number.isNaN(parsed) ? null : parsed;
  }
  const payload: AssistantPayload = {
    name: assistantDialog.form.name.trim(),
    email: assistantDialog.form.email.trim(),
    username: assistantDialog.form.username.trim(),
    roleId
  };
  if (!payload.name || !payload.email || !payload.username) {
    assistantDialog.error = t('adminTeachers.assistants.team.form.requiredError');
    assistantDialog.submitting = false;
    return;
  }
  if (assistantDialog.requirePassword) {
    const passwordValue = assistantDialog.form.password.trim();
    if (!passwordValue) {
      assistantDialog.error = t('adminTeachers.assistants.team.form.passwordRequired');
      assistantDialog.submitting = false;
      return;
    }
    if (passwordValue.length < MIN_PASSWORD_LENGTH) {
      assistantDialog.error = t('auth.passwordMinLength', { count: MIN_PASSWORD_LENGTH });
      assistantDialog.submitting = false;
      return;
    }
    payload.password = passwordValue;
  } else {
    const passwordValue = assistantDialog.form.password.trim();
    if (passwordValue) {
      if (passwordValue.length < MIN_PASSWORD_LENGTH) {
        assistantDialog.error = t('auth.passwordMinLength', { count: MIN_PASSWORD_LENGTH });
        assistantDialog.submitting = false;
        return;
      }
      payload.password = passwordValue;
    }
  }
  try {
    if (assistantDialog.editingId) {
      await store.updateAssistant(assistantDialog.editingId, payload);
      toast.success(t('adminTeachers.assistants.team.toast.updated', { name: payload.name }));
    } else {
      await store.createAssistant(payload);
      toast.success(t('adminTeachers.assistants.team.toast.created', { name: payload.name }));
    }
    assistantDialog.open = false;
  } catch (error) {
    console.error('Failed to save assistant', error);
    assistantDialog.error = t('adminTeachers.assistants.team.form.saveError');
    toast.error(assistantDialog.error);
  } finally {
    assistantDialog.submitting = false;
  }
};

const confirmDeleteRole = async (role: { id: number; name: string }) => {
  if (!canManage.value) {
    return;
  }
  const confirmed = window.confirm(t('adminTeachers.assistants.roles.deleteConfirm', { name: role.name }));
  if (!confirmed) {
    return;
  }
  try {
    await store.deleteRole(role.id);
    toast.success(t('adminTeachers.assistants.roles.toast.deleted', { name: role.name }));
  } catch (error) {
    console.error('Failed to delete assistant role', error);
    toast.error(t('adminTeachers.assistants.roles.form.saveError'));
  }
};

const confirmDeleteAssistant = async (assistant: { id: number; name: string }) => {
  if (!canManage.value) {
    return;
  }
  const confirmed = window.confirm(t('adminTeachers.assistants.team.deleteConfirm', { name: assistant.name }));
  if (!confirmed) {
    return;
  }
  try {
    await store.deleteAssistant(assistant.id);
    toast.success(t('adminTeachers.assistants.team.toast.deleted', { name: assistant.name }));
  } catch (error) {
    console.error('Failed to delete assistant', error);
    toast.error(t('adminTeachers.assistants.team.form.saveError'));
  }
};

const refresh = async () => {
  if (!canManage.value || refreshing.value) {
    return;
  }
  refreshing.value = true;
  try {
    await store.refreshAll();
    toast.success(t('adminTeachers.assistants.toast.refreshed'));
  } catch (error) {
    console.error('Failed to refresh assistants', error);
    toast.error(t('adminTeachers.assistants.errors.refresh'));
  } finally {
    refreshing.value = false;
  }
};

const loadForTeacher = async (teacherId: number) => {
  loadingInitial.value = true;
  try {
    await store.initialize(teacherId);
  } catch (error) {
    console.error('Failed to load teacher assistants for admin', error);
    toast.error(t('adminTeachers.assistants.errors.load'));
  } finally {
    loadingInitial.value = false;
  }
};

watch(
  () => [props.teacherId, assistantsEnabled.value],
  ([teacherId, enabled]) => {
    roleDialog.open = false;
    assistantDialog.open = false;
    if (teacherId == null || !enabled) {
      store.reset();
      loadingInitial.value = false;
      return;
    }
    void loadForTeacher(teacherId);
  },
  { immediate: true }
);
</script>

<style scoped>
.admin-teacher-assistants {
  gap: 1.5rem;
}

.admin-teacher-assistants__header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.admin-teacher-assistants__subtitle {
  margin: 0.25rem 0 0;
  color: var(--color-text-secondary);
}

.admin-teacher-assistants__meta {
  margin: 0.25rem 0 0;
  font-size: 0.85rem;
  color: var(--color-text-tertiary);
}

.admin-teacher-assistants__actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.admin-teacher-assistants__stats {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.admin-teacher-assistants__grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
}

.admin-teacher-assistants__card {
  display: flex;
  flex-direction: column;
}

.admin-teacher-assistants__table {
  margin-top: 1rem;
}

.admin-teacher-assistants__permission-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.admin-teacher-assistants__empty-tag {
  color: var(--color-text-tertiary);
  font-size: 0.85rem;
}

.admin-teacher-assistants__row-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.admin-teacher-assistants__form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.admin-teacher-assistants__permissions {
  border: 1px solid var(--color-border-subtle);
  border-radius: 0.75rem;
  padding: 1rem;
}

.admin-teacher-assistants__hint {
  margin: 0 0 0.75rem;
  font-size: 0.85rem;
  color: var(--color-text-secondary);
}

.admin-teacher-assistants__permissions-grid {
  display: grid;
  gap: 0.75rem;
}

.admin-teacher-assistants__permission {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
}

.admin-teacher-assistants__permission-title {
  font-weight: 600;
}

.admin-teacher-assistants__permission-description {
  margin: 0.25rem 0 0;
  font-size: 0.85rem;
  color: var(--color-text-secondary);
}

.admin-teacher-assistants__error {
  color: var(--color-danger);
}

.admin-teacher-assistants__dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.admin-teacher-assistants__alert {
  margin-top: -0.5rem;
}

.admin-teacher-assistants__disabled-copy {
  margin: 0.25rem 0 0;
}
</style>
