const https = require('https');
const data = JSON.stringify({ message: { text: '/start', chat: { id: 123 } } });
const options = {
  hostname: 'farobiy-bozor.vercel.app',
  port: 443,
  path: '/api/bot',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};
const req = https.request(options, res => {
  console.log(`statusCode: ${res.statusCode}`);
  res.on('data', d => process.stdout.write(d));
});
req.on('error', error => console.error(error));
req.write(data);
req.end();
