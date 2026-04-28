const axios = require('axios');

const TOKEN = '8742721286:AAH4dj2xfNUf2J8lY3W9ccxRw3LIUeFLyxw';
const URL = `https://api.telegram.org/bot${TOKEN}`;

async function setup() {
    try {
        const timestamp = Date.now();
        const res = await axios.post(`${URL}/setChatMenuButton`, {
            menu_button: {
                type: 'web_app',
                text: 'Bozor 🛒',
                web_app: {
                    url: `https://farobiy-bozor.vercel.app/?v=BUILD4.40&t=${timestamp}`
                }
            }
        });

        console.log('Bot Menu Button Set with cache-busting timestamp:', timestamp);
        console.log('API Response:', res.data);

        await axios.post(`${URL}/setMyCommands`, {
            commands: [
                { command: 'start', description: 'Bozorni boshlash' },
                { command: 'help', description: 'Yordam' }
            ]
        });
        console.log('Bot Commands Set');

    } catch (e) {
        console.error('Error setting up bot:', e.response?.data || e.message);
    }
}

setup();
