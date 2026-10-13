const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const server = http.createServer((req, res) => {
  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(__dirname, reqPath);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    res.writeHead(200);
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(3004, async () => {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const proc = spawn(chromePath, ['--headless=new', '--remote-debugging-port=9225', '--window-size=1440,900']);

  let wsUrl = null;
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 250));
    try {
      const res = await fetch('http://127.0.0.1:9225/json/list');
      const list = await res.json();
      if (list[0]?.webSocketDebuggerUrl) { wsUrl = list[0].webSocketDebuggerUrl; break; }
    } catch(e){}
  }

  const ws = new WebSocket(wsUrl);
  let id = 1;
  const pending = new Map();
  function send(m, p={}) {
    return new Promise(r => {
      const i = id++;
      pending.set(i, r);
      ws.send(JSON.stringify({ id: i, method: m, params: p }));
    });
  }
  ws.onmessage = e => {
    const d = JSON.parse(e.data);
    if (d.id && pending.has(d.id)) { pending.get(d.id)(d.result); pending.delete(d.id); }
  };
  await new Promise(r => ws.onopen = r);

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.navigate', { url: 'http://localhost:3004' });
  await new Promise(r => setTimeout(r, 1200));

  // Screenshot services
  await send('Runtime.evaluate', { expression: `document.getElementById('services').scrollIntoView();` });
  await new Promise(r => setTimeout(r, 400));
  const shotServices = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('section-services.png', Buffer.from(shotServices.data, 'base64'));

  // Screenshot portfolio carousel
  await send('Runtime.evaluate', { expression: `document.getElementById('portfolio').scrollIntoView();` });
  await new Promise(r => setTimeout(r, 400));
  const shotPortfolio = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('section-portfolio.png', Buffer.from(shotPortfolio.data, 'base64'));

  // Screenshot contact
  await send('Runtime.evaluate', { expression: `document.getElementById('contact').scrollIntoView();` });
  await new Promise(r => setTimeout(r, 400));
  const shotContact = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('section-contact.png', Buffer.from(shotContact.data, 'base64'));

  ws.close();
  proc.kill();
  server.close();
  console.log('Captured section screenshots.');
});
