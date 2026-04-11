let items = []; // Firebase-ээс дата ирэх хүртэл хоосон байна
let history = [];

// 🔥 Хамгийн дээр нь нэмэх хэсэг
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        console.log("Firebase нэвтрэлт амжилттай!");
        // Нэвтэрсэн үед датагаа татаж эхэлнэ
        loadFirebaseData(); 
    } else {
        // Хэрэв Firebase нэвтрэлт байхгүй бол Login руу буцаана
        if (localStorage.getItem("auth") !== "true") {
            window.location.href = "index.html";
        }
    }
});

function loadFirebaseData() {
    console.log("Дата татаж байна...");
    
    db.ref('inventory/items').on('value', (snapshot) => {
        const data = snapshot.val();

        if (data) {
            
            items = Object.keys(data).map(key => ({
                ...data[key],
                id: key 
            }));

            console.log("Дата шинэчлэгдлээ:", items);
            showItems();
        } else {
            items = [];
            showItems();
        }
    });

    db.ref('inventory/history').limitToLast(100).on('value', (snapshot) => {
        const data = snapshot.val();
        history = data ? Object.values(data).reverse() : [];
    });
}

function saveHistory(entry) {
    // ❌ localStorage.setItem-ийг устгаад үүнийг тавь:
    db.ref('inventory/history').push(entry); 
}

let selectedColor = ""; 

function openItem(code) {

    if (!Array.isArray(items)) items = Object.values(items || {});

    let item = items.find(i => i.code === code);
    let isAdmin = localStorage.getItem("role") === "admin";
    
    if (!item) {
        console.error("Бараа олдсонгүй:", code);
        return;
    }

    if (!item.variants) {
        item.variants = [{ color: "Үндсэн", branches: item.branches || { b1: 0, b2: 0, b3: 0 } }];
    }

    // 3. Сонгогдсон өнгө байхгүй бол эхний өнгийг авах
    let currentVariant = item.variants.find(v => v.color === selectedColor);
    if (!currentVariant) {
        currentVariant = item.variants[0];
        selectedColor = currentVariant.color; 
    }

    let html = `
        <div class="detail" style="
            padding: 20px; 
            width: 100%; 
            max-width: 400px; 
            margin: 0 auto; 
            box-sizing: border-box; 
            display: flex; 
            flex-direction: column; 
            align-items: center;
        ">
            <div id="itemDisplay" style="text-align: center; width: 100%; box-sizing: border-box;">
                <h2 style="margin: 0 0 5px 0;">${item.name}</h2>
                <p style="color: #888; margin-bottom: 5px; font-size: 0.9rem;">Код: ${item.code}</p>
                <p style="color: #007aff; font-size: 1.5rem; font-weight: bold; margin-bottom: 15px;">${(item.price || 0).toLocaleString()}₮</p>
                ${isAdmin ? `<button onclick="editMode('${item.code}')" style="margin-bottom: 15px; padding: 8px 20px; border-radius: 8px; border: 1px solid #007aff; background: none; color: #007aff; cursor: pointer;">✏️ Засах</button>` : ''}
            </div>
            
            <div id="itemEdit" style="display:none; margin-bottom: 20px; width: 100%; box-sizing: border-box;">
                <input type="text" id="editName" value="${item.name}" style="width:100%; padding:10px; margin-bottom:5px; border-radius: 8px; border: 1px solid #ddd; box-sizing: border-box;">
                <input type="number" id="editPrice" value="${item.price}" style="width:100%; padding:10px; margin-bottom:10px; border-radius: 8px; border: 1px solid #ddd; box-sizing: border-box;">
                <div style="display:flex; gap:10px;">
                    <button onclick="saveEdit('${item.code}')" style="background:#34c759; color:white; flex:1; padding:10px; border-radius:8px; border:none; cursor:pointer;">Хадгалах</button>
                    <button onclick="openItem('${item.code}')" style="background:#8e8e93; color:white; flex:1; padding:10px; border-radius:8px; border:none; cursor:pointer;">Цуцлах</button>
                </div>
            </div>

            <div class="color-tabs" style="display: flex; justify-content: center; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; width: 100%; box-sizing: border-box;">
                ${item.variants.length > 1 ? item.variants.map(v => `
                    <button onclick="selectColor('${item.code}', '${v.color}')" 
                        style="padding: 8px 16px; border-radius: 20px; border: none; cursor: pointer; 
                        background: ${v.color === selectedColor ? '#007aff' : '#f0f0f0'}; 
                        color: ${v.color === selectedColor ? 'white' : '#333'};">
                        ${v.color}
                    </button>
                `).join('') : `<span style="color:#888; font-size:12px;">Өнгө: ${selectedColor}</span>`}
            </div>

            <div class="branches" style="width: 100%; box-sizing: border-box;">
                ${branchUI(item, currentVariant, "b1", "Минж плаза")}
                ${branchUI(item, currentVariant, "b2", "Номин юнайтед")}
                ${branchUI(item, currentVariant, "b3", "Ривер")}
            </div>

            <div style="display:flex; gap:10px; margin-top:20px; width: 100%; box-sizing: border-box;">
                ${isAdmin ? `<button onclick="deleteItem('${item.code}')" style="background:#ff3b30; color:white; flex:1; padding:12px; border-radius:12px; border:none; font-weight:bold; cursor:pointer;">🗑 Устгах</button>` : ''}
                <button onclick="closeDetail()" style="background:#5856d6; color:white; flex:1; padding:12px; border-radius:12px; border:none; font-weight:bold; cursor:pointer;">⬅ Хаах</button>
            </div>
        </div>
    `;
    document.getElementById("detailContent").innerHTML = html;
    document.getElementById("detailModal").style.display = "flex";
    document.body.style.overflow = "hidden"; // Дэлгэц гүйлгэхийг зогсооно
}

