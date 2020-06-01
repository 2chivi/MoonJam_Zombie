IsServer = typeof exports !== 'undefined';

class API {
    constructor(port, reconnect = true, serverLoc) {
        var t = this;
        t.reconnect = reconnect;
        t.Unique = 0;
        t.DoneFuncs = {};
        
        if(serverLoc)
            t.ServerLoc = serverLoc;
        else{
            if (IsServer || window.location.hostname == 'localhost')
                t.ServerLoc = 'http://localhost:' + port;
            else
                t.ServerLoc = ServerLoc + '?port=' + port;
        }
        t.Init();
    }

    Init() {
        var t = this;

        t.Sock = io(t.ServerLoc, { reconnectionDelayMax: 10000, reconnection: t.reconnect });
        t.Sock.on('any', function (key, args) {
            var func = t.DoneFuncs[key];
            if (func) {
                t.DoneFuncs[key](args);
                delete t.DoneFuncs[key];
            }else{
                console.log(key);
                console.log(t.DoneFuncs);
                console.log('API Sock Failure?')
            }
        });
    }

    Call(method, args, done) {
        var t = this;
        var key = t.Unique;
        t.Unique++;

        if (done)
            t.DoneFuncs[key] = done;

        t.Sock.emit('any', method, key, args);
    }
};
if (IsServer) module.exports = API;