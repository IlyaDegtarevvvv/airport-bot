require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const http = require('http'); // Встроенный модуль для создания сервера

// 1. Создаем мини-сервер, чтобы Render понимал, что мы работаем, и не убивал бота
const port = process.env.PORT || 3000;
http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Airport Bot is running!');
}).listen(port, () => console.log(`🌐 Веб-сервер запущен на порту ${port}`));

// 2. Инициализируем бота (БЕЗ всяких прокси, напрямую)
const bot = new Telegraf(process.env.BOT_TOKEN);
const FORUM_ID = process.env.FORUM_ID;

// Обработка команды /start
bot.start((ctx) => {
    ctx.reply(
        'Добро пожаловать в систему диспетчеризации аэропорта! ✈️\n\nНажмите кнопку ниже, чтобы открыть панель управления и выбрать отдел.',
        Markup.inlineKeyboard([
            // Твоя ссылка на Mini App
            Markup.button.webApp('Создать обращение', 'https://idyllic-cupcake-3ee127.netlify.app')
        ])
    );
});

// Слушаем данные из Mini App
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

// Запускаем бота
bot.launch().then(() => {
    console.log('✈️ Бот аэропорта успешно запущен В ОБЛАКЕ RENDER и готов принимать заявки!');
}).catch((error) => {
    console.error('❌ Ошибка подключения к Telegram:', error);
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