function selectColor(code, color) {
    selectedColor = color;
    openItem(code);
}

function closeDetail(){
  let modal = document.getElementById("detailModal");
  modal.style.display = "none";
  document.body.style.overflow = "auto";
}

window.onclick = function(e){
  let modal1 = document.getElementById("modal");
  let modal2 = document.getElementById("detailModal");

  if(e.target === modal1){
    closeModal();
  }
  if(e.target === modal2){
    closeDetail();
  }
}

// BRANCH UI
function branchUI(item, variant, key, name) {
    return `
        <div class="branch-row" style="
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            background: #f8f9fa; 
            padding: 12px 15px; 
            margin-bottom: 10px; 
            border-radius: 10px;
            width: 100%;
            box-sizing: border-box;
        ">
            <span style="font-size: 14px; color: #333;">${name}: <b>${variant.branches[key]}</b></span>
            <div style="display: flex; gap: 8px;">
                <button onclick="updateQty('${item.code}','${variant.color}','${key}', 1)" 
                    style="background: #34c759; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-weight: bold;"> + </button>
                <button onclick="updateQty('${item.code}','${variant.color}','${key}', -1)" 
                    style="background: #ff3b30; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-weight: bold;"> - </button>
            </div>
        </div>
    `;
}

function updateQty(code, color, branch, change) {
    let item = items.find(i => i.code === code);
    let variant = item.variants.find(v => v.color === color);

    if (change === -1 && variant.branches[branch] <= 0) return;

    askConfirm(change > 0 ? "Нэмэх үү?" : "Хасах уу?", () => {

        // ✅ ТОГТООМЖТОЙ UPDATE
        variant.branches[branch] += change;

        // 🔥 FIREBASE UPDATE (ЭНЭ ЧУХАЛ)
        db.ref('inventory/items/' + item.id).update({
            variants: item.variants
        });

        let bNames = { b1: "Минж плаза", b2: "Номин юнайтед", b3: "Ривер" };

        saveHistory({
            user: localStorage.getItem("user") || "Хэрэглэгч",
            action: change > 0 ? "Нэмсэн" : "Хассан",
            itemName: `${item.name} (${color})`,
            itemCode: item.code,
            itemCat: item.category || "Тодорхойгүй",
            itemPrice: item.price,
            branchName: bNames[branch],
            time: new Date().toLocaleString()
        });

        openItem(code);
    });
}

