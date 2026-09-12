// ThesisServer.js
// ★ PostgreSQL (Render) 対応版
//   ローカルの .env がある場合のみ読み込む（Render本番では環境変数がプラットフォームから注入される）
require("dotenv").config();

const express = require("express");
const path = require("path");
const { Client } = require("pg");
const { execFile } = require("child_process");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3001;   // ★ Renderは実行時にPORTを注入するため、まずそちらを優先

// PostgreSQL 接続設定（Render 対応：英検プロジェクトと同じ接続パターン）
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
client.connect();

app.use(express.json());

// ★ フロントエンド（HTML/CSS/JS）を同じExpressアプリから配信する
//   これによりフロントとAPIが同一オリジンになり、CORS設定が不要になる
app.use(express.static(path.join(__dirname)));

// ルート直アクセス時はログイン画面へ
app.get("/", (req, res) => {
  res.redirect("/LoginFrame/LoginFrame.html");
});

// -----------------------------
// /api/login
// -----------------------------
app.post("/api/login", async (req, res) => {
  const { id, pw } = req.body;

  try {
    const result = await client.query(
      "SELECT userid, username, userpw FROM tbluser WHERE username = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.json({ result: "NG", reason: "ID not found" });
    }

    const dbPW = result.rows[0].userpw;
    const dbName = result.rows[0].username;

    if (dbPW === pw) {
      return res.json({
        result: "OK",
        accountName: dbName
      });
    }

    return res.json({ result: "NG", reason: "PW mismatch" });

  } catch (err) {
    console.error("login error:", err);
    res.status(500).json({ result: "NG", reason: "Server error" });
  }
});


// -----------------------------
// /api/thesis_list_by_username/:username
// -----------------------------
app.get("/api/thesis_list_by_username/:username", async (req, res) => {
  const username = req.params.username;

  try {
    // ★ DB列名は小文字だが、フロント側は元のキャメルケースのキー名を
    //   前提にしているため、ここで AS "○○" により明示的に付け直す
    const result = await client.query(
      `
      SELECT
        thesisid         AS "ThesisID",
        checkseeable     AS "CheckSeeable",
        thesistitle      AS "ThesisTitle",
        authors1         AS "Authors1",
        authors2         AS "Authors2",
        authors3         AS "Authors3",
        thesiskeywords01 AS "ThesisKeywords01",
        thesiskeywords02 AS "ThesisKeywords02",
        thesiskeywords03 AS "ThesisKeywords03",
        thesiskeywords04 AS "ThesisKeywords04",
        thesiskeywords05 AS "ThesisKeywords05",
        thesiskeywords06 AS "ThesisKeywords06",
        thesiskeywords07 AS "ThesisKeywords07",
        thesiskeywords08 AS "ThesisKeywords08",
        thesiskeywords09 AS "ThesisKeywords09",
        thesiskeywords10 AS "ThesisKeywords10",
        publicationyear  AS "PublicationYear",
        publicationmonth AS "PublicationMonth",
        publicationdate  AS "PublicationDate",
        publisher        AS "Publisher"
      FROM tblthesis
      WHERE userid = (
        SELECT userid FROM tbluser WHERE username = $1
      )
      `,
      [username]
    );

    res.json({ result: "OK", list: result.rows });

  } catch (err) {
    console.error("list error:", err);
    res.status(500).json({ result: "NG", reason: "Server error" });
  }
});


// -----------------------------
// /api/thesis/nextid/:username（新規作成）
// -----------------------------
app.get("/api/thesis/nextid/:username", async (req, res) => {
  const { username } = req.params;

  try {
    const userResult = await client.query(
      `SELECT userid FROM tbluser WHERE username = $1`,
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.json({ result: "NG", reason: "User not found" });
    }

    const userID = userResult.rows[0].userid;

    const result = await client.query(
      `SELECT COALESCE(MAX(thesisid), 0) + 1 AS nextid
       FROM tblthesis
       WHERE userid = $1`,
      [userID]
    );

    res.json({ result: "OK", nextID: result.rows[0].nextid });

  } catch (err) {
    console.error("nextid error:", err);
    res.json({ result: "NG", reason: "Server error" });
  }
});


