const fs = require('fs');
const axios = require('axios').default;

axios.get('https://app.froged.com/assets/fonts/fa/fa-light-300.woff2')
  .then((response) => {
    fs.mkdirSync('./public/fonts', { recursive: true });
    fs.writeFileSync('./public/fonts/fa-light-300.woff2', response.data);
  });