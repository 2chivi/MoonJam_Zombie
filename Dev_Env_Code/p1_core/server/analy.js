var e = exports;
var osu = require('node-os-utils');
var request = require('request');

e.totalRequests = 0;
e.pageRequests = 0;
e.info = {};

e.Init = function(onLoop){
    var info = { hey: "Server Restarted" };
    e.onLoop = onLoop;
    e.logSize = 0;
    e.ticks = 0;
    e.discord(info, true);
    e.loop();
};

e.loop = function(){
    e.interval = 120; //120 seconds;
    e.longInt = 15; //30 mins

    setInterval(function(){
        osu.cpu.usage().then(function (cpu) {
        osu.mem.info().then(function (mem){
            //var logChange = e.LogChange();

            e.info.cpu = cpu;
            e.info.mem = (100 - mem.freeMemPercentage);
            e.info.pageRequests = e.pageRequests;
            e.info.totalRequests = e.totalRequests;
            //e.info.logs = logChange;
            e.alert = e.info.mem > 60 || e.info.cpu > 60;
            if (((e.ticks % e.longInt) == 0)) //|| (logChange.length > 0))
                e.send = true;

            e.ticks++;

            if(e.onLoop)
                e.onLoop();

            if (e.send){
                e.discord(e.info, e.alert);
                e.info = {};
                e.send = false;
            }
        });
        });
    }, 1000 * e.interval);
};

e.discord = function(info, alert){
    if(alert)
        info.warning = "<@115893129378398210>";
    request.post(
        'https://discordapp.com/api/webhooks/564328517169446942/hbeTzJ-TsvN4MJsALm4kkOq_aJ7SG4re7EA7DPR_3WAp778f7dOjLYCBdtGqg3OMtUFL',
        { json: { content: JSON.stringify(info, null, "\t") } },
        function (er, resp, body) { }
    );
};

e.LogChange = function () {
    e.logs = fs.readFileSync(__dirname + '/output.log', 'utf-8');
    setTimeout(function(){
        fs.writeFile(__dirname + '/output.log', '', function () { });
    }, 2000);
    return e.logs ? e.logs : '';
};