// -----------------------------
// /api/thesis/:username/:thesisID（編集）
// -----------------------------
app.get("/api/thesis/:username/:thesisID", async (req, res) => {
  const { username, thesisID } = req.params;

  try {
    const result = await client.query(
      `
      SELECT
        thesisid           AS "ThesisID",
        userid             AS "UserID",
        checkseeable       AS "CheckSeeable",
        publicationyear    AS "PublicationYear",
        publicationmonth   AS "PublicationMonth",
        publicationdate    AS "PublicationDate",
        publisher          AS "Publisher",
        authors1           AS "Authors1",
        authors2           AS "Authors2",
        authors3           AS "Authors3",
        thesistitle        AS "ThesisTitle",
        thesiskeywords01   AS "ThesisKeywords01",
        thesiskeywords02   AS "ThesisKeywords02",
        thesiskeywords03   AS "ThesisKeywords03",
        thesiskeywords04   AS "ThesisKeywords04",
        thesiskeywords05   AS "ThesisKeywords05",
        thesiskeywords06   AS "ThesisKeywords06",
        thesiskeywords07   AS "ThesisKeywords07",
        thesiskeywords08   AS "ThesisKeywords08",
        thesiskeywords09   AS "ThesisKeywords09",
        thesiskeywords10   AS "ThesisKeywords10",
        thesissummary      AS "ThesisSummary",
        researchbackground AS "ResearchBackground",
        researchquestion   AS "ResearchQuestion",
        factsolved         AS "FactSolved",
        factunsolved       AS "FactUnsolved",
        remarks            AS "Remarks",
        savedthesispath    AS "SavedThesisPath"
      FROM tblthesis
      WHERE thesisid = $1
      AND userid = (
        SELECT userid FROM tbluser WHERE username = $2
      )
      `,
      [thesisID, username]
    );

    res.json({ result: "OK", row: result.rows[0] });

  } catch (err) {
    console.error("thesis get error:", err);
    res.status(500).json({ result: "NG", reason: "Server error" });
  }
});


