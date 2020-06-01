var EM = {

    textures: {},

    GetEmotes: function (done) {
        EM.f1 = new PIXI.filters.GlowFilter(5, 5, 0, 0x0, 1);
        EM.f2 = new PIXI.filters.GlowFilter(10, 10, 0, 0x0, 1);
        EM.f3 = new PIXI.filters.GlowFilter(5, 5, 0, 0xffffa1, 1);

        var url = 'https://api.twitchemotes.com/api/v4/channels/' + '121059319';

        $.get(url, function(data){
            if (data.emotes) {
                data.emotes._each(em => {
                    EM.twitchEmotes[em.id] = { id: em.id, code: em.code, origin: 'twitch' };
                });
            }

            EM.LoadEmotes(UT.List(EM.twitchEmotes), function(){
                G.Loader_.load(function (loader, res) {

                    res._each(r => {
                        if (!CG.textures[r.name]){
                            var tex = G.texture(null, r.texture, {});
                            var ft = G.filterTex(EM.f1, 5, tex, { zIndex: 5 });

                            EM.textures[r.name] = ft;
                        }
                    });

                    if (done) done(EM.textures);
                });
            });
        });

    },

    To64Data: function (stuff) {
        var t2 = btoa(new Uint8Array(stuff).reduce(function (data, byte) {
            return data + String.fromCharCode(byte);
        }, ''));
        return 'data:image/png;base64,' + t2;
    },

    LoadEmotes: function (list, done) {
        var total = list.length;

        list._each(d => {
            var url = "https://static-cdn.jtvnw.net/emoticons/v1/" + d.id + "/2.0";
            if (d.origin == 'ffz')
                url = 'https://cdn.frankerfacez.com/emoticon/' + d.id + '/' + d.size;

            if (d.origin != 'bttv') {
                var oReq = new XMLHttpRequest();
                oReq.open("GET", url, true);
                oReq.responseType = "arraybuffer";
                oReq.edata = d;
                oReq.onload = function (oEvent) {
                    var arrayBuffer = oReq.response;
                    var src = EM.To64Data(arrayBuffer);

                    if (!G.Loader_.resources[oEvent.target.edata.code])
                        G.Loader_.add(oEvent.target.edata.code, src);

                    total--;
                    if (total <= 0) done();
                };
                oReq.send();
            } else
                total--;
        });
    },

    twitchEmotes: {
        '1': { origin: 'twitch', code: '\:-?\)', id: 1 },
        '354': { origin: 'twitch', code: '4Head', id: 354 },
        '4057': { origin: 'twitch', code: 'BrokeBack', id: 4057 },
        '22639': { origin: 'twitch', code: 'BabyRage', id: 22639 },
        '86': { origin: 'twitch', code: 'BibleThump', id: 86 },
        '153556': { origin: 'twitch', code: 'BlessRNG', id: 153556 },
        '33': { origin: 'twitch', code: 'DansGame', id: 33 },
        '111700': { origin: 'twitch', code: 'DatSheffy', id: 111700 },
        '360': { origin: 'twitch', code: 'FailFish', id: 360 },
        '30259': { origin: 'twitch', code: 'HeyGuys', id: 30259 },
        '114836': { origin: 'twitch', code: 'Jebaited', id: 114836 },
        '25': { origin: 'twitch', code: 'Kappa', id: 25 },
        '55338': { origin: 'twitch', code: 'KappaPride', id: 55338 },
        '41': { origin: 'twitch', code: 'Kreygasm', id: 41 },
        '425618': { origin: 'twitch', code: 'LUL', id: 425618 },
        '28': { origin: 'twitch', code: 'MrDestructoid', id: 28 },
        '58765': { origin: 'twitch', code: 'NotLikeThis', id: 58765 },
        '88': { origin: 'twitch', code: 'PogChamp', id: 88 },
        '245': { origin: 'twitch', code: 'ResidentSleeper', id: 245 },
        '64138': { origin: 'twitch', code: 'SeemsGood', id: 64138 },
        '34': { origin: 'twitch', code: 'SwiftRage', id: 34 },
        '81274': { origin: 'twitch', code: 'VoHiYo', id: 81274 },
        '28087': { origin: 'twitch', code: 'WutFace', id: 28087 }
    },

};