'use strict';

const { createApp } = require('./server/createApp');

function start() {
  const port = process.env.PORT || 3000;
  const app = createApp();

  return app.listen(port, () => {
    console.log(`server listening on ${port}`);
  });
}

if (require.main === module) {
  start();
}

module.exports = { start };
