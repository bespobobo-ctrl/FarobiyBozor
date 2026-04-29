
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default async function handler(req, res) {
    // Professional Logging
    console.log("Bot Update Received:", JSON.stringify(req.body));

    if (req.method !== 'POST') {
        return res.status(200).send('Farobiy Bozor Bot API is running...');
    }

    const { callback_query } = req.body;
    const TOKEN = process.env.TELEGRAM_BOT_TOKEN;

    if (callback_query) {
        const { id: callbackQueryId, data, message: msg } = callback_query;

        // Always answer callback to stop the loading spinner in Telegram
        const stopSpinner = async () => {
            await fetch(`https://api.telegram.org/bot${TOKEN}/answerCallbackQuery`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ callback_query_id: callbackQueryId, text: "Bajarilmoqda..." })
            });
        };

        if (data.startsWith('approve_user_') || data.startsWith('reject_user_')) {
            const reqId = data.split('_')[2];
            const isApprove = data.startsWith('approve');

            try {
                await stopSpinner();

                // Update Supabase
                const { error } = await supabase.from('fb_logs')
                    .update({ amount: isApprove ? 1 : 2 })
                    .eq('type', 'REG_APPROVAL')
                    .eq('name', reqId);

                if (error) throw error;

                // Clear buttons
                await fetch(`https://api.telegram.org/bot${TOKEN}/editMessageReplyMarkup`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: msg.chat.id,
                        message_id: msg.message_id,
                        reply_markup: { inline_keyboard: [] }
                    })
                });

                // Send result
                await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: msg.chat.id,
                        text: (isApprove ? "✅ TASDIQLANDI" : "❌ RAD ETILDI") + ` (ID: ${reqId})`
                    })
                });

                return res.status(200).json({ ok: true });
            } catch (err) {
                console.error("Critical Bot Error:", err.message);
                return res.status(200).json({ ok: false, error: err.message }); // 200 for TG
            }
        }
    }

    return res.status(200).json({ ok: true });
}
