
API = require('./p1_core/server/api');
io = require('socket.io-client');
PORT = process.env.PORT ? process.env.PORT : 3100;
GPATH = __dirname;
PublishMode = false;
APP = {  };

setTimeout(function(){
    Init();
},50);

var Init = function(){
    require('./p1_core/server/coreApp');
    console.log(PORT);

    App.OnLoad = function () {

    };
};
