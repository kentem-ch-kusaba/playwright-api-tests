import { Locator, Page, expect } from '@playwright/test';
/* ファイルを扱うためのモジュール（Node.jsに元々ある） */
import fs from 'fs'; // 「readAndParseCSV」で使用している
/* ファイルのパスを扱うためのモジュール（Node.jsに元々ある） */
import path from 'path'; // 「readAndParseCSV」で使用している
/* CSVファイルを解析するためのライブラリ（追加インストールが必要：ターミナルで npm install csv-parse を実行） */
import { parse } from 'csv-parse/sync'; // 「readAndParseCSV」で使用している

/**
 * メインサイドメニューのホバーで表示される要素が表示されるのを待ってから非表示にする
 * @param {object} page - Playwrightのページオブジェクト
 * @param {string} id - 非表示にする要素のIDセレクタ
 */
export const hideProspectBalloon = async (page: Page, id): Promise<void> => {
    // 要素が表示されるのを待つ
    await page.waitForFunction(() => {
        const element = document.querySelector(id);
        return element && getComputedStyle(element).display !== 'none';
    });
    // 要素を非表示にするスタイルを追加
    await page.addStyleTag({ content: `${id} { display: none !important; }`  });
}

/**
 * セッションストレージからmyCustomerIdを取得する
 * @param {Page} page - Playwrightのページオブジェクト
 * @returns {Promise<string | null>} - 取得したmyCustomerIdの値（存在しない場合はnull）
 * @example
 * // 使用例
 * const myCustomerId = await getMyCustomerIdFromSessionStorage(page);
 * console.log(myCustomerId); // myCustomerIdの値をログに出力
 */
export const getMyCustomerIdFromSessionStorage = async (page: Page): Promise<string | null> => {
    const value = await page.evaluate(() => {
        return sessionStorage.getItem('myCustomerId');
    });
    return value; // 取得した値を返す
};

/**
 * 入力値がある状態になるまで入力を実行する
 * @param {Locator} element - Playwrightの要素ロケータ
 * @param {string | undefined} value - 入力する値（未定義の場合は空文字列を使用）
 * @returns {Promise<void>} - この関数は値を返さない
 * @example
 * // 使用例
 * await fillField(page.locator('#myInputField'), 'example value');
 */
export const fillField = async (element, value: string | undefined): Promise<void> => {
    let InputValue = '';
    // valueが未定義の場合、空文字列を使用する
    value = value ?? '';

    // valueが空文字列でない限りループを続ける
    while (!InputValue.trim() && value !== '') {
        await element.fill(value);
        await element.evaluate((el) => el.blur()); // 入力後のフォーカスを外す処理
        InputValue = await element.evaluate(input => input.value);
    }
};

/**
 * チェックボックスにチェックが付くまでリトライ
 * @param {Page} page - PlaywrightのPageオブジェクト
 * @param {Locator} locator - チェックボックスの要素
 * @returns {Promise<void>} - この関数は値を返さない
 * @example
 * // 使用例
 * await retryUntilChecked(page, page.locator('#myCheckbox'));
 */
export const retryUntilChecked = async (page: Page, locator: Locator): Promise<void> => {
    let isChecked = false;
    while (!isChecked) {
        // 要素にクリックを実行する
        await locator.click({ force: true });
        // ✓が付いていることを確認する
        await page.waitForTimeout(200); // フレーキー対策として
        isChecked = await locator.isChecked();
    }
}

/**
 * チェックボックスのチェックが外れるまでリトライ
 * @param {Page} page - PlaywrightのPageオブジェクト
 * @param {Locator} locator - チェックボックスの要素
 * @returns {Promise<void>} - この関数は値を返さない
 * @example
 * // 使用例
 * await retryUntilUnchecked(page, page.locator('#myCheckbox'));
 */
export const retryUntilUnchecked = async (page: Page, locator: Locator): Promise<void> => {
    let isChecked = true;
    while (isChecked) {
        // 要素をクリックする
        await locator.click({ force: true });
        // チェックが外れていることを確認する
        await page.waitForTimeout(200); // フレーキー対策として
        isChecked = await locator.isChecked();
    }
}

/**
 * 【関数】指定された要素が表示されるまでクリック操作を繰り返し行う ※要素が表示されるまでループ
 * @param {Locator} clickonElement - クリック操作を行う要素
 * @param {Locator} displayCheckElement - 表示をチェックする要素
 * @returns {Promise<void>} - この関数は値を返さない
 * @example
 * // 使用例
 * await displayCheck(page.locator('#clickButton'), page.locator('#displayElement'));
 */
export const displayCheck = async (clickonElement, displayCheckElement): Promise<void> => {
    let isVisible = false;
    // 要素が表示されるまでのループ
    while (!isVisible) {
        await expect(clickonElement).toBeEnabled();
        await clickonElement.click({ force: true });
        isVisible = await displayCheckElement.isVisible(); // 要素が表示されているかをチェック
    }
};

/**
 * ファイル管理＞フォルダの▸ボタンの座標を取得する
 * @param {Locator} locator - ▸ボタンの座標を取得したいフォルダ
 * @returns {Promise<{x: number, y: number}>} - xとyの座標を含むオブジェクトを返す
 * @throws {Error} - 座標が取得できない場合にエラーを発生させる
 * @example
 * // 使用例
 * const boundingBox = await getBoundingBox(page.locator('#element'));
 * console.log(boundingBox); // { x: 100, y: 200 }
 */