// -----------------------------
// /api/thesis/save
// -----------------------------
app.post("/api/thesis/save", async (req, res) => {
  const b = req.body;

  try {
    // UserID を取得
    const userResult = await client.query(
      `SELECT userid FROM tbluser WHERE username = $1`,
      [b.UserName]
    );

    if (userResult.rows.length === 0) {
      return res.json({ result: "NG", reason: "User not found" });
    }

    const userID = userResult.rows[0].userid;

    // 既存チェック
    const existResult = await client.query(
      `SELECT thesisid FROM tblthesis WHERE thesisid = $1 AND userid = $2`,
      [b.ThesisID, userID]
    );

    const isUpdate = existResult.rows.length > 0;

    if (isUpdate) {
      // ============================
      // UPDATE
      // ============================
      await client.query(
        `
        UPDATE tblthesis SET
          checkseeable = $1,
          publicationyear = $2,
          publicationmonth = $3,
          publicationdate = $4,
          publisher = $5,
          authors1 = $6,
          authors2 = $7,
          authors3 = $8,
          thesistitle = $9,
          thesiskeywords01 = $10,
          thesiskeywords02 = $11,
          thesiskeywords03 = $12,
          thesiskeywords04 = $13,
          thesiskeywords05 = $14,
          thesiskeywords06 = $15,
          thesiskeywords07 = $16,
          thesiskeywords08 = $17,
          thesiskeywords09 = $18,
          thesiskeywords10 = $19,
          thesissummary = $20,
          researchbackground = $21,
          researchquestion = $22,
          factsolved = $23,
          factunsolved = $24,
          remarks = $25,
          savedthesispath = $26,
          updatedat = CURRENT_TIMESTAMP
        WHERE thesisid = $27 AND userid = $28
        `,
        [
          b.CheckSeeable,
          b.PublicationYear,
          b.PublicationMonth,
          b.PublicationDate,
          b.Publisher,
          b.Authors1,
          b.Authors2,
          b.Authors3,
          b.ThesisTitle,
          b.ThesisKeywords01,
          b.ThesisKeywords02,
          b.ThesisKeywords03,
          b.ThesisKeywords04,
          b.ThesisKeywords05,
          b.ThesisKeywords06,
          b.ThesisKeywords07,
          b.ThesisKeywords08,
          b.ThesisKeywords09,
          b.ThesisKeywords10,
          b.ThesisSummary,
          b.ResearchBackground,
          b.ResearchQuestion,
          b.FactSolved,
          b.FactUnsolved,
          b.Remarks,
          b.SavedThesisPath,
          b.ThesisID,
          userID
        ]
      );

    } else {
      // ============================
      // INSERT
      // ============================
      await client.query(
        `
        INSERT INTO tblthesis (
          thesisid, userid, checkseeable, publicationyear, publicationmonth, publicationdate,
          publisher, authors1, authors2, authors3, thesistitle,
          thesiskeywords01, thesiskeywords02, thesiskeywords03, thesiskeywords04, thesiskeywords05,
          thesiskeywords06, thesiskeywords07, thesiskeywords08, thesiskeywords09, thesiskeywords10,
          thesissummary, researchbackground, researchquestion, factsolved, factunsolved, remarks,
          savedthesispath
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11,
          $12, $13, $14, $15, $16,
          $17, $18, $19, $20, $21,
          $22, $23, $24, $25, $26, $27,
          $28
        )
        `,
        [
          b.ThesisID,
          userID,
          // ★ 新規作成時、値が未指定なら 1（表示）をデフォルトにする
          (b.CheckSeeable === undefined || b.CheckSeeable === null) ? 1 : b.CheckSeeable,
          b.PublicationYear,
          b.PublicationMonth,
          b.PublicationDate,
          b.Publisher,
          b.Authors1,
          b.Authors2,
          b.Authors3,
          b.ThesisTitle,
          b.ThesisKeywords01,
          b.ThesisKeywords02,
          b.ThesisKeywords03,
          b.ThesisKeywords04,
          b.ThesisKeywords05,
          b.ThesisKeywords06,
          b.ThesisKeywords07,
          b.ThesisKeywords08,
          b.ThesisKeywords09,
          b.ThesisKeywords10,
          b.ThesisSummary,
          b.ResearchBackground,
          b.ResearchQuestion,
          b.FactSolved,
          b.FactUnsolved,
          b.Remarks,
          b.SavedThesisPath
        ]
      );
    }

    res.json({ result: "OK" });

  } catch (err) {
    console.error("save error:", err);
    res.json({ result: "NG", reason: "Server error" });
  }
});


// ============================
// ★ SettingEnvFrame 用
// ============================

// ユーザー設定取得
app.get("/api/user/:username", async (req, res) => {
  const { username } = req.params;

  try {
    const result = await client.query(
      `
      SELECT
        userid           AS "UserID",
        username         AS "UserName",
        settingsavedpath AS "SettingSavedPath",
        backuppath       AS "BackupPath"
      FROM tbluser WHERE username = $1
      `,
      [username]
    );

    if (result.rows.length === 0) {
      return res.json({ result: "NG", reason: "User not found" });
    }

    // ★ UserPW はセキュリティ上、取得APIでは返さない
    res.json({ result: "OK", row: result.rows[0] });

  } catch (err) {
    console.error("user get error:", err);
    res.status(500).json({ result: "NG", reason: "Server error" });
  }
});

