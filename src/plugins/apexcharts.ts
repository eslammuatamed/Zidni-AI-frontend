// vue3-apexcharts ships a Vue plugin that globally registers <apexchart>.
// Re-exported here so main.ts can app.use(VueApexCharts) alongside vuetify and
// i18n, matching the existing plugin-file pattern.
import VueApexCharts from 'vue3-apexcharts';

export default VueApexCharts;
