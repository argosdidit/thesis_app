const LoginFrame = (() => {
  'use strict';
  let
  area_contents,
  html_contents,
  func,
  flag,
  active;
  
  const conf = {
    area_contents: `area-contents`,
  };
  
  func = {
    init: function () {
      flag = true;
      return this;
    },
    makeAreaContents: function () {
      if (flag) {
        html_contents =
        `
        <div class="container">
        <div class="login-box">
        <img class="imgTitle" src="../PageIcon/ThesisApp.png" height="40%" width="40%">
        <input type="text" placeholder="ログインID" class="login-input">
        <input type="password" placeholder="ログインPW" class="login-input">
        <button class="BtnLogin">ログイン</button>
        <br>
        <button class="BtnReset">パスワードリセット</button>
        </div>
        </div>
        `;
        
        area_contents = document.querySelector(`[${conf.area_contents}]`);
        area_contents.insertAdjacentHTML('beforeend', html_contents);
        
        const BtnLogin = area_contents.querySelector('.BtnLogin');
        const BtnReset = area_contents.querySelector('.BtnReset');
        
        BtnLogin.addEventListener('click', () => {
          func.clickLogin();
        });
        
        BtnReset.addEventListener('click', () => {
          func.clickReset();
        });
      }
      return this;
    },
    clickLogin: function () {
      if(flag){
        
        // ★ makeAreaContents で生成した DOM を area_contents から確実に取得する
        const area_contents = document.querySelector('[area-contents]');
        const inputs = area_contents.querySelectorAll('.login-input');
        
        // ★ 必ず値が取れる
        let getAccountID = inputs[0].value;  // ログインID（UserName）
        let getAccountPW = inputs[1].value;  // ログインPW（UserPW）
        let getAccountName;
        
        if(getAccountID === ""){
          alert("ログインIDを入力してください");
          return;
        }
        
        if(getAccountPW === ""){
          alert("ログインPWを入力してください");
          return;
        }
        
        // ★ サーバーに送る前にログを出す（値が取れているか確認）
        console.log("送信するID:", getAccountID);
        console.log("送信するPW:", getAccountPW);
        
        // ★ 同一オリジンで配信されるため、相対パスでAPIを呼び出す
        fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: getAccountID, pw: getAccountPW })
        })
        .then(res => res.json())
        .then(data => {
          console.log("サーバーからの返答:", data);
          if (data.result === "OK") {
            getAccountName = data.accountName;
            window.location.href =
              `../ThesisListFrame/ThesisListFrame.html?id=${getAccountID}&name=${getAccountName}`;
          }
          else
          {
            alert("IDまたはパスワードが間違っています");
          }
        })
        .catch(err => {
          console.error(err);
          alert("サーバーエラー");
        });
      }
      return this;
    },
    clickReset: function () {
      if(flag){
        const getAccountID = document.querySelector('.login-input[type="text"]').value;
        if(getAccountID === "")
        {
          alert("ログインIDを入力してください");
          return;
        }
      }
    },
    settingIcon() {
      const favicon = document.querySelector('#dynamic-favicon');
      favicon.href = "../PageIcon/ThesisApp.png";
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
  LoginFrame.active();
});