import { defineConfig } from '@playwright/test';
export default defineConfig({testDir:'tests/e2e',timeout:60000,use:{baseURL:process.env.TEST_BASE_URL||'http://127.0.0.1:3100',headless:true,channel:'chrome',trace:'retain-on-failure'},workers:1,reporter:'list'});
