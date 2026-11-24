/* ==========================================================================
   Fan Di — script.js (ใช้ร่วมกันทุกหน้า)
   ตรวจว่าอยู่หน้าไหนจาก id ของ element แล้วทำงานเฉพาะหน้านั้น
     product.html : #filter-bar, #product-list
     order.html   : #orderForm, #customerName, #contact, #items, #total, #note
     admin.html   : #ordersTable tbody
   ========================================================================== */
(function () {
  'use strict';

  var SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxf1pYCQ0Y8IqMvEX9vF8pMAh6RVs7H4e5jsUUityMh4ZxmPVU4ZL203yeGgrND95uo/exec';
  var CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQxqL1Rwt1MnUXiIAXk-uUJbvoDU4tL5Pn8xj8X_nOrkEWCII-4SSH0PjLynrJdcm3UB9SjSAH_eQG1/pub?gid=0&single=true&output=csv';

  /* ------------------------------------------------------------------------
     1) product.html — โหลดสินค้า, ปุ่มกรอง mood, ?mood=
     หมายเหตุ: fetch('products.json') ต้องเปิดผ่านเว็บเซิร์ฟเวอร์ (ไม่ใช่ file://)
     ------------------------------------------------------------------------ */
  function initProductPage() {
    var filterBar = document.getElementById('filter-bar');
    var productList = document.getElementById('product-list');

    // key  = ค่าที่ใช้ใน ?mood=   |  mood = ค่า mood ใน products.json
    // ?mood= รับได้ทั้งแบบ key (salt/charcoal/mint) และแบบ mood (romance/confident/fresh/sweet)
    // hidden = ไม่แสดงเป็นปุ่ม แต่รับค่าจาก URL ได้ (sweet ยังไม่มีสินค้า)
    var FILTERS = [
      { key: 'all',      label: 'ทั้งหมด', mood: null },
      { key: 'salt',     label: 'Salt',     mood: 'romance' },
      { key: 'charcoal', label: 'Charcoal', mood: 'confident' },
      { key: 'mint',     label: 'Mint',     mood: 'fresh' },
      { key: 'sweet',    label: 'Sweet',    mood: 'sweet', hidden: true }
    ];

    var allProducts = [];
    var activeKey = 'all';

    function resolveFilterKey(value) {
      if (!value) return 'all';
      value = String(value).toLowerCase();
      for (var i = 0; i < FILTERS.length; i++) {
        if (FILTERS[i].key === value || FILTERS[i].mood === value) return FILTERS[i].key;
      }
      return 'all';
    }

    function renderFilters() {
      filterBar.innerHTML = '';
      FILTERS.forEach(function (f) {
        if (f.hidden) return;

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'filter-btn' + (f.mood ? ' mood-' + f.mood : '') + (f.key === activeKey ? ' is-active' : '');
        btn.dataset.key = f.key;

        if (f.mood) {
          var dot = document.createElement('span');
          dot.className = 'mood-dot';
          btn.appendChild(dot);
        }
        btn.appendChild(document.createTextNode(f.label));

        btn.addEventListener('click', function () {
          setFilter(f.key, true);
        });
        filterBar.appendChild(btn);
      });
    }

    function setFilter(key, updateUrl) {
      activeKey = key;
      renderFilters();
      renderProducts();

      if (updateUrl) {
        var url = new URL(window.location.href);
        if (key === 'all') url.searchParams.delete('mood');
        else url.searchParams.set('mood', key);
        history.replaceState(null, '', url);
      }
    }

    function buildOrderUrl(p) {
      var params = new URLSearchParams();
      params.set('item', p.name + ' ' + p.size);
      params.set('price', p.price);
      return 'order.html?' + params.toString();
    }

    function createCard(p) {
      var card = document.createElement('article');
      card.className = 'product-card mood-' + p.mood;

      var media = document.createElement('div');
      media.className = 'product-card__media';
      var img = document.createElement('img');
      img.src = p.image;
      img.alt = p.name + ' ' + p.size;
      img.loading = 'lazy';
      img.addEventListener('error', function () { img.style.visibility = 'hidden'; });
      media.appendChild(img);

      var body = document.createElement('div');
      body.className = 'product-card__body';

      var name = document.createElement('h3');
      name.className = 'product-card__name';
      var dot = document.createElement('span');
      dot.className = 'mood-dot';
      dot.style.marginRight = '0.6rem';
      name.appendChild(dot);
      name.appendChild(document.createTextNode(p.name));

      var meta = document.createElement('p');
      meta.className = 'product-card__meta';
      meta.textContent = 'ขนาด ' + p.size;

      var footer = document.createElement('div');
      footer.className = 'product-card__footer';

      var price = document.createElement('span');
      price.className = 'price';
      price.textContent = Number(p.price).toLocaleString('th-TH');
      var unit = document.createElement('small');
      unit.textContent = 'บาท';
      price.appendChild(unit);

      var buy = document.createElement('a');
      buy.className = 'btn btn--small';
      buy.href = buildOrderUrl(p);
      buy.textContent = 'สั่งซื้อ';

      footer.appendChild(price);
      footer.appendChild(buy);

      body.appendChild(name);
      body.appendChild(meta);
      body.appendChild(footer);

      card.appendChild(media);
      card.appendChild(body);
      return card;
    }

    function showMessage(text) {
      productList.innerHTML = '';
      var p = document.createElement('p');
      p.className = 'empty-state';
      p.textContent = text;
      productList.appendChild(p);
    }

    function renderProducts() {
      var active = FILTERS.filter(function (f) { return f.key === activeKey; })[0];
      var items = allProducts.filter(function (p) {
        return !active.mood || p.mood === active.mood;
      });

      if (!items.length) {
        showMessage('สูตรนี้ยังไม่พร้อมจำหน่าย ติดตามได้เร็วๆ นี้');
        return;
      }

      productList.innerHTML = '';
      items.forEach(function (p) {
        productList.appendChild(createCard(p));
      });
    }

    activeKey = resolveFilterKey(new URLSearchParams(window.location.search).get('mood'));
    renderFilters();
    showMessage('กำลังโหลดสินค้า...');

    fetch('products.json')
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        allProducts = data;
        renderProducts();
      })
      .catch(function (err) {
        console.error(err);
        showMessage('ไม่สามารถโหลดข้อมูลสินค้าได้ กรุณาลองใหม่อีกครั้ง');
      });
  }

  /* ------------------------------------------------------------------------
     2) order.html — เติมฟอร์มจาก ?item=&price= และส่งข้อมูลไป Apps Script
     ------------------------------------------------------------------------ */
  function initOrderPage() {
    var form = document.getElementById('orderForm');
    var submitBtn = form.querySelector('[type="submit"]');

    // เติม #items และ #total ทันทีที่โหลดหน้า
    var params = new URLSearchParams(window.location.search);
    var item = params.get('item');
    var price = params.get('price');

    if (item) document.getElementById('items').value = item;
    if (price) document.getElementById('total').value = price;

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      if (typeof form.checkValidity === 'function' && !form.checkValidity()) {
        if (typeof form.reportValidity === 'function') form.reportValidity();
        return;
      }

      var payload = {
        customerName: document.getElementById('customerName').value.trim(),
        contact: document.getElementById('contact').value.trim(),
        items: document.getElementById('items').value.trim(),
        total: document.getElementById('total').value.trim(),
        note: document.getElementById('note').value.trim()
      };

      if (submitBtn) submitBtn.disabled = true;

      // pattern นี้ห้ามแก้: ไม่ตั้ง headers และไม่ใช้ mode: 'no-cors'
      fetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(payload)
      })
      .then(() => { window.location.href = 'thankyou.html'; })
      .catch(error => {
        console.error(error);
        alert('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
        if (submitBtn) submitBtn.disabled = false;
      });
    });
  }

  /* ------------------------------------------------------------------------
     3) admin.html — ดึง CSV จาก Google Sheets แสดงเป็นตาราง (ล่าสุดก่อน)
     ------------------------------------------------------------------------ */

  // parse CSV เอง: รองรับ "..." , "" แทนเครื่องหมายคำพูด, ขึ้นบรรทัดใหม่ในช่อง, CRLF, BOM
  function parseCSV(text) {
    if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);

    var rows = [];
    var row = [];
    var field = '';
    var inQuotes = false;

    for (var i = 0; i < text.length; i++) {
      var c = text[i];

      if (inQuotes) {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; }
          else inQuotes = false;
        } else {
          field += c;
        }
      } else {
        if (c === '"') {
          inQuotes = true;
        } else if (c === ',') {
          row.push(field);
          field = '';
        } else if (c === '\n' || c === '\r') {
          if (c === '\r' && text[i + 1] === '\n') i++;
          row.push(field);
          field = '';
          rows.push(row);
          row = [];
        } else {
          field += c;
        }
      }
    }

    if (field !== '' || row.length) {
      row.push(field);
      rows.push(row);
    }

    // ตัดแถวว่าง
    return rows.filter(function (r) {
      return r.some(function (cell) { return cell.trim() !== ''; });
    });
  }

  function initAdminPage() {
    var tbody = document.querySelector('#ordersTable tbody');

    function formatMoney(value) {
      var n = Number(String(value).replace(/,/g, ''));
      if (value === '' || isNaN(n)) return value;
      return n.toLocaleString('th-TH') + ' บาท';
    }

    function showStatus(text) {
      tbody.innerHTML = '';
      var tr = document.createElement('tr');
      var td = document.createElement('td');
      td.colSpan = 6;
      td.className = 'status-cell';
      td.textContent = text;
      tr.appendChild(td);
      tbody.appendChild(tr);
    }

    function renderOrders(rows) {
      // แถวแรกคือหัวคอลัมน์ / ชีตเพิ่มรายการใหม่ต่อท้าย จึงกลับลำดับให้ล่าสุดขึ้นก่อน
      var data = rows.slice(1).reverse();

      if (!data.length) {
        showStatus('ยังไม่มีรายการสั่งซื้อ');
        return;
      }

      tbody.innerHTML = '';
      data.forEach(function (r) {
        var tr = document.createElement('tr');
        for (var i = 0; i < 6; i++) {
          var td = document.createElement('td');
          var value = r[i] === undefined ? '' : r[i];
          if (i === 4) {
            td.className = 'num';
            td.textContent = formatMoney(value);
          } else {
            td.textContent = value; // textContent กัน HTML/สคริปต์แทรกจากข้อมูลลูกค้า
          }
          tr.appendChild(td);
        }
        tbody.appendChild(tr);
      });
    }

    showStatus('กำลังโหลดข้อมูล...');

    // ใส่ timestamp กันเบราว์เซอร์แคช
    fetch(CSV_URL + '&t=' + Date.now())
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.text();
      })
      .then(function (text) {
        renderOrders(parseCSV(text));
      })
      .catch(function (err) {
        console.error(err);
        showStatus('ไม่สามารถโหลดข้อมูลได้ กรุณารีเฟรชหน้าอีกครั้ง');
      });
  }

  /* ------------------------------------------------------------------------
     Boot
     ------------------------------------------------------------------------ */
  function boot() {
    if (document.getElementById('product-list') && document.getElementById('filter-bar')) initProductPage();
    if (document.getElementById('orderForm')) initOrderPage();
    if (document.querySelector('#ordersTable tbody')) initAdminPage();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