export const getBoundingBox = async (locator: Locator) => {
    const folderTreeitem = locator;
    const buttonXY = await folderTreeitem.boundingBox(); // ボタンの座標を取得

    // buttonXYがnullでないことを確認
    if (buttonXY) {
        let x = buttonXY.x;
        let y = buttonXY.y;
        return { x, y };
    } else {
        // buttonXYがnullの場合、適切なエラーハンドリングを行う
        throw new Error('座標が取得できませんでした');
    }
}

//async function captureAndCompareScreenshot(testInfo, PublicNoticeInfoPreview, fs, path) {
// export const captureAndCompareScreenshot = async (testInfo, PublicNoticeInfoPreview, fs, path) => {
export const captureAndCompareScreenshot1 = async (testInfo, locator: Locator, answerImage: string, currentImage: string) => {

    const screenshotPath = path.join(testInfo.snapshotPath(), answerImage); // スクリーンショットの保存先のパスを指定
    await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5秒待つ

    console.log(screenshotPath); // 【正解】001.png
    if (!fs.existsSync(screenshotPath)) { // 指定の場所に既に写真があるかを確認し、無ければ新しい写真を撮る
        await locator.screenshot({ path: screenshotPath });
    }

    // 今撮ったスクリーンショットを取得
    const currentScreenshotPath = path.join(testInfo.snapshotPath(), currentImage);
    console.log(currentScreenshotPath); // 今撮った.png
    // 今撮ったスクリーンショットと、前に撮ったスクリーンショットが同じかを確認
    //expect(currentScreenshot).toMatchSnapshot(answerImage);
    expect(await locator.screenshot()).toMatchSnapshot(answerImage);
}

export const captureAndCompareScreenshot = async (testInfo, locator: Locator, answerImage: string, currentImage: string) => {
    // 基準となるスクリーンショットのパス
    const baseScreenshotPath = path.join(testInfo.snapshotPath(), answerImage);
    // 今撮ったスクリーンショットを保存するパス
    const actualScreenshotPath = path.join(testInfo.snapshotPath(), currentImage);

    // 要素が表示されるまで少し待つことで、安定性を高める
    await new Promise(resolve => setTimeout(resolve, 1500));
    // ロケーターのスクリーンショットを一度だけ取得し、メモリに保持
    const baseScreenshotBuffer = await locator.screenshot();
    // 基準となるスクリーンショット（answerImage）が存在しない場合、それを新しく撮影した画像として保存する
    // これは、初回実行時やスナップショットを更新したい場合に利用します
    if (!fs.existsSync(baseScreenshotPath)) {
        console.log(`基準画像が見つかりません。${answerImage} を新しい基準画像として保存します。`);
        //await locator.screenshot({ path: baseScreenshotPath });
        fs.writeFileSync(baseScreenshotPath, baseScreenshotBuffer);
    }

    // 毎回、今撮ったスクリーンショットを 'currentImage' のパスに保存する
    // これにより、テスト実行後に最新のスクリーンショットを確認できます
    console.log(`現在のスクリーンショットを ${currentImage} として保存します。`);
    const currentScreenshotBuffer = await locator.screenshot();
    fs.writeFileSync(actualScreenshotPath, currentScreenshotBuffer);

    // PlaywrightのtoMatchSnapshotを使って、今撮ったスクリーンショットと基準画像を比較する
    // これがビジュアルリグレッションテストの主要な部分です
    console.log(`スクリーンショット ${currentImage} を、基準画像 ${answerImage} と比較します。`);
    expect(currentScreenshotBuffer).toMatchSnapshot(answerImage); // バッファを直接渡す
}



// 【関数】ファイルを選択し、取り込む
export const importPreviewFile = async (page: Page, locator: Locator, inputfile) => {
    // ファイル選択イベントを待つ
    const fileChooserPromise = page.waitForEvent('filechooser');
    // ボタンをクリックしてファイル選択ダイアログを開く
    await locator.click();
    // ファイル選択ダイアログにファイルをセット
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(inputfile);
};


// 【関数】セッションストレージからmyCustomerIdを取得する
export const getValueFromSessionStorage = async (page: Page) => {
    const value = await page.evaluate(() => {
        return sessionStorage.getItem('myCustomerId');
    });
    return value; // 取得した値を返す
};


/**
 * 【関数】ブラウザのモーダルを「OK」などを選択して閉じる
 * @param {Page} page - Playwrightのページオブジェクト
 * @returns {Promise<void>} - この関数は値を返さない
 * @example
 * // 使用例
 * await acceptDialog(page);
 */
export const acceptDialog = async (page: Page): Promise<void> => {
    let modal = page.getByRole('dialog');
    if (modal) {
        // モーダルが存在する場合の処理
        page.on('dialog', async dialog => {
            await dialog.accept();
        });
    } else {
        // モーダルが存在しない場合は何もしない
    }
};

/**
 * 【関数】CSVファイルを読み込み、オブジェクトの配列として返す
 * @param {string} filePath - CSVファイルのパス
 * @returns {Promise<any[]>} - 解析されたオブジェクトの配列
 * @example
 * // 使用例
 * const records = await readAndParseCSV('path/to/your/file.csv');
 * console.log(records); // 解析されたレコードをログに出力
 */
export const readAndParseCSV = async (filePath): Promise<any[]> => {
    const fileContent = fs.readFileSync(path.join(filePath), { encoding: 'utf-8' });
    const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true
    });
    return records;
};
