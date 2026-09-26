require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const http = require('http');

const FORUM_ID = process.env.FORUM_ID;
// Render автоматически подставит сюда бесплатную ссылку на твоего бота (например, https://airport-bot.onrender.com)
const WEB_APP_URL = process.env.RENDER_EXTERNAL_URL || 'https://google.com';

// 1. ВШИВАЕМ ИНТЕРФЕЙС ПРЯМО В БОТА
const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Аэропорт Диспетчерская</title>
  <script src="https://telegram.org/js/telegram-web-app.js"></script>
  <style>
    body { font-family: sans-serif; background: var(--tg-theme-bg-color, #f4f4f5); color: var(--tg-theme-text-color, #000); padding: 15px; margin: 0; }
    h3 { text-align: center; margin-bottom: 20px; }
    .btn { display: flex; align-items: center; justify-content: center; width: 100%; padding: 15px; border-radius: 12px; border: none; background: var(--tg-theme-button-color, #3390ec); color: var(--tg-theme-button-text-color, #fff); font-size: 15px; font-weight: bold; cursor: pointer; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
    .btn:active { opacity: 0.8; }
    .hidden { display: none; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .grid .btn { height: 80px; margin-bottom: 0; text-align: center; flex-direction: column; gap: 5px; }
    .emoji { font-size: 24px; }
    .priority-btn { margin-bottom: 15px; }
  </style>
</head>
<body>
  <div id="step1">
    <h3>Выберите отдел назначения:</h3>
    <div class="grid">
        <button class="btn" onclick="selectDept('ОМК')"><span class="emoji">🛍</span> ОМК</button>
        <button class="btn" onclick="selectDept('ТИСТО')"><span class="emoji">🚰</span> ТИСТО</button>
        <button class="btn" onclick="selectDept('ЭСТОП')"><span class="emoji">⚡️</span> ЭСТОП</button>
        <button class="btn" onclick="selectDept('СЭЗИС')"><span class="emoji">🛠</span> СЭЗИС</button>
        <button class="btn" onclick="selectDept('АВК')"><span class="emoji">🧹</span> АВК</button>
        <button class="btn" onclick="selectDept('ССТиР')"><span class="emoji">🛗</span> ССТиР</button>
        <button class="btn" onclick="selectDept('ТСБиА')"><span class="emoji">🚨</span> ТСБиА</button>
        <button class="btn" onclick="selectDept('ПТБ')"><span class="emoji">🛂</span> ПТБ</button>
    </div>
  </div>
  <div id="step2" class="hidden">
    <h3 id="dept-title">Укажите срочность:</h3>
    <button class="btn priority-btn" style="background: #e53935; color: white;" onclick="sendData('Критическая')">🔥 Критическая (Авария)</button>
    <button class="btn priority-btn" style="background: #fb8c00; color: white;" onclick="sendData('Высокая')">⚡ Высокая</button>
    <button class="btn priority-btn" style="background: #43a047; color: white;" onclick="sendData('Обычная')">✅ Обычная</button>
    <button class="btn priority-btn" style="background: var(--tg-theme-secondary-bg-color, #e0e0e0); color: var(--tg-theme-text-color, #000); margin-top: 30px;" onclick="goBack()">⬅️ Назад к отделам</button>
  </div>
  <script>
    let tg = window.Telegram.WebApp;
    tg.expand();
    let selectedDept = '';
    function selectDept(dept) {
        selectedDept = dept;
        document.getElementById('dept-title').innerText = 'Срочность для ' + dept + ':';
        document.getElementById('step1').classList.add('hidden');
        document.getElementById('step2').classList.remove('hidden');
    }
    function goBack() {
        document.getElementById('step2').classList.add('hidden');
        document.getElementById('step1').classList.remove('hidden');
    }
    function sendData(priority) {
        let data = { department: selectedDept, priority: priority };
        tg.sendData(JSON.stringify(data));
        tg.close();
    }
  </script>
</body>
</html>`;

// 2. ЗАПУСКАЕМ СЕРВЕР, ЧТОБЫ RENDER БЫЛ ДОВОЛЕН
const port = process.env.PORT || 3000;
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(htmlContent); // Отдаем наш интерфейс по ссылке
}).listen(port, () => console.log(`🌐 Сервер запущен на порту ${port}`));

// 3. ЗАПУСКАЕМ САМОГО БОТА
const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) => {
    ctx.reply(
        'Добро пожаловать в систему диспетчеризации аэропорта! ✈️\n\nНажмите кнопку ниже, чтобы открыть панель управления и выбрать отдел.',
        Markup.inlineKeyboard([
            // Теперь бот будет открывать ссылку на самого себя!
            Markup.button.webApp('Создать обращение', WEB_APP_URL)
        ])
    );
});

bot.on('message', async (ctx) => {
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
            
            const messageText = `🚨 **НОВОЕ ОБРАЩЕНИЕ**\n\n🏢 **Отдел:** ${dept}\n⚠️ **Срочность:** ${priority}\n👤 **Отправитель:** ${userName}\n\n*Тут в будущем будет текст самой проблемы...*`;

            await ctx.telegram.sendMessage(FORUM_ID, messageText, { 
                message_thread_id: topic.message_thread_id,
                parse_mode: 'Markdown'
            });

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
