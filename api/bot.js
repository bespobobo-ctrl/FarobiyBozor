import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = SUPABASE_URL ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(200).send('Farobiy Bozor Bot API is running...');
    }

    try {
        const { callback_query, message } = req.body;
        const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
        
        if (!TOKEN) {
            console.error("Missing TELEGRAM_BOT_TOKEN");
            return res.status(500).json({ error: "Missing token" });
        }
        if (!supabase) {
            console.error("Missing SUPABASE config");
            return res.status(500).json({ error: "Missing Supabase config" });
        }
        
        const TG_API = `https://api.telegram.org/bot${TOKEN}`;

        // --- CALLBACK (BUTTONS) HANDLING ---
        if (callback_query) {
            const { id: callbackQueryId, data, message: msg } = callback_query;

            if (data.startsWith('approve_user_') || data.startsWith('reject_user_')) {
                const reqId = data.split('_')[2];
                const isApprove = data.startsWith('approve');

                // 1. Answer callback immediately
                await axios.post(`${TG_API}/answerCallbackQuery`, {
                    callback_query_id: callbackQueryId,
                    text: isApprove ? "Tasdiqlanmoqda..." : "Rad etilmoqda..."
                });

                // 2. Update Supabase
                const { error } = await supabase.from('fb_logs')
                    .update({ amount: isApprove ? 1 : 2 })
                    .eq('type', 'REG_APPROVAL')
                    .eq('name', reqId)
                    .eq('shop_id', 0);

                if (error) throw error;

                // 3. Edit message to remove buttons
                await axios.post(`${TG_API}/editMessageReplyMarkup`, {
                    chat_id: msg.chat.id,
                    message_id: msg.message_id,
                    reply_markup: { inline_keyboard: [] }
                });

                // 4. Send result message
                await axios.post(`${TG_API}/sendMessage`, {
                    chat_id: msg.chat.id,
                    text: (isApprove ? "✅ TASDIQLANDI" : "❌ RAD ETILDI") + ` (ID: ${reqId})`
                });
            }
            return res.status(200).json({ ok: true });
        }

        // --- TEXT MESSAGES HANDLING ---
        if (message && message.text) {
            const text = message.text;
            const chatId = message.chat.id;

            if (text === '/start') {
                await axios.post(`${TG_API}/sendMessage`, {
                    chat_id: chatId,
                    text: "Assalomu alaykum! Farobiy Market Buhgalter botiga hush kelibsiz.\n\nHarajatni yozing (masalan: Obed 25000)"
                });
                return res.status(200).json({ ok: true });
            }

            if (!text.startsWith('/')) {
                const match = text.match(/^([\wа-яА-ЯёЁʻ'\s]+?)\s+(\d+)$/i);
                if (match) {
                    const name = match[1].trim();
                    const amount = Number(match[2]);
                    
                    const { error } = await supabase.from('fb_logs').insert([{
                        type: 'EXPENSE',
                        name: name,
                        amount: amount,
                        date: new Date().toISOString()
                    }]);
                    
                    if (error) throw error;

                    await axios.post(`${TG_API}/sendMessage`, {
                        chat_id: chatId,
                        text: `✅ Saqlandi!\n📝 Nomi: ${name}\n💰 Summa: ${amount.toLocaleString()} so'm`
                    });
                } else {
                    await axios.post(`${TG_API}/sendMessage`, {
                        chat_id: chatId,
                        text: "Iltimos 'Nomi Summa' formatida yozing.\nMasalan: Obed 25000"
                    });
                }
            }
            return res.status(200).json({ ok: true });
        }

        return res.status(200).json({ ok: true });
    } catch (err) {
        console.error("Webhook Error:", err);
        return res.status(500).json({ error: err.message });
    }
}
