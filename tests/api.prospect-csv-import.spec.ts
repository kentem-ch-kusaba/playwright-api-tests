import { test, expect, APIRequestContext } from '@playwright/test';
// 共通の設定をインポート
import { beforeAllsetup, commonPage } from '../helpers/commonSetup.ts';
import { readAndParseCSV } from '../helpers/utilityFunctions.ts';
import * as fs from 'fs'; // ファイルシステム操作用

// storageStateを読み込む
const authFile = 'playwright/.auth/user.json'; 
// JSONテンプレートファイルのパス
const jsonFilePath = './tests/testdata/api.prospect-csv-import.testdata.json';
// CSVデータファイルのパス
const csvDataPath = './tests/testdata/api.prospect-csv-import.testdata.csv';

/**
 * 認証情報を持ったAPIリクエスト用のコンテキストです。
 * テストスイート全体で再利用されます。
 * @type {APIRequestContext}
 */
let authenticatedRequest: APIRequestContext;

let testDataFromCsv: any[]
let myCustomerId: string | null; // ここに myCustomerId を宣言（letで後から代入可能に）

// test.beforeAll でテストファイルを準備 (例として作成)
test.beforeAll(async ({ playwright, browser, baseURL }) => {
    // 保存された認証状態をロードしてAPIRequestContextを作成
    authenticatedRequest = await playwright.request.newContext({
        baseURL: baseURL,
        extraHTTPHeaders: {
            'Accept': 'application/json', // レスポンスとしてJSON形式を希望することをAPIに伝える
            'Content-Type': 'application/json',  // リクエストボディがJSON形式であることをAPIに伝える
        },
        storageState: authFile, // 以前保存した認証情報ファイルをロード
    });
    // 共通の beforeAllsetup を実行
    const setupResult = await beforeAllsetup({ browser });
    myCustomerId = setupResult.myCustomerId;
    // ブラウザを閉じる
    await commonPage.close();
    // 全てのテストが開始される前に一度だけCSVデータを読み込む
    testDataFromCsv = await readAndParseCSV(csvDataPath);
});

// test.afterAll でテストファイルをクリーンアップ (削除)
test.afterAll(async () => {
    await authenticatedRequest.dispose();
});

