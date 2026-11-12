const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const htmlPath = path.join(__dirname, 'web-preview.html');

const server = http.createServer((req, res) => {
  fs.readFile(htmlPath, 'utf8', (err, content) => {
    if (err) {
      res.writeHead(500, {'Content-Type': 'text/plain; charset=utf-8'});
      res.end('Error cargando web-preview.html');
      return;
    }
    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
    res.end(content);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n==================================================`);
  console.log(`  App de Pareja (Cómplices) - Vista Web Lista`);
  console.log(`  En tu PC:      http://localhost:${PORT}`);
  console.log(`  En tu Android: http://192.168.4.70:${PORT} (mismo Wi-Fi)`);
  console.log(`==================================================\n`);
});

