const ThesisListFrame = (() => {
  'use strict';
  
  let
  area_contents,
  html_contents,
  func,
  flag,
  active,
  thesisListCache;   // ★ 検索・表示切替のフィルタリング用に、取得済みの全件を保持
  
  const conf = {
    area_contents: `area-contents`,
  };
  
  func = {
    init() {
      flag = true;
      return this;
    },
    makeAreaContents() {
      if (!flag) return this;
      
      const urlParams = new URLSearchParams(window.location.search);
      const userName = urlParams.get("name");
      
      html_contents =
      `
      <div class="header">
      <h2>${userName} さんの論文リスト</h2>
      <button class="btnSetting">設定</button>
      </div>
      
      <div class="toolbar">
      <input type="text" id="txtSearch" class="search-input" placeholder="論文題名・著者・キーワード・発行会社で検索">
      <label class="toggle-switch">
      <input type="checkbox" id="chkShowHidden">
      <span class="toggle-slider"></span>
      </label>
      <span class="toggle-label">非表示の論文も表示する</span>
      </div>
      
      <div class="list-area">
      <table class="thesis-table">
      <thead>
      <tr>
      <th>論文ID</th>
      <th>論文題名</th>
      <th>著者1</th>
      <th>キーワード01</th>
      <th>発行年</th>
      <th>発行月</th>
      <th>発行日</th>
      <th>論文発行会社</th>
      <th>編集</th>
      </tr>
      </thead>
      <tbody class="tbody-thesis">
      <!-- ★ データがない場合に中央へ大きく表示する行 -->
      <tr class="no-data" style="display:none;">
      <td colspan="9">まだ追加されておりません</td>
      </tr>
      </tbody>
      </table>
      </div>
      
      <div class="footer">
      <button class="btnLogout">ログアウト</button>
      <button class="btnAdd">新規追加</button>
      </div>
      `;
      
      area_contents = document.querySelector(`[${conf.area_contents}]`);
      area_contents.insertAdjacentHTML('beforeend', html_contents);
      
      func.loadThesisList(userName);
      
      // ★ 検索バー：入力の都度フィルタリング
      area_contents.querySelector("#txtSearch").addEventListener("input", () => {
        func.applyFilters(userName);
      });
      
      // ★ 非表示の論文も表示するかの切り替え
      area_contents.querySelector("#chkShowHidden").addEventListener("change", () => {
        func.applyFilters(userName);
      });
      
      area_contents.querySelector(".btnSetting").addEventListener("click", () => {
        window.location.href = `../SettingEnvFrame/SettingEnvFrame.html?name=${userName}`;
      });
      
      area_contents.querySelector(".btnLogout").addEventListener("click", () => {
        window.location.href = "../LoginFrame/LoginFrame.html";
      });
      
      area_contents.querySelector(".btnAdd").addEventListener("click", () => {
        window.location.href = `../ThesisEditionFrame/ThesisEditionFrame.html?name=${userName}`;
      });
      
      return this;
    },
    settingIcon() {
      const favicon = document.querySelector('#dynamic-favicon');
      favicon.href = "../PageIcon/ThesisApp.png";
    },
    loadThesisList(userName) {
      // ★ 同一オリジンで配信されるため、相対パスでAPIを呼び出す
      fetch(`/api/thesis_list_by_username/${userName}`)
      .then(res => res.json())
      .then(data => {
        if (data.result !== "OK") {
          alert("データ取得エラー");
          return;
        }
        
        // ★ 全件をキャッシュしておき、検索・表示切替のたびに再取得しない
        thesisListCache = data.list;
        func.applyFilters(userName);
      });
    },
    // ============================
    // 検索・表示切替のフィルタリング
    // ============================
    applyFilters(userName) {
      const keyword = area_contents.querySelector("#txtSearch").value.trim().toLowerCase();
      const showHidden = area_contents.querySelector("#chkShowHidden").checked;
      
      const filtered = thesisListCache.filter((row) => {
        // ★ 表示/非表示フィルター（チェックが入っていなければ非表示分は除外）
        if (!showHidden && Number(row.CheckSeeable) !== 1) {
          return false;
        }
        
        // ★ 検索キーワードが空なら、表示/非表示フィルターのみで通す
        if (!keyword) return true;
        
        // ★ 検索対象：論文題名, 著者1〜3, キーワード01〜10, 論文発行会社
        const targets = [
          row.ThesisTitle,
          row.Authors1,
          row.Authors2,
          row.Authors3,
          row.Publisher,
          row.ThesisKeywords01,
          row.ThesisKeywords02,
          row.ThesisKeywords03,
          row.ThesisKeywords04,
          row.ThesisKeywords05,
          row.ThesisKeywords06,
          row.ThesisKeywords07,
          row.ThesisKeywords08,
          row.ThesisKeywords09,
          row.ThesisKeywords10
        ];
        
        // ★ いずれか1つでも部分一致すればヒット（OR条件）
        return targets.some((v) => (v || "").toLowerCase().includes(keyword));
      });
      
      func.renderThesisList(filtered, userName);
    },
    // ============================
    // テーブル描画
    // ============================
    renderThesisList(list, userName) {
      const tbody = area_contents.querySelector(".tbody-thesis");
      const noDataRow = tbody.querySelector(".no-data");
      
      // ★ no-data行以外を一旦削除してから作り直す（検索のたびに呼ばれるため）
      tbody.querySelectorAll("tr:not(.no-data)").forEach((tr) => tr.remove());
      
      // ★ 該当データがない場合
      if (list.length === 0) {
        noDataRow.style.display = "table-row";
        return;
      }
      
      noDataRow.style.display = "none";
      
      // ★ データ行を追加
      list.forEach(row => {
        const tr = document.createElement("tr");
        
        const pubDate = new Date(row.PublicationDate);
        const day = String(pubDate.getDate()).padStart(2, "0");
        
        // ★ 非表示の論文は行を薄くして区別する
        if (Number(row.CheckSeeable) !== 1) {
          tr.classList.add("row-hidden");
        }
        
        tr.innerHTML =
        `
        <td>${row.ThesisID}</td>
        <td>${row.ThesisTitle}</td>
        <td>${row.Authors1}</td>
        <td>${row.ThesisKeywords01}</td>
        <td>${row.PublicationYear}</td>
        <td>${row.PublicationMonth}</td>
        <td>${day}</td>
        <td>${row.Publisher}</td>
        <td><button class="btnEdit" data-id="${row.ThesisID}">編集</button></td>
        `;
        
        tbody.appendChild(tr);
      });
      
      // ★ 編集ボタン
      tbody.querySelectorAll(".btnEdit").forEach(btn => {
        btn.addEventListener("click", () => {
          const thesisID = btn.dataset.id;
          window.location.href =
            `../ThesisEditionFrame/ThesisEditionFrame.html?name=${userName}&id=${thesisID}`;
        });
      });
    }
  };
  active = () => {
    func
      .init()
      .makeAreaContents()
      .settingIcon();
  };
  return { active };
})();

window.addEventListener('load', () => {
  ThesisListFrame.active();
});