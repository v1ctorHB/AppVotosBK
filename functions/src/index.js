'use strict';

const app = require("./app");

app.set('port', process.env.PORT || 3000);

app.listen(app.get('port'), () => {
    console.log(`El servidor esta corriendo en el puerto: '${app.get('port')}'`);
});