// МАГИЧЕСКАЯ СТРОКА: Принудительно отключаем строгую проверку SSL-сертификатов
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');

// Инициализируем бота через твой Cloudflare Worker
const bot = new Telegraf(process.env.BOT_TOKEN, {
    telegram: { 
        apiRoot: 'https://black-hall-08b5.ilyadeg65.workers.dev' 
    }
});
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

// Слушаем данные, которые приходят из Mini App
bot.on('message', async (ctx) => {
    // Проверяем, есть ли в сообщении данные от веб-приложения
    if (ctx.message && ctx.message.web_app_data) {
        try {
            // Расшифровываем JSON данные
            const data = JSON.parse(ctx.message.web_app_data.data);
            const dept = data.department;
            const priority = data.priority;
            
            // Словарь эмодзи для красоты в названиях тем
            const emojis = {
                'ОМК': '🛍', 'ТИСТО': '🚰', 'ЭСТОП': '⚡️',
                'СЭЗИС': '🛠', 'АВК': '🧹', 'ССТиР': '🛗',
                'ТСБиА': '🚨', 'ПТБ': '🛂'
            };
            const emoji = emojis[dept] || '📌';
            const userName = ctx.from.username ? `@${ctx.from.username}` : ctx.from.first_name;

            // 1. Создаем красиво оформленную тему в форуме
            const topicTitle = `[${dept}] ${emoji} Заявка от ${ctx.from.first_name}`;
            const topic = await ctx.telegram.createForumTopic(FORUM_ID, topicTitle);
            
            // 2. Формируем текст самой заявки
            const messageText = `🚨 **НОВОЕ ОБРАЩЕНИЕ**\n\n🏢 **Отдел:** ${dept}\n⚠️ **Срочность:** ${priority}\n👤 **Отправитель:** ${userName}\n\n*Тут в будущем будет текст самой проблемы...*`;

            // 3. Отправляем сообщение внутрь созданной темы
            await ctx.telegram.sendMessage(FORUM_ID, messageText, { 
                message_thread_id: topic.message_thread_id,
                parse_mode: 'Markdown'
            });

            // Отчитываемся пользователю
            ctx.reply(`✅ Ваша заявка успешно передана в отдел ${dept}! (Срочность: ${priority})`);

        } catch (error) {
            console.error('Ошибка при обработке данных Web App:', error);
            ctx.reply('❌ Произошла ошибка при обработке вашей заявки.');
        }
    }
});

// Запускаем бота
bot.launch().then(() => {
    console.log('✈️ Бот аэропорта успешно запущен (с обходом SSL) и готов принимать заявки!');
}).catch((error) => {
    console.error('❌ Ошибка подключения к Telegram:', error);
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));