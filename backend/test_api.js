const http = require('http');

http.get('http://localhost:3002/api/media/13', (res) => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', res.headers);
  
  let size = 0;
  res.on('data', (d) => {
    size += d.length;
  });
  
  res.on('end', () => {
    console.log('Total bytes received:', size);
  });
}).on('error', (e) => {
  console.error('Error:', e);
});
