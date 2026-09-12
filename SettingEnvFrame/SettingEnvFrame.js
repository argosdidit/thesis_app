const SettingEnvFrame = (() => {
  'use strict';

  let
  areaHeader,
  areaMiddle,
  areaFooter;

  let
  userName;   // URLパラメータから受け取った「変更前」のユーザー名

  const func = {

    init() {
      // URL パラメータ取得
      const urlParams = new URLSearchParams(window.location.search);
      userName = urlParams.get("name");

      // エリア取得
      areaHeader = document.querySelector("[area-header]");
      areaMiddle = document.querySelector("[area-middle]");
      areaFooter = document.querySelector("[area-footer]");
      return this;
    },
    // ============================
    // Header
    // ============================
    makeAreaHeader() {
      const html =
      `
      <div class="header-box">
      <button id="btnBack" class="btn-back">戻る</button>
      <h2 id="headerTitle">設定情報</h2>
      <button id="btnSave">保存</button>
      </div>
      `;
      areaHeader.insertAdjacentHTML("beforeend", html);

      // ★ 戻るボタンイベント
      document.getElementById("btnBack").addEventListener("click", () => {
        window.location.href =
        `../ThesisListFrame/ThesisListFrame.html?name=${userName}`;
      });

      // 保存ボタンイベント
      document.getElementById("btnSave").addEventListener("click", () => {
        func.saveSetting();
      });
      return this;
    },
    // ============================
    // Middle
    // ============================
    makeAreaMiddle() {
      const html =
      `
      <div class="middle-box">

      <div class="row">
      <label>ユーザー名 *</label>
      <input type="text" id="txtUserName">
      </div>

      <div class="row">
      <label>パスワード</label>
      <input type="password" id="txtUserPW" placeholder="変更する場合のみ入力">
      </div>

      <div class="row">
      <label>パスワード(確認)</label>
      <input type="password" id="txtUserPWConfirm" placeholder="変更する場合のみ入力">
      </div>

      <div class="row">
      <label>論文保存パス</label>
      <input type="text" id="txtSettingSavedPath">
      <button type="button" id="btnPickFolderSetting" class="btn-pick-folder">選択</button>
      </div>

      <div class="row">
      <label>データバックアップパス *</label>
      <input type="text" id="txtBackupPath">
      <button type="button" id="btnPickFolderBackup" class="btn-pick-folder">選択</button>
      </div>

      </div>
      `;
      areaMiddle.insertAdjacentHTML("beforeend", html);

      // ★ フォルダ選択ボタン
      document.getElementById("btnPickFolderSetting").addEventListener("click", () => {
        func.pickFolder("txtSettingSavedPath");
      });
      document.getElementById("btnPickFolderBackup").addEventListener("click", () => {
        func.pickFolder("txtBackupPath");
      });
      return this;
    },
    // ============================
    // Footer（バックアップ実行ボタン）
    // ============================
    makeAreaFooter() {
      const html =
      `
      <div class="footer-box">
      <button id="btnBackup" class="btn-backup">バックアップ実行</button>
      </div>
      `;
      areaFooter.insertAdjacentHTML("beforeend", html);

      document.getElementById("btnBackup").addEventListener("click", () => {
        // ★ 押された瞬間に必ずバリデーションを通す
        if (!func.ValidateTxtBackupPath()) {
          return;
        }
        func.executeBackup();
      });
      return this;
    },
    // ============================
    // フォルダ選択（サーバー経由でネイティブダイアログを開く）
    // ============================
    pickFolder(targetInputId) {
      fetch("/api/pick-folder")
      .then(res => res.json())
      .then(data => {
        if (data.result === "OK") {
          document.getElementById(targetInputId).value = data.path;
        }
        // ★ キャンセル時は何もしない
      })
      .catch(err => {
        console.error(err);
        alert("フォルダ選択でエラーが発生しました");
      });
    },
    settingIcon() {
      const favicon = document.querySelector('#dynamic-favicon');
      favicon.href = "../PageIcon/ThesisApp.png";
    },
    // ============================
    // データ読み込み
    // ============================
    loadUserData() {
      fetch(`/api/user/${userName}`)
      .then(res => res.json())
      .then(data => {
        if (data.result !== "OK") {
          alert("データ取得エラー");
          return;
        }

        const row = data.row;

        document.getElementById("txtUserName").value = row.UserName;
        document.getElementById("txtSettingSavedPath").value = row.SettingSavedPath || "";
        document.getElementById("txtBackupPath").value = row.BackupPath || "";

        document.getElementById("headerTitle").textContent =
          `ID:${row.UserID} ${row.UserName} さんの設定情報`;
      });
      return this;
    },
    // ============================
    // バリデーション
    // ============================
    ValidateSaveData() {
      const newUserName = document.getElementById("txtUserName").value.trim();
      const pw = document.getElementById("txtUserPW").value;
      const pwConfirm = document.getElementById("txtUserPWConfirm").value;

      if (!newUserName) {
        alert("ユーザー名が入力されていません。");
        return false;
      }

      // ★ パスワードは片方だけ入力された場合、または不一致の場合をNGとする
      //   （両方空欄の場合は「変更しない」ため許可する）
      if (pw || pwConfirm) {
        if (pw !== pwConfirm) {
          alert("パスワードとパスワード(確認)が一致しません。");
          return false;
        }
      }

      // ★ データバックアップパスは設定上必須
      if (!func.ValidateTxtBackupPath()) {
        return false;
      }

      return true; // ★ 全てOK
    },
    // ============================
    // データバックアップパス単体のバリデーション
    //   保存ボタン・バックアップ実行ボタンの両方から呼ばれる
    // ============================
    ValidateTxtBackupPath() {
      const backupPath = document.getElementById("txtBackupPath").value.trim();

      if (!backupPath) {
        alert("データバックアップパスが入力されていません。");
        return false;
      }

      return true;
    },
    // ============================
    // 保存処理
    // ============================
    saveSetting() {
      // ★ 必須項目チェック
      if (!func.ValidateSaveData()) {
        return; // NGなら保存しない
      }

      const newUserName = document.getElementById("txtUserName").value.trim();
      const pw = document.getElementById("txtUserPW").value;

      const body = {
        CurrentUserName: userName,          // 変更前（DB検索キー）
        UserName: newUserName,              // 変更後
        UserPW: pw,                         // 空文字の場合、サーバー側で「変更しない」扱いにする
        SettingSavedPath: document.getElementById("txtSettingSavedPath").value,
        BackupPath: document.getElementById("txtBackupPath").value
      };

      fetch("/api/user/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })
      .then(res => res.json())
      .then(data => {
        if (data.result === "OK") {
          if (newUserName !== userName) {
            // ★ ユーザー名を変更した場合、以降の name パラメータが
            //    古いままでは他画面のAPI呼び出しに不整合が出るため、
            //    安全のため再ログインを促す
            alert("ユーザー名を変更しました。お手数ですが、再度ログインしてください。");
            window.location.href = "../LoginFrame/LoginFrame.html";
          }
          else
          {
            alert("保存しました");
            window.location.href =
              `../ThesisListFrame/ThesisListFrame.html?name=${newUserName}`;
          }
        }
        else
        {
          alert("保存エラー");
        }
      });
    },
    // ============================
    // バックアップ実行
    // ============================
    executeBackup() {
      const backupPath = document.getElementById("txtBackupPath").value.trim();

      fetch("/api/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ UserName: userName, BackupPath: backupPath })
      })
      .then(res => res.json())
      .then(data => {
        if (data.result === "OK") {
          alert(`バックアップを作成しました\n(${data.fileName})`);
        }
        else
        {
          alert("バックアップに失敗しました: " + (data.reason || ""));
        }
      })
      .catch(err => {
        console.error(err);
        alert("バックアップ処理でエラーが発生しました");
      });
    }
  };
  const active = () => {
    func
      .init()
      .makeAreaHeader()
      .makeAreaMiddle()
      .makeAreaFooter()
      .loadUserData()
      .settingIcon();
  };
  return { active };
})();

window.addEventListener("load", () => {
  SettingEnvFrame.active();
});