function addNewColor(code) {
    let colorName = prompt("Шинэ өнгөний нэр:");
    if (!colorName) return;
    let item = items.find(i => i.code === code);
    if (item.variants.some(v => v.color === colorName)) return alert("Энэ өнгө байна!");
    
    item.variants.push({ color: colorName, branches: { b1: 0, b2: 0, b3: 0 } });
    selectedColor = colorName;
    openItem(code);
}

function askConfirm(message, callback) {
  const modal = document.getElementById("confirmModal");
  const title = document.getElementById("confirmTitle");
  const yesBtn = document.getElementById("confirmYes");

  title.innerText = message;
  modal.style.display = "flex";

  // Өмнөх бүх event-ийг цэвэрлэж, шинэ үйлдлийг оноох
  yesBtn.onclick = function() {
    callback();
    closeConfirm();
  };
}

function closeConfirm() {
  document.getElementById("confirmModal").style.display = "none";
}

// ADD COUNT
function add(code, branch){
  askConfirm("Тоо хэмжээг нэмэх үү?", () => {
    let item = items.find(i => i.code === code);
    item.branches[branch]++;

    // Салбарын нэрийг зөв оноох логик
    let bName = "";
    if(branch === 'b1') bName = "Минж плаза";
    else if(branch === 'b2') bName = "Номин юнайтед";
    else bName = "Ривер";

    saveHistory({
        user: localStorage.getItem("user") || "Хэрэглэгч",
        action: "Нэмсэн",
        itemName: item.name,
        itemCode: item.code,
        itemCat: item.category || "Тодорхойгүй",
        itemPrice: item.price,
        branchName: bName, // ⬅️ Солигдсон нэр энд орно
        time: new Date().toLocaleString()
    });

    openItem(code);
  });
}

// REMOVE COUNT
function remove(code, branch){
  let item = items.find(i => i.code === code);
  if(item && item.branches[branch] > 0){
    askConfirm("Тоо хэмжээг хасах үү?", () => {
      item.branches[branch]--;

      // Салбарын нэрийг зөв оноох логик
      let bName = "";
      if(branch === 'b1') bName = "Минж плаза";
      else if(branch === 'b2') bName = "Номин юнайтед";
      else bName = "Ривер";

      saveHistory({
          user: localStorage.getItem("user") || "Хэрэглэгч",
          action: "Хассан",
          itemName: item.name,
          itemCode: item.code,
          itemCat: item.category || "Тодорхойгүй",
          itemPrice: item.price,
          branchName: bName, // ⬅️ Солигдсон нэр энд орно
          time: new Date().toLocaleString()
      });

      openItem(code);
    });
  }
}

// ADD NEW ITEM
function addItem() {
    if (localStorage.getItem("role") !== "admin") return alert("Зөвхөн админ!");

    let name = document.getElementById("name").value.trim();
    let code = document.getElementById("code").value.trim();
    let price = document.getElementById("price").value;
    let catSelect = document.getElementById("cat"); 
    let category = catSelect ? catSelect.value : "Бусад";

    let colorInputs = document.querySelectorAll(".variant-color");
    let variants = [];
    colorInputs.forEach(input => {
        let colorValue = input.value.trim();
        if (colorValue) {
            variants.push({
                color: colorValue,
                branches: { b1: 0, b2: 0, b3: 0 }
            });
        }
    });

    if (!name || !code || variants.length === 0) {
        alert("Нэр, Код болон дор хаяж нэг өнгө оруулна уу!");
        return;
    }

    if (items.some(i => i.code === code)) {
        alert("Энэ код аль хэдийн байна!");
        return;
    }

    let newItem = {
        name: name,
        code: code,
        price: Number(price) || 0,
        category: category,
        variants: variants
    };

    console.log("Хадгалах гэж буй өгөгдөл:", newItem);

    try {
        let newRef = db.ref('inventory/items').push();
        newItem.id = newRef.key; // ID-г оноох

        newRef.set(newItem)
            .then(() => {
                console.log("Firebase-д амжилттай хадгалагдлаа");
                closeModal();
                alert("Амжилттай нэмэгдлээ!");
            })
            .catch((err) => {
                console.error("Firebase set error:", err);
                alert("Хадгалахад алдаа гарлаа: " + err.message);
            });
    } catch (e) {
        console.error("Database Ref Error:", e);
        alert("Firebase холболтын алдаа! db хувьсагчийг шалгана уу.");
    }
}

