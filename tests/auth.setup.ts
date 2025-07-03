import { test as setup } from '@playwright/test';
import { expect } from '@playwright/test';
import dotenv from 'dotenv'; // 「dotenv」要インストール

dotenv.config(); // .envの環境変数を使えるようにする
// .envファイルから環境変数（MAIL、PASSWORD）を取得
const mailaddress = process.env.MAIL ?? "";
const password = process.env.PASSWORD ?? "";
// 認証情報の保存先
const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page, baseURL }) => {

    // 要素取得
    const MailTextbox = page.getByRole('textbox', { name: 'メールアドレス' });
    const PassTextbox = page.getByRole('textbox', { name: 'パスワード' });
    const loginbtn = page.getByRole('button', { name: 'ログイン' });

    if (baseURL) {
        //対象のページのURL遷移し、ログインする
        console.log(`テスト環境: ${ baseURL }`);
        await page.goto(baseURL.toString());
        //各要素が有効であることを確認
        await expect(page.getByRole('textbox', { name: 'メールアドレス' })).toBeEditable();
        await expect(page.getByRole('textbox', { name: 'パスワード' })).toBeEditable();
        await expect(page.getByRole('button', { name: 'ログイン' })).toBeEnabled();
        //「メールアドレス」に値を入力
        await MailTextbox.fill(mailaddress);
        //「パスワード」に値を入力
        await PassTextbox.fill(password);
        //「ログインボタン」をクリックし、ログイン実行
        await loginbtn.click();

        // 認証情報を指定箇所へ保存（再利用するため）
        await page.context().storageState({ path: authFile });
        // ブラウザを閉じる
        await page.close();
    }
});
