
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(200).send('Farobiy Bozor Bot API');
    }

    const { callback_query, message } = req.body;

    // Handle Button Clicks (Approve/Reject)
    if (callback_query) {
        const data = callback_query.data;
        const msg = callback_query.message;

        if (data.startsWith('approve_user_') || data.startsWith('reject_user_')) {
            const reqId = data.split('_')[2];
            const isApprove = data.startsWith('approve');

            try {
                // Update Supabase logging flags to communicate with frontend
                // Professional: Use shop_id: 0 for system logs
                const { error } = await supabase.from('fb_logs')
                    .update({ amount: isApprove ? 1 : 2 })
                    .eq('type', 'REG_APPROVAL')
                    .eq('name', reqId);

                if (error) throw error;

                // Notify admin via Telegram
                const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
                const statusText = isApprove ? "✅ Tasdiqlandi" : "❌ Rad etildi";

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

                // Send confirmation message
                await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: msg.chat.id,
                        text: `${statusText} (ID: ${reqId}). Foydalanuvchi tizimga ruxsat oldi.`
                    })
                });

                return res.status(200).json({ ok: true });
            } catch (err) {
                console.error("Bot Error:", err.message);
                return res.status(500).json({ error: err.message });
            }
        }
    }

    // Handle regular messages if needed
    if (message && message.text) {
        // ... optional start message logic ...
    }

    return res.status(200).json({ ok: true });
}
