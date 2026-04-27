import { defineConfig } from 'cypress';

const tenantDomain = process.env.CYPRESS_TENANT_DOMAIN || '127.0.0.1.nip.io';
const appPort = process.env.CYPRESS_APP_PORT || '4173';
const apiPort = process.env.CYPRESS_API_PORT || '8080';

export default defineConfig({
  e2e: {
    baseUrl:
      process.env.CYPRESS_BASE_URL || `http://app.${tenantDomain}:${appPort}`,
    env: {
      tenantDomain,
      appPort,
      apiPort
    },
    video: false,
    screenshotOnRunFailure: true
  }
});