// MODAL
function openModal() {
  document.getElementById("modal").style.display = "flex";
  document.body.style.overflow = "hidden"; // 🔥 scroll stop
}

function closeModal() {
  document.getElementById("modal").style.display = "none";
  document.body.style.overflow = "auto"; // буцаана

  document.getElementById("name").value = "";
  document.getElementById("code").value = "";
  document.getElementById("price").value = "";
}

function deleteItem(code) {
    if (!confirm("Энэ барааг бүрмөсөн устгах уу?")) return;

    let item = items.find(i => i.code === code);

    db.ref('inventory/items/' + item.id).remove();

    closeDetail();
}

function saveMonthlyReport(){
    let now = new Date();
    let month = now.toISOString().slice(0,7); 

    let snapshot = items.map(i => ({
        name: i.name,
        code: i.code,
        variants: i.variants || [] // variants-аар нь хадгалах нь зөв
    }));

    db.ref('inventory/reports/' + month).set({
        month: month,
        data: snapshot
    }).then(() => {
        alert("Сарын тайлан серверт хадгалагдлаа!");
    });
}

function viewReports(){
  let reports = JSON.parse(localStorage.getItem("reports")) || [];

  let div = document.getElementById("items");
  div.innerHTML = "";

  reports.forEach(r => {
    div.innerHTML += `
      <div class="card">
        <h3>${r.month}</h3>
        <button onclick="openReport('${r.month}')">Нээх</button>
      </div>
    `;
  });
}

function openReport(month){
  let reports = JSON.parse(localStorage.getItem("reports")) || [];
  let report = reports.find(r => r.month === month);

  let html = `<h2>${month} Тайлан</h2>`;

  report.data.forEach(i => {
    let total = i.branches.b1 + i.branches.b2 + i.branches.b3;

    html += `
      <div class="card">
        <h3>${i.name}</h3>
        <p>Салбар 1: ${i.branches.b1}</p>
        <p>Салбар 2: ${i.branches.b2}</p>
        <p>Салбар 3: ${i.branches.b3}</p>
        <b>Нийт: ${total}</b>
      </div>
    `;
  });

  html += `<button onclick="viewReports()">⬅ Back</button>`;

  document.getElementById("items").innerHTML = html;
}

// SHOW ITEMS
function showItems() {
    let catSelect = document.getElementById("category");
    let searchInput = document.getElementById("search");
    let div = document.getElementById("items");

    if (!catSelect || !div) return;

    // Утгуудыг авах (хоосон зайг арилгаж, жижиг үсэг рүү шилжүүлнэ)
    let selectedCat = catSelect.value.trim().toLowerCase();
    let search = searchInput ? searchInput.value.toLowerCase().trim() : "";
    
    div.innerHTML = "";
    let htmlContent = ""; // HTML-ийг цуглуулах хувьсагч

    let filteredItems = items.filter(i => {
        let itemCat = (i.category || "").trim().toLowerCase();
        let itemCode = (i.code || "").toLowerCase();
        let itemName = (i.name || "").toLowerCase();

        // 1. Хэрэв хайлт хоосон бол зөвхөн категороор шүүнэ
        // 2. Хэрэв хайлт утгатай бол категороос үл хамааран кодоор эсвэл нэрээр хайж болно
        if (search !== "") {
            return itemCode.includes(search) || itemName.includes(search);
        } else {
            return itemCat === selectedCat;
        }
    });

    if (filteredItems.length === 0) {
        div.innerHTML = `<p style="text-align:center; color:#888; padding:20px;">Ийм бараа олдсонгүй.</p>`;
        return;
    }

    // showItems доторх loop хэсэг:
filteredItems.forEach(i => {
    htmlContent += `
        <div class="card" onclick="selectedColor=''; openItem('${i.code}')" style="
            cursor: pointer; background: white; padding: 15px; border-radius: 12px; 
            margin-bottom: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            -webkit-tap-highlight-color: transparent;
        ">
            <h3 style="margin: 0; font-size: 16px;">${i.name}</h3>
            <p style="color: #007aff; font-weight: bold; margin: 5px 0;">${(i.price || 0).toLocaleString()}₮</p>
            <small style="color: #888;">Код: ${i.code} | ${i.category}</small>
        </div>
    `;
});

    div.innerHTML = htmlContent; // Бүх картыг нэг удаа дэлгэцэнд зурна
}