// ユーザー設定保存
app.post("/api/user/save", async (req, res) => {
  const b = req.body;
  // b: { CurrentUserName, UserName, UserPW, SettingSavedPath, BackupPath }

  try {
    const userResult = await client.query(
      "SELECT userid FROM tbluser WHERE username = $1",
      [b.CurrentUserName]
    );

    if (userResult.rows.length === 0) {
      return res.json({ result: "NG", reason: "User not found" });
    }

    const userID = userResult.rows[0].userid;

    // ★ ユーザー名の重複チェック（自分自身への変更は許可）
    if (b.UserName !== b.CurrentUserName) {
      const dupResult = await client.query(
        "SELECT userid FROM tbluser WHERE username = $1",
        [b.UserName]
      );
      if (dupResult.rows.length > 0) {
        return res.json({ result: "NG", reason: "UserName already exists" });
      }
    }

    if (b.UserPW) {
      // ★ パスワード入力あり → パスワードも更新
      await client.query(
        `UPDATE tbluser SET username = $1, userpw = $2, settingsavedpath = $3, backuppath = $4 WHERE userid = $5`,
        [b.UserName, b.UserPW, b.SettingSavedPath, b.BackupPath, userID]
      );
    } else {
      // ★ パスワード未入力 → パスワードは変更しない
      await client.query(
        `UPDATE tbluser SET username = $1, settingsavedpath = $2, backuppath = $3 WHERE userid = $4`,
        [b.UserName, b.SettingSavedPath, b.BackupPath, userID]
      );
    }

    res.json({ result: "OK" });

  } catch (err) {
    console.error("user save error:", err);
    res.json({ result: "NG", reason: "Server error" });
  }
});


