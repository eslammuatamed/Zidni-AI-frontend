<template>
  <i v-if="iconClass" :class="['muse-icon', iconClass]" :style="iconStyle"></i>
  <span v-else class="icon-fallback" :style="iconStyle">{{ fallbackLabel }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

type IconKey = string;

const iconMap: Record<IconKey, string> = {
  DashboardOutlined: 'pi pi-chart-bar',
  ReadOutlined: 'pi pi-book',
  FileTextOutlined: 'pi pi-file-edit',
  DatabaseOutlined: 'pi pi-database',
  TeamOutlined: 'pi pi-users',
  LineChartOutlined: 'pi pi-chart-line',
  TagOutlined: 'pi pi-tag',
  AppstoreOutlined: 'pi pi-th-large',
  BellOutlined: 'pi pi-bell',
  LayoutOutlined: 'pi pi-sitemap',
  ControlOutlined: 'pi pi-sliders-h',
  DollarOutlined: 'pi pi-dollar',
  SolutionOutlined: 'pi pi-graduation-cap',
  AuditOutlined: 'pi pi-clipboard',
  NotificationOutlined: 'pi pi-bell',
  UserAddOutlined: 'pi pi-user-plus',
  UserSwitchOutlined: 'pi pi-sign-in',
  UserOutlined: 'pi pi-user',
  AreaChartOutlined: 'pi pi-chart-bar',
  CheckCircleOutlined: 'pi pi-check-circle',
  SafetyOutlined: 'pi pi-life-ring',
  ExportOutlined: 'pi pi-external-link',
  SearchOutlined: 'pi pi-search',
  DoubleLeftOutlined: 'pi pi-angle-double-left',
  DoubleRightOutlined: 'pi pi-angle-double-right',
  CloseOutlined: 'pi pi-times',
  MenuOutlined: 'pi pi-bars',
  BookOutlined: 'pi pi-book',
  RightOutlined: 'pi pi-angle-right',
  LeftOutlined: 'pi pi-angle-left',
  ArrowUpOutlined: 'pi pi-arrow-up',
  ArrowDownOutlined: 'pi pi-arrow-down',
  ArrowLeftOutlined: 'pi pi-arrow-left',
  DownloadOutlined: 'pi pi-download',
  UploadOutlined: 'pi pi-upload',
  PlayCircleOutlined: 'pi pi-play-circle',
  ReloadOutlined: 'pi pi-refresh',
  ClockCircleOutlined: 'pi pi-clock',
  TrophyOutlined: 'pi pi-trophy',
  VideoCameraOutlined: 'pi pi-video',
  VideoCameraAddOutlined: 'pi pi-plus-circle',
  FolderAddOutlined: 'pi pi-plus-circle',
  FolderOutlined: 'pi pi-folder',
  AlignLeftOutlined: 'pi pi-align-left',
  MessageOutlined: 'pi pi-comments',
  StopOutlined: 'pi pi-stop',
  PieChartOutlined: 'pi pi-chart-pie',
  SafetyCertificateOutlined: 'pi pi-shield',
  MailOutlined: 'pi pi-envelope',
  LockOutlined: 'pi pi-lock',
  PhoneOutlined: 'pi pi-phone',
  IdcardOutlined: 'pi pi-id-card',
  GlobalOutlined: 'pi pi-globe',
  SettingOutlined: 'pi pi-cog',
  ApartmentOutlined: 'pi pi-building',
  PaletteOutlined: 'pi pi-palette',
  SchoolOutlined: 'pi pi-graduation-cap',
  CreditCardOutlined: 'pi pi-credit-card',
  StarOutlined: 'pi pi-star',
  StarFilled: 'pi pi-star-fill'
};

const props = withDefaults(
  defineProps<{
    name?: string;
    size?: number;
  }>(),
  {
    name: '',
    size: 20
  }
);

const normalizedName = computed(() => props.name?.trim() ?? '');

const resolvedKey = computed(() => {
  const name = normalizedName.value;
  if (!name) return undefined;
  if (name in iconMap) return name;
  if (name.startsWith('pi ')) return name;
  if (name.startsWith('pi-')) return `pi ${name}`;
  const lower = name.toLowerCase();
  const match = Object.keys(iconMap).find((key) => key.toLowerCase() === lower);
  if (match) return match;
  return undefined;
});

const iconClass = computed(() => {
  const direct = normalizedName.value;
  if (direct.startsWith('pi ')) {
    return direct;
  }
  if (direct.startsWith('pi-')) {
    return `pi ${direct}`;
  }
  const key = resolvedKey.value;
  if (!key) return undefined;
  const mapped = iconMap[key];
  if (!mapped) return undefined;
  if (mapped.startsWith('pi ')) {
    return mapped;
  }
  if (mapped.startsWith('pi-')) {
    return `pi ${mapped}`;
  }
  return mapped;
});

const iconStyle = computed(() => ({ fontSize: `${props.size}px` }));
const fallbackLabel = computed(() => props.name?.charAt(0)?.toUpperCase() ?? '?');
</script>

<style scoped>
.muse-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.icon-fallback {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1em;
  height: 1em;
}
</style>