function exportToExcel() {
    // 1. Дата байгаа эсэхийг шалгах
    if (!items || items.length === 0) {
        alert("Татах бараа байхгүй байна!");
        return;
    }

    try {
        const wb = XLSX.utils.book_new();
        const categoryGroups = {};

        // 2. Бараануудыг категориор нь бүлэглэх
        items.forEach(item => {
            let catName = item.category || "Бусад";
            if (!categoryGroups[catName]) categoryGroups[catName] = [];

            // variants байгаа эсэхийг шалгаад, байхгүй бол хуучин бүтцээр нь авна
            if (item.variants && item.variants.length > 0) {
                item.variants.forEach(v => {
                    let b1 = v.branches.b1 || 0;
                    let b2 = v.branches.b2 || 0;
                    let b3 = v.branches.b3 || 0;
                    let total = b1 + b2 + b3;

                    categoryGroups[catName].push({
                        "Барааны нэр": item.name,
                        "Өнгө": v.color,
                        "Код": item.code,
                        "Үнэ (₮)": Number(item.price) || 0,
                        "Минж плаза": b1,
                        "Номин юнайтед": b2,
                        "Ривер": b3,
                        "Нийт үлдэгдэл": total
                    });
                });
            } else if (item.branches) { 
                // Хуучин бараанууд (variants-гүй) байвал энд орно
                let b1 = item.branches.b1 || 0;
                let b2 = item.branches.b2 || 0;
                let b3 = item.branches.b3 || 0;
                categoryGroups[catName].push({
                    "Барааны нэр": item.name,
                    "Өнгө": "Үндсэн",
                    "Код": item.code,
                    "Үнэ (₮)": Number(item.price) || 0,
                    "Минж плаза": b1,
                    "Номин юнайтед": b2,
                    "Ривер": b3,
                    "Нийт үлдэгдэл": b1 + b2 + b3
                });
            }
        });

        // 3. Категори болгоноор Sheet үүсгэх
        Object.keys(categoryGroups).forEach(catName => {
            const data = categoryGroups[catName];
            const ws = XLSX.utils.json_to_sheet(data);

            // Баганын өргөн тохируулах
            ws['!cols'] = [
                { wch: 25 }, // Нэр
                { wch: 12 }, // Өнгө
                { wch: 15 }, // Код
                { wch: 12 }, // Үнэ
                { wch: 15 }, // Салбар 1
                { wch: 15 }, // Салбар 2
                { wch: 15 }, // Салбар 3
                { wch: 15 }  // Нийт
            ];

            XLSX.utils.book_append_sheet(wb, ws, catName.substring(0, 31));
        });

        // 4. Файлыг хадгалах
        const now = new Date();
        const dateStr = `${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}`;
        XLSX.writeFile(wb, `Invent_Report_${dateStr}.xlsx`);

    } catch (error) {
        console.error("Excel Error:", error);
        alert("Excel файл бэлдэхэд алдаа гарлаа. Консол дээрх алдааг харна уу.");
    }
}

function checkRole(){
  let role = localStorage.getItem("role");

  // Хэрэв ажилтан бол дараах товчнуудыг хаана
  if(role === "employee"){
    const adminElements = [
      document.getElementById("addBtn"),     // Бараа нэмэх товч
      document.getElementById("excelBtn"),   // Excel татах товч
      document.getElementById("historyBtn")  // Түүх харах товч
    ];

    adminElements.forEach(el => {
      if(el) el.style.display = "none";
    });
  }
}