test.describe('API CSVデータ駆動型APIテスト', () => {

    test('CSV取り込み＞案件管理', async () => {
        // JSONテンプレートファイルを読み込み、JavaScriptオブジェクトにパース
        // 各テストで読み込み直すことで、前のテストの影響を受けません
        const rawJsonTemplate = fs.readFileSync(jsonFilePath, 'utf8');
        const payloadData = JSON.parse(rawJsonTemplate);
        
        for (const data of testDataFromCsv) {

            await test.step('CSV取り込みから案件を新規作成', async () => {

                // 1. payloadData オブジェクト（テンプレ）の値を変更
                // records 配列は要素が1つだけなので、[0]で直接アクセスします
                payloadData.records[0].constructionName = await data.constructionName; // 工事名（案件）
                payloadData.records[0].constructionShortName = await data.constructionShortName; // 略称
                payloadData.records[0].odererName = await data.odererName; // 発注者
                payloadData.records[0].kojiPlace = await data.kojiPlace; // 工事場所
                payloadData.records[0].kojiContent = await data.kojiContent; // 工事内容
                payloadData.records[0].period_From = await data.period_From; // 工期開始年月日
                payloadData.records[0].period_To = await data.period_To; // 工期完了年月日
                payloadData.records[0].prospectNumber = await data.prospectNumber; // 案件番号
                payloadData.records[0].publishDate = await data.publishDate;
                payloadData.records[0].submitDate = await data.submitDate; // 資料提出日
                //payloadData.records[0].submitTime = null; //await data.submitTime;
                payloadData.records[0].tenderDate = await data.tenderDate; // 入札日
                //payloadData.records[0].tenderTime = null; //await data.tenderTime;
                payloadData.records[0].bidOpeningDate = await data.bidOpeningDate; // 開札日
                //payloadData.records[0].bidOpeningTime = null; //await data.bidOpeningTime;
                payloadData.records[0].amount = await data.amount; // 自社入札価格
                payloadData.records[0].targetPrice = await data.targetPrice; // 予定価格
                payloadData.records[0].contractPrice = await data.contractPrice; // 落札価格
                payloadData.records[0].successfulBidderStr = await data.successfulBidderStr; // 落札者
                payloadData.records[0].lowLimitedPrice = await data.lowLimitedPrice; // 最低制限価格
                payloadData.records[0].technicalPoint_Max = await data.technicalPoint_Max; // 加算点（満点）
                payloadData.records[0].notes = await data.notes; // 落札備考
                payloadData.records[0].companyAbility = await data.companyAbility; // 企業の能力等
                payloadData.records[0].engineersAbility = await data.engineersAbility; // 技術者の能力等
                payloadData.records[0].other =  await data.other; // その他（施工計画等）
                payloadData.records[0].total = await data.total; // 加算点合計
                payloadData.records[0].standardPoint = await data.standardPoint; // 標準点

                // 2. APIエンドポイントにペイロードを渡す（テストデータ）
                const apiUrl = `/prospectmanagementapi/csvBulkUpsert?CustomerId=${ myCustomerId }&State=0`; // APIエンドポイントのURL
                const response = await authenticatedRequest.post(apiUrl, {
                    data: payloadData,
                    headers: {
                        'Accept': 'application/json', // APIがJSONレスポンスを返す場合
                        // Content-Type: 'application/json' はPlaywrightが data オプションで自動設定します
                    },
                });

                // 3. HTTPステータスコードの検証
                expect(response.ok()).toBeTruthy(); // 成功レスポンス（2xx系）

                // レスポンスをJSONとしてパースし、JavaScriptオブジェクトに変換
                const responseData = await response.json();
                const responseData_json = await JSON.parse(responseData);

                // 4. レスポンスデータが期待する構造と内容を持っているかを検証
                // `toMatchObject` を使用し、オブジェクトの一部が期待するパターンと一致するかを確認
                expect(responseData_json).toMatchObject({
                    methodName: "CsvBulkUpsert",
                    // value 確認不要とする
                    error: null,
                });
                console.log('✅ toMatchObject アサーション成功');
                console.log('✅ 案件登録  工事（案件名）:', payloadData.records[0].constructionName);
            });

            let targetId;
            let targetData;
            await test.step('作成した案件のidを取得', async () => {
                // ペイロード（期待結果取得用）
                const payload = {
                    "JsonString": `{\"customerId\":${ myCustomerId },\"page\":1,\"maxItemCount\":100,\"state\":0,\"inTrashBox\":false,\"sortItem\":{\"itemName\":\"ModifiedOn\",\"isAscending\":false},\"SelectItem\":[\"ConstructionName\",\"ModifiedOn\",\"State\",\"OdererName\",\"Koshu\",\"PublishDate\",\"SubmitDate\",\"TenderDate\",\"BidOpeningDate\",\"Amount\",\"Display_AssignedEngineers\"],\"searchDatas\":[]}`
                };

                // 1. APIエンドポイントにペイロードを渡す
                const apiUrl = '/prospectmanagementapi/rawQuerySearch'; // APIエンドポイントのURL：案件一覧
                const response = await authenticatedRequest.post(apiUrl, {
                    data: payload, 
                    headers: {
                        'Accept': 'application/json, text/plain, */*', // APIがJSONレスポンスを返す場合
                        // Content-Type: 'application/json' はPlaywrightが data オプションで自動設定します
                    },
                });
                
                // 2. HTTPステータスコードの検証
                expect(response.ok()).toBeTruthy(); // 成功レスポンス（2xx系）
                
                // レスポンスをJSONとしてパースし、JavaScriptオブジェクトに変換
                const responseData = await response.json();
                //console.log('☑️ メソッド名:', responseData.methodName);
                //console.log('☑️ 合計データ数:', responseData.value.allDataCount);

                // Array.prototype.find() メソッドを使って目的のデータを探す（対象の案件名を持つデータ）
                targetData = responseData.value.prospects.find(
                    (item: any) => item.constructionName === data.constructionName
                );

                if (targetData) {
                    console.log('☑️ 案件一覧  工事（案件名）:', targetData.constructionName);
                    console.log('☑️ id:', targetData.id);
                    // 必要に応じて targetData の各値を検証
                    // expect(targetData.odererName).not.toBeNull();
                    expect(targetData.constructionName).toBe(data.constructionName);
                    targetId = targetData.id;
                } else {
                    console.log(`❌「${data.constructionName}」というデータは見つかりませんでした。`);
                } 
            });

            await test.step('作成した案件の詳細を確認', async () => {
                // APIエンドポイントのURL：案件詳細
                const apiUrl = `/prospectmanagementapi/${targetId}?modes=31&calendarType=1&customerId=${myCustomerId}`;
                // 1. APIエンドポイントへGETリクエストを送信
                const response = await authenticatedRequest.get(apiUrl);
                // 2. HTTPステータスコードの検証
                expect(response.ok()).toBeTruthy(); // 成功レスポンス（2xx系）

                // レスポンスをJSONとしてパースし、JavaScriptオブジェクトに変換
                const responseData = await response.json();
                const responseData_json = await JSON.parse(responseData);

                // 3. レスポンスデータが期待する構造と内容を持っているかを検証
                // レスポンスデータが期待する構造と内容を持っているかを検証
                // `toMatchObject` を使用し、オブジェクトの一部が期待するパターンと一致するかを確認
                expect(responseData_json).toMatchObject({
                    methodName: "Get",
                    value: {
                        id: targetId, // ここは作成した案件から取得した値を使う
                        constructionName: data.constructionName, 
                        constructionShortName: data.constructionShortName,
                        odererName: data.odererName,
                        kojiPlace: data.kojiPlace,
                        kojiContent: data.kojiContent,

                        // 日付と時刻のプロパティは `Date` で終端し、時刻は存在しない
                        period_From: data.period_From.slice(0, -5),
                        period_To: data.period_To.slice(0, -5),
                        prospectNumber: data.prospectNumber,
                        publishDate: data.publishDate.slice(0, -5),
                        submitDate: data.submitDate.slice(0, -5),
                        //submitTime: null,
                        tenderDate: data.tenderDate.slice(0, -5),
                        //tenderTime: null,
                        bidOpeningDate: data.bidOpeningDate.slice(0, -5),
                        //bidOpeningTime: null,

                        // 落札結果
                        amount: Number(data.amount),
                        targetPrice: Number(data.targetPrice),
                        contractPrice: Number(data.contractPrice),
                        successfulBidderStr: data.successfulBidderStr,
                        lowLimitedPrice: Number(data.lowLimitedPrice),
                        tecnicalPoint_Max: Number(data.technicalPoint_Max),
                        notes: data.notes,

                        // 入札結果
                        bidResult: {
                            prospectsBidResultCompanies: expect.arrayContaining([
                                expect.objectContaining({
                                    companyAbility: data.companyAbility,
                                    engineersAbility: data.engineersAbility,
                                    other: data.other,
                                    total: data.total,
                                    standardPoint: data.standardPoint
                                })
                            ]),
                        },
                    },
                    error: null, // `error` プロパティが `null` であることを確認
                });
                console.log('🟨 toMatchObject アサーション成功');
                console.log('🟨 案件詳細 工事（案件名）:', responseData_json.value.constructionName);
            });
        }
    });
});