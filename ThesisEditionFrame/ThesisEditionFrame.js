const ThesisEditionFrame = (() => {
  'use strict';
  
  let
  areaHeader,
  areaMiddleLeft,
  areaMiddleRight,
  areaBottom;
  
  let
  userName,
  thesisID;
  
  const func = {
    
    init() {
      // URL パラメータ取得
      const urlParams = new URLSearchParams(window.location.search);
      userName = urlParams.get("name");
      thesisID = urlParams.get("id");   // 新規なら null
      // エリア取得
      areaHeader = document.querySelector("[area-header]");
      areaMiddleLeft = document.querySelector("[area-middle-left]");
      areaMiddleRight = document.querySelector("[area-middle-right]");
      areaBottom = document.querySelector("[area-bottom]");
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
      
      <label>論文ID *</label>
      <input type="text" id="txtThesisID">
      
      <label>論文題名 *</label>
      <input type="text" id="txtThesisTitle" class="wide">
      
      <div class="toggle-box">
      <label class="toggle-switch">
      <input type="checkbox" id="chkSeeable" checked>
      <span class="toggle-slider"></span>
      </label>
      <span id="lblSeeableStatus" class="toggle-label">表示</span>
      </div>
      
      <button id="btnSave">保存</button>
      </div>
      `;
      areaHeader.insertAdjacentHTML("beforeend", html);
      
      // ★ 論文IDは編集不可
      document.getElementById("txtThesisID").disabled = true;
      
      // ★ 表示/非表示トグルの見た目テキストを切り替え
      document.getElementById("chkSeeable").addEventListener("change", (e) => {
        document.getElementById("lblSeeableStatus").textContent = e.target.checked ? "表示" : "非表示";
      });
      
      // ★ 戻るボタンイベント
      document.getElementById("btnBack").addEventListener("click", () => {
        window.location.href =
        `../ThesisListFrame/ThesisListFrame.html?name=${userName}`;
      });
      
      // 保存ボタンイベント
      document.getElementById("btnSave").addEventListener("click", () => {
        func.saveThesis();
      });
      return this;
    },
    // ============================
    // Middle Left
    // ============================
    makeAreaMiddleLeft() {
      // ★ 発行年プルダウン（新しい年ほど上に表示）
      const currentYear = new Date().getFullYear();
      let yearOptions = `<option value="">--</option>`;
      for (let y = currentYear + 1; y >= 1950; y--) {
        yearOptions += `<option value="${y}">${y}</option>`;
      }

      // ★ 発行月プルダウン
      let monthOptions = `<option value="">--</option>`;
      for (let m = 1; m <= 12; m++) {
        const v = String(m).padStart(2, "0");
        monthOptions += `<option value="${v}">${v}</option>`;
      }

      // ★ 発行日プルダウン
      let dayOptions = `<option value="">--</option>`;
      for (let d = 1; d <= 31; d++) {
        const v = String(d).padStart(2, "0");
        dayOptions += `<option value="${v}">${v}</option>`;
      }

      const html =
      `
      <div class="middle-left-box">
      
      <div class="row">
      <label>発行年 *</label>
      <select id="txtPublicationYear">${yearOptions}</select>
      </div>
      
      <div class="row">
      <label>発行月 *</label>
      <select id="txtPublicationMonth">${monthOptions}</select>
      </div>
      
      <div class="row">
      <label>発行日 *</label>
      <select id="txtPublicationDate">${dayOptions}</select>
      </div>
      
      <div class="row">
      <label>著者1 *</label>
      <input type="text" id="txtAuthors1">
      </div>
      
      <div class="row">
      <label>著者2</label>
      <input type="text" id="txtAuthors2">
      </div>
      
      <div class="row">
      <label>著者3</label>
      <input type="text" id="txtAuthors3">
      </div>
      
      <div class="row">
      <label>出版社 *</label>
      <input type="text" id="txtPublisher">
      </div>
      
      </div>
      `;
      areaMiddleLeft.insertAdjacentHTML("beforeend", html);

      // ★ 年・月・日のいずれかを変更したら、実在する日付かチェックする
      //   （新規モード・編集モードどちらでも効くよう、ここでイベントを貼る）
      document.getElementById("txtPublicationYear").addEventListener("change", func.ValidateTxtPublicationDate);
      document.getElementById("txtPublicationMonth").addEventListener("change", func.ValidateTxtPublicationDate);
      document.getElementById("txtPublicationDate").addEventListener("change", func.ValidateTxtPublicationDate);

      return this;
    },
    // ============================
    // Middle Right
    // ============================
    makeAreaMiddleRight() {
      let html = `<div class="middle-right-box">`;
      for (let i = 1; i <= 10; i++) {
        html +=
        `
        <div class="row">
        <label>キーワード${String(i).padStart(2, "0")}</label>
        <input type="text" id="txtThesisKeywords${String(i).padStart(2, "0")}">
        </div>
        `;
      }
      html += `</div>`;
      areaMiddleRight.insertAdjacentHTML("beforeend", html);
      return this;
    },
    // ============================
    // Bottom
    // ============================
    makeAreaBottom() {
      const html =
      `
      <div class="bottom-box">
      
      <label>論文の要約</label>
      <textarea id="txtThesisSummary"></textarea>
      
      <label>研究背景</label>
      <textarea id="txtResearchBackground"></textarea>
      
      <label>リサーチクエスチョン</label>
      <textarea id="txtResearchQuestion"></textarea>
      
      <label>研究で解明されたこと</label>
      <textarea id="txtFactSolved"></textarea>
      
      <label>研究で解明されなかったこと</label>
      <textarea id="txtFactUnsolved"></textarea>
      
      <label>備考</label>
      <textarea id="txtRemarks"></textarea>
      
      <label>論文のファイル</label>
  <div class="path-row">
    <input type="text" id="txtSavedThesisPath" readonly>
    <button type="button" id="btnPickFile" class="btn-pick-file">選択</button>
    <button type="button" id="btnOpenThesis" class="btn-open-file">論文を開く</button>
  </div>
      
      </div>
      `;
      areaBottom.insertAdjacentHTML("beforeend", html);

      // 「選択」ボタン：サーバー経由でMacのファイル選択ダイアログを開き、絶対パスを取得
      document.getElementById("btnPickFile").addEventListener("click", () => {
        func.pickFile("txtSavedThesisPath");
      });

      // 「論文を開く」ボタン：入力欄の絶対パスをサーバー経由でデフォルトアプリで開く
      document.getElementById("btnOpenThesis").addEventListener("click", () => {
        func.openFile("txtSavedThesisPath");
      });

      return this;
    },
    // ============================
    // ファイル選択（サーバー経由でネイティブダイアログを開く）
    // ============================
    pickFile(targetInputId) {
      fetch("/api/pick-file")
      .then(res => res.json())
      .then(data => {
        if (data.result === "OK") {
          document.getElementById(targetInputId).value = data.path;
        }
        // ★ キャンセル時は何もしない
      })
      .catch(err => {
        console.error(err);
        alert("ファイル選択でエラーが発生しました");
      });
    },
    // ============================
    // 選択済みファイルをデフォルトアプリで開く
    // ============================
    openFile(targetInputId) {
      const filePath = document.getElementById(targetInputId).value.trim();

      if (!filePath) {
        alert("先に論文ファイルを選択してください。");
        return;
      }

      fetch("/api/open-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: filePath })
      })
      .then(res => res.json())
      .then(data => {
        if (data.result !== "OK") {
          alert("論文を開けませんでした。ファイルが見つからないか、移動された可能性があります。");
        }
      })
      .catch(err => {
        console.error(err);
        alert("論文を開けませんでした。");
      });
    },
    settingIcon() {
      const favicon = document.querySelector('#dynamic-favicon');
      favicon.href = "../PageIcon/ThesisApp.png";
    },
    // ============================
    // データ読み込み（編集モード）
    // ============================
    loadThesisData() {
      //新規モード
      if (!thesisID) {
        // 論文IDを自動採番
        fetch(`/api/thesis/nextid/${userName}`)
        .then(res => res.json())
        .then(data => {
          if (data.result === "OK") {
            document.getElementById("txtThesisID").value = data.nextID;
          }
          else
          {
            alert("論文IDの採番に失敗しました");
          }
        });
        return this;
      }
      
      //編集モード
      fetch(`/api/thesis/${userName}/${thesisID}`)
      .then(res => res.json())
      .then(data => {
        if (data.result !== "OK") {
          alert("データ取得エラー");
          return;
        }
        
        const row = data.row;
        
        // Header
        document.getElementById("txtThesisID").value = row.ThesisID;
        document.getElementById("txtThesisTitle").value = row.ThesisTitle;
        
        // ★ 表示/非表示トグル（CheckSeeable: 1=表示 / 0=非表示）
        const isSeeable = Number(row.CheckSeeable) === 1;
        document.getElementById("chkSeeable").checked = isSeeable;
        document.getElementById("lblSeeableStatus").textContent = isSeeable ? "表示" : "非表示";
        
        // Middle Left
        document.getElementById("txtPublicationYear").value = row.PublicationYear || "";
        document.getElementById("txtPublicationMonth").value =
          row.PublicationMonth ? String(row.PublicationMonth).padStart(2, "0") : "";
        
        if (row.PublicationDate) {
          const pubDate = new Date(row.PublicationDate);
          const day = String(pubDate.getDate()).padStart(2, "0");
          document.getElementById("txtPublicationDate").value = day;
        }
        
        document.getElementById("txtAuthors1").value = row.Authors1;
        document.getElementById("txtAuthors2").value = row.Authors2;
        document.getElementById("txtAuthors3").value = row.Authors3;
        document.getElementById("txtPublisher").value = row.Publisher;
        
        // Middle Right
        for (let i = 1; i <= 10; i++) {
          const key = `ThesisKeywords${String(i).padStart(2, "0")}`;
          document.getElementById(`txt${key}`).value = row[key];
        }
        
        // Bottom
        document.getElementById("txtThesisSummary").value = row.ThesisSummary;
        document.getElementById("txtResearchBackground").value = row.ResearchBackground;
        document.getElementById("txtResearchQuestion").value = row.ResearchQuestion;
        document.getElementById("txtFactSolved").value = row.FactSolved;
        document.getElementById("txtFactUnsolved").value = row.FactUnsolved;
        document.getElementById("txtRemarks").value = row.Remarks;
        document.getElementById("txtSavedThesisPath").value = row.SavedThesisPath;
      });
      return this;
    },
    ValidateTxtPublicationDate() {
      const year = document.getElementById("txtPublicationYear").value;
      const month = document.getElementById("txtPublicationMonth").value;
      const day = document.getElementById("txtPublicationDate").value;
      
      // ★ 発行月・発行日は任意項目のため、年月日が3つとも揃っていない場合はチェックしない
      if (!year || !month || !day) return;
      
      // ★ プルダウンなので数字チェックは不要。実在する日付かどうかのみ検証する
      const dateStr = `${year}-${month}-${day}`;
      const dateObj = new Date(dateStr);
      
      // 実在しない日付は NG（例：2024-02-30）
      if (
        dateObj.getFullYear() !== Number(year) ||
        dateObj.getMonth() + 1 !== Number(month) ||
        dateObj.getDate() !== Number(day)
      ){
        alert("入力した日付は、実在しません。");
        document.getElementById("txtPublicationDate").value = "";
      }
    },
    // ============================
    // 保存処理
    // ============================
    saveThesis() {
      // ★ 必須項目チェック
      if (!func.ValidateSaveData()) {
        return; // NGなら保存しない
      }
      const year = document.getElementById("txtPublicationYear").value;
      const month = document.getElementById("txtPublicationMonth").value.padStart(2, "0");
      const day = document.getElementById("txtPublicationDate").value.padStart(2, "0");
      
      const publicationDate = `${year}-${month}-${day}`;
      
      const body = {
        ThesisID: document.getElementById("txtThesisID").value,
        ThesisTitle: document.getElementById("txtThesisTitle").value,
        CheckSeeable: document.getElementById("chkSeeable").checked ? 1 : 0,
        PublicationYear: document.getElementById("txtPublicationYear").value,
        PublicationMonth: document.getElementById("txtPublicationMonth").value,
        PublicationDate: publicationDate,
        Authors1: document.getElementById("txtAuthors1").value,
        Authors2: document.getElementById("txtAuthors2").value,
        Authors3: document.getElementById("txtAuthors3").value,
        Publisher: document.getElementById("txtPublisher").value,
        ThesisSummary: document.getElementById("txtThesisSummary").value,
        ResearchBackground: document.getElementById("txtResearchBackground").value,
        ResearchQuestion: document.getElementById("txtResearchQuestion").value,
        FactSolved: document.getElementById("txtFactSolved").value,
        FactUnsolved: document.getElementById("txtFactUnsolved").value,
        Remarks: document.getElementById("txtRemarks").value,
        SavedThesisPath: document.getElementById("txtSavedThesisPath").value,
        UserName: userName
      };
      
      for (let i = 1; i <= 10; i++) {
        const key = `ThesisKeywords${String(i).padStart(2, "0")}`;
        body[key] = document.getElementById(`txt${key}`).value;
      }
      
      fetch("/api/thesis/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })
      .then(res => res.json())
      .then(data => {
        if (data.result === "OK") {
          alert("保存しました");
          window.location.href =
            `../ThesisListFrame/ThesisListFrame.html?name=${userName}`;
        }
        else
        {
          alert("保存エラー");
        }
      });
    },
    ValidateSaveData() {
      const id = document.getElementById("txtThesisID").value.trim();
      const title = document.getElementById("txtThesisTitle").value.trim();
      const year = document.getElementById("txtPublicationYear").value.trim();
      const month = document.getElementById("txtPublicationMonth").value.trim();
      const date = document.getElementById("txtPublicationDate").value.trim();
      const author1 = document.getElementById("txtAuthors1").value.trim();
      const publisher = document.getElementById("txtPublisher").value.trim();
      const savedThesisPath = document.getElementById("txtSavedThesisPath").value.trim();
      
      if (!id) {
        alert("論文IDが入力されていません。");
        return false;
      }
      
      if (!title) {
        alert("論文題名が入力されていません。");
        return false;
      }
      
      if (!year) {
        alert("発行年が入力されていません。");
        return false;
      }

      if (!month) {
        alert("発行月が入力されていません。");
        return false;
      }

      if (!date) {
        alert("発行日が入力されていません。");
        return false;
      }
      
      if (!author1) {
        alert("著者1が入力されていません。");
        return false;
      }
      
      if (!publisher) {
        alert("出版社が入力されていません。");
        return false;
      }

      if (!savedThesisPath) {
        alert("論文の保存パスが入力されていません。");
        return false;
      }
      return true; // ★ 全てOK
    }
  };
  const active = () => {
    func
      .init()
      .makeAreaHeader()
      .makeAreaMiddleLeft()
      .makeAreaMiddleRight()
      .makeAreaBottom()
      .loadThesisData()
      .settingIcon();
  };
  return { active };
})();

window.addEventListener("load", () => {
  ThesisEditionFrame.active();
});