function showHistory() {
    let div = document.getElementById("items");
    
    // ХЭРЭВ history нь Array биш бол Array болгож хувиргах (Firebase-д зориулсан хамгаалалт)
    let historyList = Array.isArray(history) ? history : Object.values(history || {});

    div.innerHTML = `
        <div style="padding: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="margin:0; font-size: 1.2rem;">Үйлдлийн түүх</h2>
                <div style="display: flex; gap: 5px;">
                    <button onclick="printHistory()" style="background: #5856d6; color:white; border:none; border-radius:8px; padding: 8px 12px; font-size: 12px; cursor:pointer;">🖨 Хэвлэх</button>
                    <button onclick="clearHistory()" style="background: #ff3b30; color:white; border:none; border-radius:8px; padding: 8px 12px; font-size: 12px; cursor:pointer;">🗑 Цэвэрлэх</button>
                </div>
            </div>
            
            <div id="historyTable" style="display: flex; flex-direction: column; gap: 12px;">
                ${historyList.length === 0 ? '<p style="text-align:center; color:#888;">Одоогоор түүх байхгүй байна.</p>' : ''}
                ${historyList.map(h => `
                    <div style="background: white; border-radius: 12px; padding: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); border-left: 5px solid ${h.action === 'Нэмсэн' ? '#34c759' : '#ff3b30'};">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                            <span style="font-weight: bold; font-size: 14px; color: #333;">${h.user}</span>
                            <span style="font-size: 11px; color: #999;">${h.time}</span>
                        </div>
                        
                        <div style="margin-bottom: 5px;">
                            <small style="background: #f0f0f0; color: #666; padding: 2px 6px; border-radius: 4px; font-size: 10px; text-transform: uppercase;">
                                📁 ${h.itemCat || 'Бусад'}
                            </small>
                        </div>

                        <div style="font-size: 14px; margin-bottom: 4px;">
                            <b>${h.itemName}</b> <span style="color: #666; font-size: 12px;">(${h.itemCode})</span>
                        </div>

                        <div style="margin-bottom: 8px; font-size: 13px; color: #007aff; font-weight: bold;">
                            ${h.itemPrice ? h.itemPrice.toLocaleString() + '₮' : ''} 
                        </div>

                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="background: ${h.action === 'Нэмсэн' ? '#e8f5e9' : '#ffebee'}; 
                                         color: ${h.action === 'Нэмсэн' ? '#2e7d32' : '#c62828'}; 
                                         padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">
                                ${h.action}
                            </span>
                            <span style="font-size: 12px; color: #555;">📍 ${h.branchName}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
            <button onclick="showItems()" style="margin-top: 25px; width: 100%; background: #8e8e93; color:white; border:none; border-radius:12px; padding: 12px; font-weight:bold; cursor:pointer;">⬅ Буцах</button>
        </div>
    `;
}

function printHistory() {
    if (history.length === 0) {
        alert("Хэвлэх түүх байхгүй байна.");
        return;
    }

    let rows = history.map((h, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${h.time}</td>
            <td>${h.user}</td>
            <td>${h.itemCat || 'Бусад'}</td>
            <td><b>${h.itemName}</b><br><small>${h.itemCode}</small></td>
            <td style="text-align: right; font-weight: bold;">${h.itemPrice !== undefined ? h.itemPrice + '₮' : '0₮'}</td> <td style="color: ${h.action === 'Нэмсэн' ? '#28a745' : '#dc3545'}; font-weight:bold;">
                ${h.action}
            </td>
            <td>${h.branchName}</td>
        </tr>
    `).join('');

    const htmlContent = `
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: sans-serif; padding: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 11px; }
                th { background-color: #f2f2f2; }
                h2 { text-align: center; margin-bottom: 5px; }
                .header-info { text-align: center; font-size: 12px; margin-bottom: 20px; }
            </style>
        </head>
        <body>
            <h2>Бараа тооллогын үйлдлийн түүх</h2>
            <div class="header-info">Тайлан гаргасан: ${new Date().toLocaleString()}</div>
            <table>
                <thead>
                    <tr>
                        <th>№</th>
                        <th>Огноо</th>
                        <th>Хэрэглэгч</th>
                        <th>Категори</th>
                        <th>Бараа / Код</th>
                        <th>Үнэ</th> <th>Үйлдэл</th>
                        <th>Салбар</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </body>
        </html>
    `;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(htmlContent);
    doc.close();

    iframe.contentWindow.focus();
    setTimeout(() => {
        iframe.contentWindow.print();
        document.body.removeChild(iframe);
    }, 500);
}

function clearHistory() {
    if (confirm("Түүхийг бүрэн устгах уу?")) {
        db.ref('inventory/history').remove();
        showHistory();
    }
}