// ============================
// ★ バックアップ処理本体
//   将来、ThesisEditionFrame / SettingEnvFrame の保存時にも
//   そのまま呼び出せるよう、独立した関数にしています
// ============================
async function performBackup(userName, backupPath) {
  if (!backupPath) {
    return { result: "NG", reason: "BackupPath is empty" };
  }

  // UserID とユーザー情報を取得
  const userResult = await client.query(
    "SELECT * FROM tbluser WHERE username = $1",
    [userName]
  );

  if (userResult.rows.length === 0) {
    return { result: "NG", reason: "User not found" };
  }

  const userID = userResult.rows[0].userid;

  // 対象ユーザーの論文データを取得
  const thesisResult = await client.query(
    "SELECT * FROM tblthesis WHERE userid = $1",
    [userID]
  );

  // ============================
  // バックアップ本文の組み立て
  //   ★ SELECT * のため、出力される項目名はDBの列名（小文字）になります
  // ============================
  let content = "";

  content += `SELECT * FROM tbluser WHERE userid = '${userID}';\n\n`;
  userResult.rows.forEach((row) => {
    content += `----- tbluser -----\n`;
    Object.entries(row).forEach(([key, value]) => {
      content += `${key}: ${value}\n`;
    });
    content += `\n`;
  });

  content += `SELECT * FROM tblthesis WHERE userid = '${userID}';\n\n`;
  if (thesisResult.rows.length === 0) {
    content += `(該当データなし)\n\n`;
  } else {
    thesisResult.rows.forEach((row, idx) => {
      content += `----- tblthesis Row ${idx + 1} -----\n`;
      Object.entries(row).forEach(([key, value]) => {
        content += `${key}: ${value}\n`;
      });
      content += `\n`;
    });
  }

  // ============================
  // ファイル名: YYYYMMDD_HHMMSS_UserID_BackupFile.txt
  // ============================
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const timestamp =
    `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_` +
    `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const fileName = `${timestamp}_${userID}_BackupFile.txt`;
  const fullPath = path.join(backupPath, fileName);

  try {
    fs.writeFileSync(fullPath, content, "utf-8");
  } catch (err) {
    console.error("backup file write error:", err);
    return { result: "NG", reason: "File write error" };
  }

  // ============================
  // ★ 世代管理：同フォルダ内の当該ユーザーのバックアップを
  //   常に最新5件までに保つ（6件目以降＝古いものから削除）
  // ============================
  try {
    const KEEP_COUNT = 5;
    const pattern = new RegExp(`^\\d{8}_\\d{6}_${userID}_BackupFile\\.txt$`);

    const backupFiles = fs.readdirSync(backupPath)
      .filter((name) => pattern.test(name))
      .sort(); // ファイル名の先頭が YYYYMMDD_HHMMSS なので文字列ソート＝時系列順

    if (backupFiles.length > KEEP_COUNT) {
      const filesToDelete = backupFiles.slice(0, backupFiles.length - KEEP_COUNT);
      filesToDelete.forEach((name) => {
        try {
          fs.unlinkSync(path.join(backupPath, name));
        } catch (delErr) {
          console.error("backup old file delete error:", delErr);
        }
      });
    }
  } catch (err) {
    // ★ 世代管理に失敗してもバックアップ自体は成功しているため、
    //   ログのみ残して処理は継続する
    console.error("backup rotation error:", err);
  }

  return { result: "OK", fileName };
}

// バックアップ実行API（現状は SettingEnvFrame のボタンから呼ばれる）
//
// ★★★ 重要な注意 ★★★
// この API と、この下にある pick-folder / pick-file / open-file の3つは
// 「サーバーとブラウザが同一PC上にある」ことを前提にしたローカル専用機能です。
// Renderにデプロイすると、サーバーはRenderのLinuxコンテナ上で動作し、
// ブラウザ（ユーザーのMac）とは別マシンになるため、これらは機能しなくなります
// （osascriptはLinux上に存在しませんし、そもそも「ユーザーのMacの画面に
// ダイアログを出す」ことがサーバー側からはできません）。
// 今回はDBのPostgreSQL移行のみを目的としているため機能はそのまま残していますが、
// 本番運用に進める際は、この部分の代替設計（例：ブラウザの<input type="file">で
// アップロードし、クラウドストレージに保存する方式への切り替え）が別途必要です。
app.post("/api/backup", async (req, res) => {
  const { UserName, BackupPath } = req.body;

  try {
    const result = await performBackup(UserName, BackupPath);
    res.json(result);
  } catch (err) {
    console.error("backup error:", err);
    res.json({ result: "NG", reason: "Server error" });
  }
});


// ============================
// ★ フォルダ選択ダイアログ（Mac: AppleScript経由・ローカル専用）
// ============================
app.get("/api/pick-folder", (req, res) => {
  const script = 'POSIX path of (choose folder with prompt "保存先フォルダを選択してください")';

  execFile("osascript", ["-e", script], (err, stdout) => {
    if (err) {
      // ★ ユーザーがキャンセルした場合もここに来る
      return res.json({ result: "CANCEL" });
    }
    res.json({ result: "OK", path: stdout.trim() });
  });
});


// ============================
// ★ ファイル選択ダイアログ（Mac: AppleScript経由・ローカル専用）
// ============================
app.get("/api/pick-file", (req, res) => {
  const script = 'POSIX path of (choose file with prompt "論文ファイルを選択してください")';

  execFile("osascript", ["-e", script], (err, stdout) => {
    if (err) {
      // ★ ユーザーがキャンセルした場合もここに来る
      return res.json({ result: "CANCEL" });
    }
    res.json({ result: "OK", path: stdout.trim() });
  });
});


// ============================
// ★ 選択済みファイルをデフォルトアプリで開く（Mac: openコマンド・ローカル専用）
// ============================
app.post("/api/open-file", (req, res) => {
  const { path: filePath } = req.body;

  if (!filePath) {
    return res.json({ result: "NG", reason: "path is empty" });
  }

  execFile("open", [filePath], (err) => {
    if (err) {
      console.error("open-file error:", err);
      return res.json({ result: "NG", reason: "File not found or cannot be opened" });
    }
    res.json({ result: "OK" });
  });
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});