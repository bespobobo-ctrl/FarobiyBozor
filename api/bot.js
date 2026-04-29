
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(200).send('Farobiy Bozor Bot API is running...');
    }

    const { callback_query } = req.body;
    const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TG_API = `https://api.telegram.org/bot${TOKEN}`;

    if (callback_query) {
        const { id: callbackQueryId, data, message: msg } = callback_query;

        if (data.startsWith('approve_user_') || data.startsWith('reject_user_')) {
            const reqId = data.split('_')[2];
            const isApprove = data.startsWith('approve');

            try {
                // 1. Answer callback immediately to stop spinner
                await axios.post(`${TG_API}/answerCallbackQuery`, {
                    callback_query_id: callbackQueryId,
                    text: isApprove ? "Tasdiqlanmoqda..." : "Rad etilmoqda..."
                });

                // 2. Update Supabase (Explicitly using shop_id: 0)
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

                return res.status(200).json({ ok: true });
            } catch (err) {
                console.error("Critical Bot Error:", err.response?.data || err.message);
                return res.status(200).json({ ok: false, error: err.message });
            }
        }
    }

    return res.status(200).json({ ok: true });
}
