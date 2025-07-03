import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  // fullyParallel: false, // ここを false に設定すると、Playwright はテストファイルを並列で実行しなくなる
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  // workers: workers: 1 を設定すると、全てのテストを単一のワーカープロセスで実行
  // これにより、複数のテストが同時に同じグローバル変数 commonPage にアクセスしようとする競合は防げます。
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  //timeout:120*60*1000, // 120分
  /*
  expect:{
    timeout:20*1000, // 20秒
    toHaveScreenshot:{
      threshold:0.2, // 差分の許容範囲を設定 0.2=20%
    },
  },
  */
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    //baseURL: 'https://my.ks-cloud.net/', // ドメイン
    //baseURL: 'https://kojidbcloud.ks-cloud.net', /* 本番環境 */
    baseURL: 'https://kojidbcloud-proto-dev.azurewebsites.net',  /* 開発環境 */
    //baseURL: 'https://kojidbcloud-proto-dev2.azurewebsites.net',  /* 開発2環境 */
    //baseURL: 'https://kojidbcloud-proto-release.ks-dev-cloud.net',  /* 統合環境 */

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    //trace: 'on',
  },

  /* Configure projects for major browsers */
  projects: [
    // プロジェクトのセットアップ
    { 
      name: 'setup', 
      testMatch: /.*\.setup\.ts/ ,
      use: { 
        ...devices['Desktop Chrome'],
        //viewport: { width: 1800, height: 900 },  /* 表示サイズ：自分の環境に合わせた適切なサイズに変更 */
       },
    },
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // 保存した認証状態を使用する
        storageState: 'playwright/.auth/user.json',
        viewport: { width: 1800, height: 900 },  /* 表示サイズ：自分の環境に合わせた適切なサイズに変更 */
       },
    },
    /*
    // ここからipad
    {
      name: 'iPad Pro 13-inch (M4)',
      use: {
        ...devices['iPad Pro 13-inch (M4)'],
        storageState: 'playwright/.auth/user.json',
      },
    },
    {
      name: 'iPad Air 11-inch (M3)',
      use: {
        ...devices['iPad Air 11-inch (M3)'],
        storageState: 'playwright/.auth/user.json',
      },
    },
    {
      name: 'iPad (11th generation)',
      use: {
        ...devices['iPad (11th generation)'],
        storageState: 'playwright/.auth/user.json',
      },
    },
    {
      name: 'iPad mini (7th generation)',
      use: {
        ...devices['iPad mini (7th generation)'],
        storageState: 'playwright/.auth/user.json',
      },
    },
    */

    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://127.0.0.1:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
