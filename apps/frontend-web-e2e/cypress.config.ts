import { nxE2EPreset } from '@nx/cypress/plugins/cypress-preset';
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    ...nxE2EPreset(__filename, {
      cypressDir: 'src',
      webServerCommands: {
        default: 'npx nx run frontend-web:serve-static --port=4300',
        production: 'npx nx run frontend-web:serve-static --port=4300',
      },
      ciWebServerCommand: 'npx nx run frontend-web:serve-static --port=4300',
      ciBaseUrl: 'http://localhost:4300',
    }),
    baseUrl: 'http://localhost:4300',
  },
});
