import TelegramBot from 'node-telegram-bot-api';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// --- KONFIGURATSIYA (Farobiy v4.3 STABLE) ---
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

console.log('--- 🚀 FAROBIY MARKET: Buhgalter Bot v4.3 Ishga Tushdi! ---');

// --- /start BUYRUG'I ---
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "Assalomu alaykum! Farobiy Market Buhgalter botiga hush kelibsiz.\n\nHarajatni yozing (masalan: Obed 25000)");
});

// --- MATNLI HABAR TAHLILI (ODDIY VA BARQAROR) ---
bot.on('text', async (msg) => {
    const text = msg.text;
    const chatId = msg.chat.id;
    if (text.startsWith('/')) return;

    try {
        const match = text.match(/^([\wа-яА-ЯёЁʻ'\s]+?)\s+(\d+)$/i);
        if (match) {
            const name = match[1].trim();
            const amount = Number(match[2]);
            await saveExpenseToDB({ reason: name, amount });
            bot.sendMessage(chatId, `✅ Saqlandi!\n📝 Nomi: ${name}\n💰 Summa: ${amount.toLocaleString()} so'm`);
        } else {
            bot.sendMessage(chatId, "Iltimos 'Nomi Summa' formatida yozing.\nMasalan: Obed 25000");
        }
    } catch (err) {
        console.error('Xatolik:', err.message);
        bot.sendMessage(chatId, "⚠️ Xatolik yuz berdi: " + err.message);
    }
});

// --- BAZAGA SAQLASH ---
async function saveExpenseToDB(data) {
    const { error } = await supabase.from('fb_logs').insert([{
        type: 'EXPENSE',
        name: data.reason,
        amount: Number(data.amount),
        date: new Date().toISOString()
    }]);
    if (error) throw error;
}

// --- CALLBACK HANDLING (TASDIQLASH) ---
bot.on('callback_query', async (query) => {
    const data = query.data;
    const msg = query.message;

    if (data.startsWith('approve_user_') || data.startsWith('reject_user_')) {
        const reqId = data.split('_')[2];
        const isApprove = data.startsWith('approve');

        // Update Supabase logging flags to communicate with frontend
        await supabase.from('fb_logs')
            .update({ amount: isApprove ? 1 : 2 })
            .eq('type', 'REG_APPROVAL')
            .eq('name', reqId);

        bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: msg.chat.id, message_id: msg.message_id });
        bot.sendMessage(msg.chat.id, isApprove ? `✅ To'lov tasdiqlandi (ID: ${reqId}). Foydalanuvchi tizimga kiritildi.` : `❌ To'lov rad etildi (ID: ${reqId}). Foydalanuvchiga xabar berildi.`);
        bot.answerCallbackQuery(query.id, { text: "Bajarildi!" });
    }
});
