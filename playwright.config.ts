import { defineConfig, devices } from '@playwright/test'

const production=Boolean(process.env.PLAYWRIGHT_BASE_URL)

export default defineConfig({
  testDir:'./tests',
  timeout:45_000,
  expect:{timeout:8_000},
  fullyParallel:false,
  retries:production?1:0,
  reporter:[['list'],['html',{open:'never'}]],
  use:{
    baseURL:process.env.PLAYWRIGHT_BASE_URL||'http://127.0.0.1:4173',
    trace:'retain-on-failure',
    screenshot:'only-on-failure',
    video:'retain-on-failure',
  },
  webServer:production?undefined:{
    command:'npm run preview -- --host 127.0.0.1 --port 4173',
    url:'http://127.0.0.1:4173',
    reuseExistingServer:true,
    timeout:30_000,
  },
  projects:[
    {name:'desktop-chromium',use:{...devices['Desktop Chrome'],viewport:{width:1440,height:900}}},
    {name:'mobile-chromium',use:{...devices['Pixel 7']}},
  ],
})
