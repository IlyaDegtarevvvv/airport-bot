require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const http = require('http');

const FORUM_ID = process.env.FORUM_ID;
const WEB_APP_URL = process.env.RENDER_EXTERNAL_URL || 'https://google.com';

// 1. ПРЕМИАЛЬНЫЙ GLASSMORPHISM ИНТЕРФЕЙС С ПОЛЕМ ВВОДА
const htmlContent = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Диспетчерская Аэропорта</title>
  <script src="https://telegram.org/js/telegram-web-app.js"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
    
    :root {
      --bg-color: #0f172a;
      --card-bg: rgba(255, 255, 255, 0.05);
      --card-border: rgba(255, 255, 255, 0.1);
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --accent: #3b82f6;
    }
    
    * { box-sizing: border-box; font-family: 'Inter', sans-serif; }
    
    body {
      margin: 0; padding: 20px; min-height: 100vh;
      background: radial-gradient(circle at 15% 50%, #1e293b, #0f172a);
      color: var(--text-main);
      overflow-x: hidden;
    }
    
    /* Изюминка: парящие неоновые сферы на фоне */
    .bg-glow {
      position: absolute; top: -50px; left: -50px; width: 200px; height: 200px;
      background: #3b82f6; filter: blur(100px); opacity: 0.4; z-index: -1;
      animation: float 6s ease-in-out infinite;
    }
    .bg-glow-2 {
      position: absolute; bottom: -50px; right: -50px; width: 200px; height: 200px;
      background: #8b5cf6; filter: blur(100px); opacity: 0.3; z-index: -1;
      animation: float 8s ease-in-out infinite reverse;
    }
    
    @keyframes float {
      0% { transform: translateY(0px); }
      50% { transform: translateY(30px); }
      100% { transform: translateY(0px); }
    }
    
    .container { max-width: 400px; margin: 0 auto; position: relative; z-index: 1; }
    
    h3 { text-align: center; font-weight: 600; font-size: 24px; margin-bottom: 5px; }
    p.subtitle { text-align: center; color: var(--text-muted); font-size: 14px; margin-bottom: 25px; margin-top: 0; }
    
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    
    /* Эффект матового стекла для карточек */
    .card {
      background: var(--card-bg); border: 1px solid var(--card-border);
      backdrop-filter: blur(12px); border-radius: 20px; padding: 20px 10px;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .card:active { transform: scale(0.95); background: rgba(255, 255, 255, 0.1); }
    .emoji { font-size: 32px; margin-bottom: 10px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.2)); }
    .title { font-size: 14px; font-weight: 500; letter-spacing: 0.5px; }
    
    .hidden { display: none !important; }
    
    /* Форма ввода (Второй экран) */
    .input-group { margin-bottom: 20px; }
    label { display: block; margin-bottom: 8px; color: var(--text-muted); font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
    
    .prio-selector { display: flex; gap: 8px; margin-bottom: 20px; }
    .prio-btn {
      flex: 1; padding: 12px 5px; border-radius: 12px; border: 1px solid var(--card-border);
      background: var(--card-bg); color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer; transition: 0.2s;
    }
    
    .prio-btn.active[data-val="Критическая"] { background: #ef4444; color: #fff; border-color: #ef4444; box-shadow: 0 0 15px rgba(239, 68, 68, 0.4); }
    .prio-btn.active[data-val="Высокая"] { background: #f97316; color: #fff; border-color: #f97316; box-shadow: 0 0 15px rgba(249, 115, 22, 0.4); }
    .prio-btn.active[data-val="Обычная"] { background: #10b981; color: #fff; border-color: #10b981; box-shadow: 0 0 15px rgba(16, 185, 129, 0.4); }
    
    textarea {
      width: 100%; height: 100px; border-radius: 16px; padding: 15px;
      background: rgba(0, 0, 0, 0.2); border: 1px solid var(--card-border);
      color: var(--text-main); font-size: 15px; resize: none; outline: none; transition: 0.3s;
    }
    textarea:focus { border-color: var(--accent); box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2); }
    textarea::placeholder { color: #475569; }
    
    .submit-btn {
      width: 100%; padding: 16px; border-radius: 16px; border: none;
      background: var(--accent); color: white; font-size: 16px; font-weight: 600;
      margin-bottom: 12px; cursor: pointer; transition: 0.2s; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
    }
    .submit-btn:active { transform: scale(0.97); }
    .back-btn { background: transparent; border: 1px solid var(--card-border); color: var(--text-muted); box-shadow: none; }
    
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    .step { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  </style>
</head>
<body>
  <div class="bg-glow"></div>
  <div class="bg-glow-2"></div>

  <div class="container">
    <!-- ЭКРАН 1: Выбор отдела -->
    <div id="step1" class="step">
      <h3>Отделы</h3>
      <p class="subtitle">Куда направим обращение?</p>
      <div class="grid">
          <div class="card" onclick="selectDept('ОМК')"><span class="emoji">🛍</span><span class="title">ОМК</span></div>
          <div class="card" onclick="selectDept('ТИСТО')"><span class="emoji">🚰</span><span class="title">ТИСТО</span></div>
          <div class="card" onclick="selectDept('ЭСТОП')"><span class="emoji">⚡️</span><span class="title">ЭСТОП</span></div>
          <div class="card" onclick="selectDept('СЭЗИС')"><span class="emoji">🛠</span><span class="title">СЭЗИС</span></div>
          <div class="card" onclick="selectDept('АВК')"><span class="emoji">🧹</span><span class="title">АВК</span></div>
          <div class="card" onclick="selectDept('ССТиР')"><span class="emoji">🛗</span><span class="title">ССТиР</span></div>
          <div class="card" onclick="selectDept('ТСБиА')"><span class="emoji">🚨</span><span class="title">ТСБиА</span></div>
          <div class="card" onclick="selectDept('ПТБ')"><span class="emoji">🛂</span><span class="title">ПТБ</span></div>
      </div>
    </div>

    <!-- ЭКРАН 2: Детали заявки -->
    <div id="step2" class="step hidden">
      <h3 id="dept-title">Детали</h3>
      <p class="subtitle">Уточните параметры</p>
      
      <div class="input-group">
        <label>Уровень срочности</label>
        <div class="prio-selector">
          <button class="prio-btn" data-val="Критическая" onclick="setPriority(this, 'Критическая')">Авария</button>
          <button class="prio-btn" data-val="Высокая" onclick="setPriority(this, 'Высокая')">Высокая</button>
          <button class="prio-btn active" data-val="Обычная" onclick="setPriority(this, 'Обычная')">Обычная</button>
        </div>
      </div>

      <div class="input-group">
        <label>Что случилось?</label>
        <textarea id="desc" placeholder="Например: Прорвало трубу в кафе..."></textarea>
      </div>
      
      <button class="submit-btn" onclick="sendData()">Отправить заявку</button>
      <button class="submit-btn back-btn" onclick="goBack()">Назад</button>
    </div>
  </div>

  <script>
    let tg = window.Telegram.WebApp;
    tg.expand();
    
    let selectedDept = '';
    let selectedPriority = 'Обычная';
    
    function selectDept(dept) {
        tg.HapticFeedback.impactOccurred('light');
        selectedDept = dept;
        document.getElementById('step1').classList.add('hidden');
        
        let step2 = document.getElementById('step2');
        step2.classList.remove('hidden');
        step2.style.animation = 'none';
        step2.offsetHeight; 
        step2.style.animation = null; 
    }
    
    function setPriority(btn, val) {
        tg.HapticFeedback.impactOccurred('light');
        selectedPriority = val;
        document.querySelectorAll('.prio-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }

    function goBack() {
        tg.HapticFeedback.impactOccurred('light');
        document.getElementById('step2').classList.add('hidden');
        let step1 = document.getElementById('step1');
        step1.classList.remove('hidden');
        step1.style.animation = 'none';
        step1.offsetHeight; 
        step1.style.animation = null;
    }
    
    function sendData() {
        let text = document.getElementById('desc').value.trim();
        if(!text) {
            tg.showAlert('Пожалуйста, опишите суть проблемы');
            return;
        }
        tg.HapticFeedback.notificationOccurred('success');
        let data = { 
            department: selectedDept, 
            priority: selectedPriority,
            description: text
        };
        tg.sendData(JSON.stringify(data));
    }
  </script>
</body>
</html>`;

// 2. СЕРВЕР RENDER
const port = process.env.PORT || 3000;
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(htmlContent);
}).listen(port, () => console.log(`🌐 Сервер запущен на порту ${port}`));

// 3. БОТ
const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) => {
    ctx.reply(
        'Добро пожаловать в систему диспетчеризации аэропорта! ✈️\n\nВоспользуйтесь кнопкой в нижнем меню, чтобы создать обращение.',
        Markup.keyboard([
            Markup.button.webApp('📝 Создать обращение', WEB_APP_URL)
        ]).resize()
    );
});

bot.on('message', async (ctx) => {
    if (ctx.message && ctx.message.web_app_data) {
        try {
            const data = JSON.parse(ctx.message.web_app_data.data);
            const dept = data.department;
            const priority = data.priority;
            
            // Защита от спецсимволов HTML, чтобы бот не ломался
            const desc = (data.description || 'Описание не предоставлено')
                            .replace(/</g, "&lt;")
                            .replace(/>/g, "&gt;");
            
            const emojis = {
                'ОМК': '🛍', 'ТИСТО': '🚰', 'ЭСТОП': '⚡️',
                'СЭЗИС': '🛠', 'АВК': '🧹', 'ССТиР': '🛗',
                'ТСБиА': '🚨', 'ПТБ': '🛂'
            };
            const emoji = emojis[dept] || '📌';
            const userName = ctx.from.username ? `@${ctx.from.username}` : ctx.from.first_name;

            // Жесткая проверка ID
            if (!FORUM_ID) {
                throw new Error("FORUM_ID не задан!");
            }

            const topicTitle = `[${dept}] ${emoji} Заявка от ${ctx.from.first_name}`;
            const topic = await ctx.telegram.createForumTopic(FORUM_ID, topicTitle);
            
            // Используем HTML парсинг, он намного надежнее
            const messageText = `🚨 <b>НОВОЕ ОБРАЩЕНИЕ</b>\n\n🏢 <b>Отдел:</b> ${dept}\n⚠️ <b>Срочность:</b> ${priority}\n👤 <b>Отправитель:</b> ${userName}\n\n📝 <b>Описание проблемы:</b>\n<i>${desc}</i>`;

            await ctx.telegram.sendMessage(FORUM_ID, messageText, { 
                message_thread_id: topic.message_thread_id,
                parse_mode: 'HTML'
            });

            ctx.reply(`✅ Ваша заявка успешно передана в отдел ${dept}! (Срочность: ${priority})`);

        } catch (error) {
            console.error('Ошибка при обработке:', error);
            ctx.reply('❌ Ошибка. Убедитесь, что в Render правильно указан FORUM_ID (с минусом), а бот является админом диспетчерской.');
        }
    }
});

bot.launch().then(() => console.log('✈️ Бот и интерфейс успешно запущены!'));
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
