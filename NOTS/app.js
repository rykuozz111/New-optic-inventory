// AUTH CHECK
if(localStorage.getItem("auth") !== "true"){
  window.location.href = "index.html";
}

// LOAD DATA
let items = JSON.parse(localStorage.getItem("items")) || [];
let history = JSON.parse(localStorage.getItem("inventory_history")) || [];

function saveHistory(entry) {
    history.unshift(entry); // Шинэ үйлдлийг эхэнд нь нэмнэ
    if (history.length > 200) history.pop(); // Сүүлийн 200-г л хадгална
    localStorage.setItem("inventory_history", JSON.stringify(history));
}

// SAVE
function save() {
    localStorage.setItem("items", JSON.stringify(items));
}

// OPEN DETAIL
let selectedColor = ""; // Сонгосон өнгийг хадгалах хувьсагч

function openItem(code) {
    let item = items.find(i => i.code === code);
    let isAdmin = localStorage.getItem("role") === "admin";
    if (!item) return;

    // АЮУЛГҮЙ БАЙДАЛ: Хэрэв variants байхгүй бол үүсгэх
    if (!item.variants || item.variants.length === 0) {
        item.variants = [{ color: "Үндсэн", branches: item.branches || { b1: 0, b2: 0, b3: 0 } }];
    }

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
            box-sizing: border-box; /* ⬅️ Хэмжээг халихаас хамгаална */
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
                `).join('') : ''}
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
        variant.branches[branch] += change;
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
        save();
        openItem(code); // Цонхыг шинэчлэх
    });
}

function addNewColor(code) {
    let colorName = prompt("Шинэ өнгөний нэр:");
    if (!colorName) return;
    let item = items.find(i => i.code === code);
    if (item.variants.some(v => v.color === colorName)) return alert("Энэ өнгө байна!");
    
    item.variants.push({ color: colorName, branches: { b1: 0, b2: 0, b3: 0 } });
    save();
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

    save();
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

      save();
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
    let category = document.getElementById("cat").value;

    // Бүх өнгөний input-үүдээс утгыг нь цуглуулж авах
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
        name,
        code,
        price: Number(price) || 0,
        category,
        variants: variants // "Үндсэн" гэж байхгүй, шууд чиний нэмсэн өнгөнүүд
    };

    items.push(newItem);
    save();
    closeModal();
    showItems();
    
    // Формыг анхны байдалд нь оруулах (Цэвэрлэх)
    document.getElementById("colorContainer").innerHTML = `
        <div class="color-input-group" style="display:flex; gap:5px; margin-bottom:10px;">
            <input type="text" class="variant-color" placeholder="Өнгө" style="flex:1; padding:10px;">
            <button type="button" onclick="this.parentElement.remove()" style="background:#ff3b30; color:white; border:none; padding:10px; border-radius:5px;">X</button>
        </div>
    `;
    alert("Амжилттай нэмэгдлээ!");
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
    items = items.filter(i => i.code !== code);
    save();
    showItems();
    closeDetail();
}

function saveMonthlyReport(){
  let reports = JSON.parse(localStorage.getItem("reports")) || [];

  let now = new Date();
  let month = now.toISOString().slice(0,7); // 2026-04

  // аль хэдийн хадгалсан эсэх
  if(reports.some(r => r.month === month)){
    alert("Энэ сарын тайлан аль хэдийн хадгалагдсан!");
    return;
  }

  let snapshot = items.map(i => ({
    name: i.name,
    code: i.code,
    branches: i.branches
  }));

  reports.push({
    month,
    data: snapshot
  });

  localStorage.setItem("reports", JSON.stringify(reports));

  alert("Сарын тайлан хадгалагдлаа!");
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

    filteredItems.forEach(i => {
        htmlContent += `
            <div class="card" onclick="openItem('${i.code}')" style="
                cursor: pointer; background: white; padding: 15px; border-radius: 12px; 
                margin-bottom: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                position: relative;
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

  if(role === "employee"){
    // ❌ нуух
    document.getElementById("addBtn").style.display = "none";
    document.getElementById("excelBtn").style.display = "none";
    document.getElementById("addBtn").style.display = "none";
    document.getElementById("excelBtn").style.display = "none";
    document.getElementById("historyBtn").style.display = "none";
  }
}

checkRole();
showItems();

function showHistory() {
    let div = document.getElementById("items");
    div.innerHTML = `
        <div style="padding: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="margin:0; font-size: 1.2rem;">Үйлдлийн түүх</h2>
                <div style="display: flex; gap: 5px;">
                    <button onclick="printHistory()" style="background: #5856d6; padding: 8px 12px; font-size: 12px;">🖨 Хэвлэх</button>
                    <button onclick="clearHistory()" style="background: #ff3b30; padding: 8px 12px; font-size: 12px;">🗑 Цэвэрлэх</button>
                </div>
            </div>
            
            <div id="historyTable" style="display: flex; flex-direction: column; gap: 12px;">
                ${history.length === 0 ? '<p style="text-align:center; color:#888;">Одоогоор түүх байхгүй байна.</p>' : ''}
                ${history.map(h => `
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
                            ${h.itemPrice ? h.itemPrice + '₮' : ''} 
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
            <button onclick="showItems()" style="margin-top: 25px; width: 100%; background: #8e8e93; padding: 12px;">⬅ Буцах</button>
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
    if (confirm("Түүхийг бүрэн устгаж, шинээр эхлүүлэх үү? (Татаж авсныхаа дараа устгана уу)")) {
        history = [];
        localStorage.setItem("inventory_history", JSON.stringify(history));
        showHistory(); // Дэлгэцийг шинэчлэх
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
        save();
        showItems();
        openItem(code);
        alert("Засагдлаа!");
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