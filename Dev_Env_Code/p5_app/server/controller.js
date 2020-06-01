var e = exports;

e.Test = function (req, dal, key, args, done) {
    var info = {};
    //need Client ID for authorizatino for stream-elements

    /*
    var token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNWViZGEzNmUyNWU1Y2IxOTdiZTdmM2NkIiwicm9sZSI6Im93bmVyIiwiY2hhbm5lbCI6IjVlYmRhMzZlMjVlNWNiYjdjZGU3ZjNjZSIsInByb3ZpZGVyIjoidHdpdGNoIiwiYXV0aFRva2VuIjoid2IwNFBqdHFXdnFXMUQxbXc0b0NQNlNFWml3OWJ0MHIzNWdsVlJUeklVOVJ2VjNFIiwiaWF0IjoxNTg5NDg2NDQ2LCJpc3MiOiJTdHJlYW1FbGVtZW50cyJ9.jzODefbFdj2GuYWI2rrqLmVoR2KuAbqBd8QiRdtfg-M';
//58fe95d51afff64e61f13d3c
    request({url: 'https://api.streamelements.com/kappa/v2/channels/thatviolinchick',
    }, function (er, res, data) {
        data = JSON.parse(data);
        var channelId = '5ebda36e25e5cbb7cde7f3ce'; //data._id
        console.log(data);

        request({url: 'https://api.streamelements.com/kappa/v2/tips/' + channelId,
            headers: { 'Authorization': 'Bearer ' + token },
        }, function (er, res, data) {
            data = JSON.parse(data);

            console.log(er);
            console.log(data);

        });
    });*/

    req.emit('any', key, info);
};

e.GetInfo = function (req, dal, key, args, done) {
    var info = {};

    if (!APP.member) {
        dal.Get('streamer', { 'twitch': TWITCH }, function (guys) {
            var member = guys[0];
            APP.member = member;
        });
    }

    if(APP.member && APP.LastUpdate && APP.LastUpdate > args[0]){
        var sort = APP.member.requestSort ? APP.member.requestSort : 'Recent Contributions';
        var requests = [];

        info.showSubs = APP.member.requestShowSubs != null ? APP.member.requestShowSubs : true;
        info.showDonars = APP.member.requestShowDonars != null ? APP.member.requestShowDonars : true;
        info.showPlebs = APP.member.requestShowPlebs != null ? APP.member.requestShowPlebs : true;
        info.requestSort = APP.member.requestSort;


        //filter out checkboxes
        requests = APP.requests._where(r=> {
            var m = APP.money[r.user];

            return (info.showSubs && r.subscriber) || (info.showPlebs && !r.subscriber)
                || (info.showDonars && m && (m.sub || m.gifts || m.donations || m.bits));
        });

        //reordering
        requests = requests._orderBy(r=> r.time);
        
        if (sort == 'Recent Contributions'){
            requests = requests.reverse()._orderBy(r=> {
                var money = APP.money[r.user];
                var total = r.subscriber * 1;
                if (money)
                    total += ((money.bits / 100) + money.donations + money.gifts * 5 + money.sub * 5 + money.resub * 5)
                return total;
            }).reverse();
        }
        if(sort == 'Random')
            requests = requests._orderBy(x=> Math.random());
        
        info.money = APP.money;
        info.LastUpdate = APP.LastUpdate;
        info.requests = requests;

        req.emit('any', key, info);
    }
};

e.UpdateSettings = function (req, dal, key, args, done) {
    var info = {};
    
    if (APP.member) {
        APP.member.requestSort = args[0];
        APP.member.requestShowSubs = args[1];
        APP.member.requestShowDonars = args[2];
        APP.member.requestShowPlebs = args[3];
        APP.LastUpdate = Date.now();

        dal.Save('streamer', APP.member, function (guys) {
            req.emit('any', key, {});
        });
    }
};

e.Complete = function (req, dal, key, args, done) {
    var info = {};
    var request = args[0];

    APP.requests = APP.requests._where(x => !(x.user == request.user && x.time == request.time));
    APP.LastUpdate = Date.now();

    if (APP.money[request.user]){
        APP.money[request.user].sub = false;
        APP.money[request.user].resub = false;
        APP.money[request.user].bits = 0;
        APP.money[request.user].donations = 0;
        APP.money[request.user].gifts = 0;
    }

    req.emit('any', key, {requests: APP.requests, money: APP.money});
};


e.Update = function (req, dal, key, args, done) {
    var info = {};
    var request = args[0];

    var myReq = APP.requests._first(x => x.user == request.user && x.time == request.time);
    myReq.message = args[0].message;
    myReq.title = args[0].title;
    APP.LastUpdate = Date.now();

    req.emit('any', key, { });
};



