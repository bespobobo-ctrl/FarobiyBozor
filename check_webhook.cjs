const https = require('https');
https.get('https://api.telegram.org/bot8742721286:AAH4dj2xfNUf2J8lY3W9ccxRw3LIUeFLyxw/getWebhookInfo', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log(data));
});