// Засах горим руу шилжих
function editMode(code) {
    document.getElementById("itemDisplay").style.display = "none";
    document.getElementById("itemEdit").style.display = "block";
}

// Өөрчлөлтийг хадгалах
function saveEdit(code) {
    let newName = document.getElementById("editName").value.trim();
    let newPrice = document.getElementById("editPrice").value;
    let item = items.find(i => i.code === code);
    
    if (item && newName) {
        item.name = newName;
        item.price = Number(newPrice) || 0;

        // save() гэхийн оронд шууд Firebase рүү:
        db.ref('inventory/items/' + item.id).update({
            name: item.name,
            price: item.price
        }).then(() => {
            showItems();
            openItem(code);
            alert("Амжилттай засагдлаа!");
        });
    }
}

function addColorInput() {
    let container = document.getElementById("colorContainer");
    let div = document.createElement("div");
    div.className = "color-input-group";
    div.style = "display:flex; gap:5px; margin-bottom:10px;";
    div.innerHTML = `
        <input type="text" class="variant-color" placeholder="Өнгө" style="flex:1; padding:10px;">
        <button type="button" onclick="this.parentElement.remove()" style="background:#ff3b30; color:white; border:none; padding:10px; border-radius:5px;">X</button>
    `;
    container.appendChild(div);
}

document.addEventListener("DOMContentLoaded", function() {
    const userRole = localStorage.getItem("role");

    if (userRole === "admin") {
        const adminElements = ["addBtn", "excelBtn", "historyBtn", "userViewBtn"];
        adminElements.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = "block";
        });
        
        const panel = document.getElementById("adminPanel");
        if (panel) panel.style.display = "none"; 
    } else {
        // Ажилтан бол бүгдийг нуух
        const adminElements = ["addBtn", "excelBtn", "historyBtn", "userViewBtn", "adminPanel"];
        adminElements.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = "none";
        });
    }
});

function loadUsers() {
    const container = document.getElementById("userList");
    if (!container) return;

    console.log("Firebase-ээс ажилчдыг татаж байна...");

    db.ref('users').on('value', (snapshot) => {
        container.innerHTML = "";
        const data = snapshot.val();

        if (!data) {
            container.innerHTML = "<p style='text-align:center; color:#888;'>Бүртгэлтэй ажилтан олдсонгүй.</p>";
            console.log("Дата хоосон байна (null)");
            return;
        }

        Object.keys(data).forEach((userId) => {
            const userData = data[userId];
            const card = document.createElement("div");
            card.style.cssText = `
                background: white;
                padding: 15px;
                border-radius: 12px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                box-shadow: 0 2px 5px rgba(0,0,0,0.05);
                margin-bottom: 10px;
                border: 1px solid #eee;
            `;
            
            card.innerHTML = `
                <div>
                    <div style="font-weight: bold; color: #1d1d1f;">${userData.username || 'Нэргүй'}</div>
                    <div style="font-size: 11px; color: #8e8e93;">${userData.email || ''}</div>
                </div>
                <button onclick="deleteUser('${userId}', '${userData.username}')" 
                        style="background: #ff3b30; color: white; border: none; padding: 8px 15px; border-radius: 8px; cursor: pointer; font-size: 12px;">
                    Устгах
                </button>
            `;
            container.appendChild(card);
        });
    }, (error) => {
        console.error("Firebase-ээс уншихад алдаа гарлаа:", error);
    });
}

// Хэрэглэгчийг Database-аас устгах функц
function deleteUser(id, name) {
    if (confirm(`'${name}' ажилтныг бүртгэлээс устгах уу?`)) {
        firebase.database().ref('users/' + id).remove()
            .then(() => alert("Амжилттай устгагдлаа."))
            .catch((error) => alert("Алдаа гарлаа: " + error.message));
    }
}

// Панелыг нээж хаах функц
function toggleAdminPanel() {
    const panel = document.getElementById("adminPanel");
    if (!panel) return;

    if (panel.style.display === "none" || panel.style.display === "") {
        panel.style.display = "block";
        loadUsers(); // Нээх үед датаг Firebase-аас татна
        
        // Зөөлөн гүйлгэж харуулах
        setTimeout(() => {
            panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    } else {
        panel.style.display = "none";
    }
}