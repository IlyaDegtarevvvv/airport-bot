require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const http = require('http');

const FORUM_ID = process.env.FORUM_ID;
const WEB_APP_URL = process.env.RENDER_EXTERNAL_URL || 'https://google.com';

// 1. ВШИВАЕМ ПРЕМИАЛЬНЫЙ ИНТЕРФЕЙС
const htmlContent = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Диспетчерская Аэропорта</title>
  <script src="https://telegram.org/js/telegram-web-app.js"></script>
  <style>
    :root {
      --bg-color: var(--tg-theme-bg-color, #f3f4f6);
      --text-color: var(--tg-theme-text-color, #1f2937);
      --hint-color: var(--tg-theme-hint-color, #6b7280);
    }
    
    * { box-sizing: border-box; }
    
    body { 
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: linear-gradient(135deg, var(--bg-color) 0%, #e5e7eb 100%);
      color: var(--text-color);
      margin: 0; 
      padding: 20px; 
      min-height: 100vh;
    }

    /* Адаптация под темную тему Telegram */
    @media (prefers-color-scheme: dark) {
        body { background: linear-gradient(135deg, var(--bg-color) 0%, #1f2937 100%); }
    }
    
    .container {
      max-width: 400px;
      margin: 0 auto;
    }
    
    h3 { 
      text-align: center; 
      font-weight: 600; 
      margin-bottom: 5px; 
      font-size: 22px;
    }
    
    p.subtitle {
      text-align: center;
      color: var(--hint-color);
      font-size: 14px;
      margin-bottom: 25px;
      margin-top: 0;
    }
    
    .grid { 
      display: grid; 
      grid-template-columns: 1fr 1fr; 
      gap: 15px; 
    }
    
    .card { 
      background: var(--tg-theme-bg-color, #ffffff);
      border: 1px solid rgba(0,0,0,0.05);
      border-radius: 20px; 
      padding: 20px 10px;
      display: flex; 
      flex-direction: column; 
      align-items: center; 
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(0,0,0,0.04);
      transition: all 0.25s cubic-bezier(0.1, 0.7, 0.1, 1);
    }
    
    .card:active { 
      transform: scale(0.93);
      box-shadow: 0 1px 5px rgba(0,0,0,0.05);
    }
    
    .emoji { font-size: 32px; margin-bottom: 8px; }
    .title { font-size: 14px; font-weight: 600; }
    
    .hidden { display: none !important; }
    
    .priority-btn {
      width: 100%;
      padding: 16px;
      border-radius: 16px;
      border: none;
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 15px;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 4px 10px rgba(0,0,0,0.1);
    }
    
    .priority-btn:active { transform: scale(0.97); }
    
    .btn-crit { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; }
    .btn-high { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; }
    .btn-norm { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; }
    .btn-back { background: var(--tg-theme-secondary-bg-color, #e5e7eb); color: var(--text-color); box-shadow: none; margin-top: 10px; }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(15px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .step { animation: fadeIn 0.4s ease-out forwards; }
  </style>
</head>
<body>
  <div class="container">
    <!-- ШАГ 1: Выбор отдела -->
    <div id="step1" class="step">
      <h3>Диспетчерская</h3>
      <p class="subtitle">Выберите отдел для обращения</p>
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

    <!-- ШАГ 2: Выбор срочности -->
    <div id="step2" class="step hidden">
      <h3 id="dept-title">Укажите срочность</h3>
      <p class="subtitle">Как быстро нужно решить проблему?</p>
      
      <button class="priority-btn btn-crit" onclick="sendData('Критическая')">🔥 Критическая (Авария)</button>
      <button class="priority-btn btn-high" onclick="sendData('Высокая')">⚡ Высокая</button>
      <button class="priority-btn btn-norm" onclick="sendData('Обычная')">✅ Обычная</button>
      
      <button class="priority-btn btn-back" onclick="goBack()">⬅️ Назад к отделам</button>
    </div>
  </div>

  <script>
    let tg = window.Telegram.WebApp;
    tg.expand();
    
    let selectedDept = '';
    
    function selectDept(dept) {
        // Визуальный отклик (вибрация, если телефон поддерживает)
        tg.HapticFeedback.impactOccurred('light');
        
        selectedDept = dept;
        document.getElementById('dept-title').innerText = 'Отдел: ' + dept;
        document.getElementById('step1').classList.add('hidden');
        
        // Перезапускаем анимацию появления
        let step2 = document.getElementById('step2');
        step2.classList.remove('hidden');
        step2.style.animation = 'none';
        step2.offsetHeight; 
        step2.style.animation = null; 
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
    
    function sendData(priority) {
        tg.HapticFeedback.notificationOccurred('success');
        let data = { department: selectedDept, priority: priority };
        tg.sendData(JSON.stringify(data));
        // Приложение само закроется после отправки
    }
  </script>
</body>
</html>`;

// 2. ЗАПУСКАЕМ СЕРВЕР
const port = process.env.PORT || 3000;
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(htmlContent);
}).listen(port, () => console.log(`🌐 Сервер запущен на порту ${port}`));

// 3. ЗАПУСКАЕМ БОТА
const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) => {
    ctx.reply(
        'Добро пожаловать в систему диспетчеризации аэропорта! ✈️\n\nВоспользуйтесь кнопкой в нижнем меню, чтобы создать обращение.',
        // ГЛАВНЫЙ ФИКС: Делаем обычную клавиатуру вместо Inline, чтобы Telegram разрешил отправку данных
        Markup.keyboard([
            Markup.button.webApp('📝 Создать обращение', WEB_APP_URL)
        ]).resize()
    );
});

bot.on('message', async (ctx) => {
    // Ловим данные из приложения
    if (ctx.message && ctx.message.web_app_data) {
        try {
            const data = JSON.parse(ctx.message.web_app_data.data);
            const dept = data.department;
            const priority = data.priority;
            
            const emojis = {
                'ОМК': '🛍', 'ТИСТО': '🚰', 'ЭСТОП': '⚡️',
                'СЭЗИС': '🛠', 'АВК': '🧹', 'ССТиР': '🛗',
                'ТСБиА': '🚨', 'ПТБ': '🛂'
            };
            const emoji = emojis[dept] || '📌';
            const userName = ctx.from.username ? `@${ctx.from.username}` : ctx.from.first_name;

            const topicTitle = `[${dept}] ${emoji} Заявка от ${ctx.from.first_name}`;
            const topic = await ctx.telegram.createForumTopic(FORUM_ID, topicTitle);
            
            const messageText = `🚨 **НОВОЕ ОБРАЩЕНИЕ**\n\n🏢 **Отдел:** ${dept}\n⚠️ **Срочность:** ${priority}\n👤 **Отправитель:** ${userName}\n\n*Тут будет текст самой проблемы...*`;

            await ctx.telegram.sendMessage(FORUM_ID, messageText, { 
                message_thread_id: topic.message_thread_id,
                parse_mode: 'Markdown'
            });

            // Подтверждаем и оставляем кнопку для новых заявок
            ctx.reply(`✅ Ваша заявка успешно передана в отдел ${dept}! (Срочность: ${priority})`);

        } catch (error) {
            console.error('Ошибка при обработке:', error);
            ctx.reply('❌ Произошла ошибка при обработке вашей заявки.');
        }
    }
});

bot.launch().then(() => console.log('✈️ Бот и интерфейс успешно запущены!'));
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
