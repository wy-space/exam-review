# 考試複習網站：說明

## 檔案（全部放在 repo 最外層，不需要資料夾）
| 檔案 | 用途 | 會常改嗎 |
|---|---|---|
| index.html | 入口網站 | 不用 |
| subject.html | 單科頁（重點、申論、練習、錯題、新增題目、紀錄） | 不用 |
| cht.html | 中華電信讀書計畫（今日任務） | 不用 |
| **s-mgmt.js** | 企業管理題庫 | ✏️ 會 |
| **s-mkt.js** | 行銷學題庫 | ✏️ 會 |
| **s-eng.js** | 英文題庫＋單字 | ✏️ 會 |
| **s-logic.js** | 邏輯思維題庫 | ✏️ 會 |
| **s-econ.js** | 經濟學（只有申論：歷屆、預測、基本題） | ✏️ 會 |
| **s-law.js** | 法學緒論題庫 | ✏️ 會 |
| poems.js | 首頁四季詩句（可自己加） | 偶爾 |
| effects.js | 四季與節日特效（農曆節日日期每年要改） | 一年一次 |
| logo.png、favicon.png、apple-touch-icon.png | Logo 與網站圖示 | 不用 |
| subjects.js | 科目清單（新增科目時才改） | 偶爾 |
| **sync-config.js** | 雲端同步的 Convex 網址 | 設定一次 |
| sync.js | 雲端同步程式 | 不用 |
| core.js、portal.js、subject.js、plan.js、style.css、schedule.js | 程式與樣式 | 不用 |

## 補充題目的兩種方法
1. **最簡單**：在網站的科目頁按「＋新增題目」直接加。存在這台裝置，備份時一起帶走。
2. **永久寫進檔案**：在 GitHub 打開 s-科目.js → 按鉛筆圖示 → 在章節的 q: [ ] 裡加一行：
   `["題目", ["選項A", "選項B", "選項C", "選項D"], "B", "解析"],`
   → Commit changes。只改這一科的檔案，其他科不受影響。

## 新增一個科目（例如會計）
複製 s-law.js 改名成 s-acct.js，把裡面的 id 改成 "acct"、name 改成 "會計"，換成新內容；
再到 subjects.js 的陣列加上 "acct"。上傳這兩個檔案即可。

## 部署（GitHub Pages）
Add file → Upload files → 選取全部檔案拖進去 → Commit changes → Settings → Pages → main、/ (root) → Save。

## 資料安全（雲端同步）
在 sync-config.js 填好 Convex 網址後，任何裝置打開網站都會自動同步（SYNC_CODE 已預先產生，不用改）。

## 資料安全（手動備份）
練習紀錄存在瀏覽器裡。清除瀏覽器資料、無痕模式、換裝置都會看不到。
請定期到入口網站「備份」頁按「下載備份檔」，把檔案存到雲端硬碟。網站超過 7 天沒備份會提醒。
