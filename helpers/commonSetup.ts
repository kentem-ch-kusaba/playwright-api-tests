import { test, Page } from '@playwright/test';
import { getMyCustomerIdFromSessionStorage } from './utilityFunctions';

let commonPage: Page; // グローバル変数として commonPage を宣言

// beforeAll 関数：全てのテストの前に一度だけ実行される処理
export const beforeAllsetup = async ({ browser }) => {
    console.log('beforeAllsetup');
    // 新しいページを作成し、commonPage に保存
    commonPage = await browser.newPage(); 
    // ページを指定した URL に移動
    await commonPage.goto('/');
    // myCustomerIdを取得
    const customerId =  await getMyCustomerIdFromSessionStorage(commonPage);
    return { myCustomerId: customerId };
};

// beforeEach 関数：各テストの前に毎回実行される処理
export const beforeEachSetup = async () => {
    console.log('beforeEachSetup');
    //await commonPage.goto('/'); // ページを指定した URL に移動
};

// test と commonPage と myCustomerId をエクスポート
export { test, commonPage };