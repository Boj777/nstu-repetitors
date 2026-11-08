
/*
============================================
 НГТУ РЕПЕТИТОРЫ — SOS SERVER
 Node.js + Express + Telegram Bot API
============================================
*/

// Подключаем библиотеки
const express = require("express");
const dotenv = require("dotenv");
const path = require("path");

// Загружаем переменные из .env
dotenv.config();

const app = express();

const PORT = 3000;


// ========================================
// НАСТРОЙКИ
// ========================================

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;


// Проверяем наличие секретных данных
if (!BOT_TOKEN || !CHAT_ID) {
    console.error("ОШИБКА: Не заданы BOT_TOKEN или CHAT_ID в .env");
    process.exit(1);
}


// ========================================
// MIDDLEWARE
// ========================================

// Ограничиваем размер JSON-запроса
app.use(express.json({ limit: "10kb" }));

// Раздаем HTML и остальные статические файлы
app.use(express.static(__dirname));


// ========================================
// ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ
// ========================================

// Защита HTML-сообщения от специальных символов
function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[char];
    });
}


// ========================================
// SOS API
// ========================================

app.post("/api/sos", async (req, res) => {

    try {

        // Получаем данные от фронтенда
        const {
            subject,
            task,
            budget,
            telegram
        } = req.body || {};


        // Допустимые предметы
        const allowedSubjects = [
            "Высшая математика",
            "Физика",
            "ТОЭ",
            "Программирование",
            "Другое"
        ];


        // Проверяем предмет
        if (
            typeof subject !== "string" ||
            !allowedSubjects.includes(subject)
        ) {
            return res.status(400).json({
                error: "Выберите корректный предмет"
            });
        }


        // Проверяем описание задачи
        if (
            typeof task !== "string" ||
            task.trim().length < 5 ||
            task.trim().length > 1500
        ) {
            return res.status(400).json({
                error: "Описание задачи должно содержать от 5 до 1500 символов"
            });
        }


        // Проверяем бюджет
        const numericBudget = Number(budget);

        if (
            !Number.isSafeInteger(numericBudget) ||
            numericBudget < 1 ||
            numericBudget > 1000000
        ) {
            return res.status(400).json({
                error: "Укажите корректный бюджет"
            });
        }


        // Проверяем Telegram username
        if (
            typeof telegram !== "string" ||
            !/^@?[A-Za-z0-9_]{5,32}$/.test(telegram.trim())
        ) {
            return res.status(400).json({
                error: "Укажите корректный Telegram username"
            });
        }


        // Формируем ссылку на Telegram ученика
        const username = telegram.trim().replace(/^@/, "");

        const telegramLink = "https://t.me/" + username;


        // Формируем сообщение
        const message = `
🚨 <b>СРОЧНЫЙ ЗАКАЗ С САЙТА!</b>

📚 <b>Предмет:</b> ${escapeHTML(subject)}

📝 <b>Задача:</b>
${escapeHTML(task.trim())}

💰 <b>Бюджет:</b> ${numericBudget} ₽

👤 <b>Клиент:</b> <a href="${telegramLink}">@${escapeHTML(username)}</a>

━━━━━━━━━━━━━━━━
🎓 <i>НГТУ Репетиторы | Раздел SOS</i>
        `.trim();


        // ========================================
        // ОТПРАВКА В TELEGRAM
        // ========================================

        const telegramResponse = await fetch(
            `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    chat_id: CHAT_ID,

                    text: message,

                    parse_mode: "HTML",

                    disable_web_page_preview: true

                })

            }
        );


        // Получаем ответ Telegram
        const telegramResult = await telegramResponse.json();


        // Проверяем успешность отправки
        if (!telegramResponse.ok || !telegramResult.ok) {

            console.error(
                "Telegram API error:",
                telegramResult.description || telegramResponse.status
            );

            return res.status(502).json({
                error: "Не удалось передать заявку в Telegram"
            });

        }


        // Возвращаем успешный ответ фронтенду
        console.log("Новая SOS-заявка отправлена в Telegram");

        return res.status(200).json({

            success: true,

            message: "Заявка успешно отправлена"

        });


    } catch (error) {

        console.error("Ошибка сервера:", error.message);

        return res.status(500).json({
            error: "Внутренняя ошибка сервера"
        });

    }

});


// ========================================
// ЗАПУСК СЕРВЕРА
// ========================================

app.listen(PORT, "127.0.0.1", () => {

    console.log("----------------------------------");
    console.log("🎓 НГТУ Репетиторы");
    console.log("----------------------------------");
    console.log(`Сервер запущен: http://localhost:${PORT}`);
    console.log("SOS API: http://localhost:3000/api/sos");
    console.log("----------------------------------");

});
