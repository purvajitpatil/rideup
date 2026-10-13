const http = require('http');
const app = require('./app');

const port = process.env.PORT || 3000;
http.createServer(app).listen(port, '0.0.0.0', () => console.log(`Server is running on port ${port}`));
