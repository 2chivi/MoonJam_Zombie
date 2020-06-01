
var CG = {

    bombs: {},
    guys: {},
    archers: {},
    totalArchers: 0,
    archers: [],
    money: 0,
    roundTime: 60,
    startTime: 0,
    round: 0,
    score: 0,
    messages: [{twitch: 'test', msg: 'test message', emote: EM.textures['moon2DUMB']}],
    totalMessages: 0,


    Init: function(){

        CG.textures = {};



        CG.f1 = new PIXI.filters.GlowFilter(5, 5, 0, 0x0, 1);
        G.Loader_.add({name: 'wood', url: 'woodTile.jpg', crossOrigin: ''});
        G.Loader_.add('grass', 'grassTile.jpg');
        G.Loader_.add('house', 'house.png');
        G.Loader_.add('moon', 'moon.png');
        G.Loader_.add('arrow', 'arrow.png');
        G.Loader_.add('stars', 'stars.png');
        G.Loader_.add('cloud', 'cloud.png');
        G.Loader_.add('witch', 'witch.png');
        G.Loader_.add('bomb', 'bomb.png');

        G.Loader_.load(function (loader, res) {
            res._each(r => {
                r.texture.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT;
                r.texture.baseTexture.wrap = true;
                r.texture.baseTexture.update();
                CG.textures[r.name] = r.texture;
            });
            


        });
    },

    Continue: function(){
        setTimeout(function () { CG.wall.health = CG.wall.maxHealth; },2000);
        CG.wall.health = CG.wall.maxHealth;
        M.Dad.refs.End.setState({ ended: false });

    },

    StartGame: function(){
        var mh = $('.div-gcontainer').height()// * (16 / 9);
        var mw = $('.div-gcontainer').width()// * (9 / 16);

        if ((mw / mh) < (16/9)) {
            G.Height = $('.div-gcontainer').width() * (9 / 16);
            G.Width = $('.div-gcontainer').width();
        } else {
            G.Height = $('.div-gcontainer').height();
            G.Width = $('.div-gcontainer').height() * (16 / 9);
        }

        //G.Height = $('.div-gcontainer').height();
        //G.Width = $('.div-gcontainer').width();// G.Height * (4/3); //
        CG.Scale = { x: 1, y: 1 };
        CG.Scale.x = CG.Scale.y = (G.Width / G.StartWidth_) * 1;

        M.Dad.refs.Start.setState({ started: true });

        CG.InitGame();

        CG.tmi = new tmi.Client({
            connection: { secure: true, reconnect: true },
            channels: ['moonmoon']
        });
        CG.tmi.connect();
        CG.tmi.on('message', function (channel, tags, msg, self) {

            if (CG.totalMessages < 5 && msg.length < 50) {
                var words = msg.split(' ');
                CG.totalMessages++;

                for (var i = 0; i < words.length; i++) {
                    var word = words[i];

                    if (EM.textures[word]) {
                        CG.messages._queue({
                            twitch: tags.subscriber ? '🌙 ' + tags.username : tags.username,
                            text: msg.replace(word, ''),
                            emote: EM.textures[word],
                            guy: null,
                        }, 15);
                        break;
                    }
                }
            }
        });


        EM.GetEmotes(function () {
            CG.music = new Howl({ src: ['well.mp3'], loop: false, volume: 0.3 });
            CG.sxSplat = new Howl({ src: ['splat.ogg'], loop: false, volume: 0.3 });
            CG.sxSplat2 = new Howl({ src: ['splat.ogg'], loop: false, volume: 0.15 });
            CG.sxRepair = new Howl({ src: ['repair.wav'], loop: false, volume: 1 });
            CG.sxRecruit = new Howl({ src: ['recruit.flac'], loop: false, volume: 0.1 });
            CG.sxExplode = new Howl({ src: ['explode.mp3'], loop: false, volume: 0.1 });
            CG.sxIntro = new Howl({ src: ['heart.wav'], loop: false, volume: 0.4 });
            CG.sxHit = new Howl({ src: ['hit.wav'], loop: false, volume: 0.05 });
            CG.sxLaserShot = new Howl({ src: ['laserShot.wav'], loop: false, volume: 0.2 });
            CG.sxGong = new Howl({ src: ['gong.wav'], loop: false, volume: 0.45 });
            CG.sxLaser = new Howl({ src: ['351807__plasterbrain__laser-charging (1) - Copy.ogg'],
                 loop: false, volume: 0.2, rate: 2 });


            var gr = G.rect(null, 12, 40, 5, { color: 0x21212b, lineWidth: 2 });
            CG.leg = G.Renderer_.generateTexture(gr, null, null,
                new PIXI.Rectangle(-gr.width / 2, -gr.height / 2, gr.width, gr.height));

            gr = G.rect(null, 50, 30, 5,
                { lineWidth: 3, color: 0xff0000 });
            CG.bomb = G.Renderer_.generateTexture(gr, null, null,
                new PIXI.Rectangle(-gr.width / 2, -gr.height / 2, gr.width, gr.height));

            CG.fxFlung = G.circle(null, 8, { color: 0x5c5b79, opacity: 0.5 });
            CG.fxBlood = G.circle(null, 8, { color: 0xff0000, opacity: 0.8 });
            CG.fxLight = G.circle(null, 5, { color: 0xffffff, opacity: 0.6 });
            CG.fxFire1 = G.circle(null, 5, { color: 0xffb52e, opacity: 0.7 });
            CG.fxFire2 = G.circle(null, 15, { color: 0xffb52e, opacity: 0.7 });

            CG.CreateObjs();
            CG.StartRound();
            console.log('done getting emotes');
        });
    },

    InitGame: function(){
        G.Init_($('.div-game'), function () {
            CG.Events();
            //CG.CreateObjs();
            $('canvas').attr('oncontextmenu', 'return false;');
            G.Stage_.scale = CG.Scale;
            
        });
    },

    CreateObjs: function(){
        var w = CG.w = G.Width / CG.Scale.x; 
        var h = CG.h = G.Height / CG.Scale.x;

        CG.cam = G.InitAndLoad(null, 'g_cam', { spos: { x: w/2, y: h/2 } });
        CG.wall = G.InitAndLoad(null, 'g_wall', { spos: { x: 480, y: h - 150 } });
        CG.church = G.InitAndLoad(null, 'g_church', { spos: { x: 200, y: h - 200 } });

        CG.archer = G.InitAndLoad(null, 'g_archer', { side: 0, spos: { x: 350, y: h - 420 } });
        CG.archer2 = G.InitAndLoad(null, 'g_archer', { side: 1, spos: { x: 500, y: h - 450 } });

        CG.fog = G.InitAndLoad(null, 'g_fog', { spos: { x: 0, y: 0 } });
        CG.moon = G.InitAndLoad(null, 'g_moon', { spos: { x: w- 300, y: 300 } });

        var pad = 50;
        w+= 200;

        CG.floor3 = G.InitAndLoad('land-1', 'g_land',
            { plane: 3, pnts: [0, h - 50, w, h - 50, w, h + 20, 0, h + 20] });

        CG.floor4 = G.InitAndLoad('land-2', 'g_land',
            { plane: 4, pnts: [0, -pad + h - 50, w, -pad + h - 50, w, -pad + h + 20, 0, -pad + h + 20] });

        CG.floor5 = G.InitAndLoad('land-3', 'g_land',
            { plane: 5, pnts: [0, -pad * 2 + h - 50, w, -pad * 2 + h - 50, w, -pad * 2 + h + 200, 0, -pad * 2 + h + 200] });
            

        CG.floorGrass = G.InitAndLoad('land-grass', 'g_land',
            { plane: -1, pnts: [2080, 780, 1900, 900, 1680, 940, 1320, 980, 1020, 980, 760, 920, 600, 920, 200, 960, -0, 960, -0, 1240, 1940, 1220, 2080, 780] });
        CG.floorGrass.pos.y -= 100;

    },

    Flare: function(){
        if (CG.money >= 100) {
            CG.money -= 100;
            CG.moon.Flare();
        }
    },

    Bomb: function(){
        //create bomber guy
        //onclick the guy explodes or just times out
        var archer = CG.archer.archer == null ? CG.archer2 : CG.archer;

        if (CG.money >= 50 && archer.archer != null){
            CG.money-= 50;

            var twitch = archer.archer.twitch;
            var emote = archer.archer.emote;
            

            var bomb = G.InitAndLoad(null, 'g_bomber', {
                twitch: twitch,
                emote: emote,
                plane: 3,
                spos: { x: CG.wall.pos.x + 50, y: CG.h - 140 },
            });

            var removeIndex = null;
            for(var i = 0; i < CG.archers.length; i++){
                if (CG.archers[i].uid == archer.archer.uid)
                    removeIndex = i;
            }

            if(removeIndex != null)
                CG.archers.splice(removeIndex, 1);

            archer.archer = null;
            CG.bombs[bomb.oid] = bomb;
        }
    },

    Repair: function(amount){
        var dmg = CG.wall.maxHealth - CG.wall.health;
        var heal = Math.min(CG.money, dmg, amount)
        if(heal > 0){
            CG.sxRepair.play();
            CG.wall.health += heal;
            CG.money -= heal;
        }
    },

    StartRound: function(){
        CG.music.stop();
        CG.music.play();
        CG.startTime = Date.now();
        CG.money -= (CG.archer.upkeep * CG.archers.length);
        CG.round++;
        CG.sxIntro.play();
        CG.SpawnGuy();
        setTimeout(function () { CG.SpawnGuy(); },1500);

        clearInterval(CG.ttGame);
        CG.ttGame = setInterval(function () {
            if (CG.wall) {
                CG.timer = 60 - ((Date.now() - CG.startTime) / 1000);
                

                if (CG.timer <= 0) {
                    CG.timer = 0;

                    if(CG.LastTime != 0){
                        //CG.music.stop()
                        setTimeout(function () { CG.sxGong.play(); }, 400);
                    }
                }else{
                    //200 -> 180
                    var diff = 50;


                    if(((30 + CG.round) * Math.random()) > 25){
                        CG.SpawnGuy();
                    }
                }


                if (CG.wall.health <= 0) {
                    //kill all guys
                    CG.guys._each(g => {
                        g.health = 0;
                        g.CheckDeath(2.5);
                    });

                    M.Dad.refs.End.setState({ ended: true });
                }


                M.Dad.refs.UI.setState({
                    health: CG.wall.health,
                });

                CG.LastTime = CG.timer;
            }

            CG.totalMessages = 0;
        }, 500);
    },

    SpawnGuy: function(){
        var t = this;
        var spawnChat = UT.List(CG.guys).length % 2 == 0;
        var msg = CG.messages._first(x=> !x.used);
        var myScale = 1;
        var health = 100;
        var hasBomb = false;
        var speed = 2;
        var attack = 1;

        var s1 = Math.min(4, CG.round*0.5);
        speed = Math.min(6, s1 + Math.random() * 4);
        

        if(!spawnChat)
            msg = null;

        if(spawnChat && msg == null){
            msg = { twitch: '', text: '...', emote: EM.textures['moon2N']};
        }

        if (CG.round > 1 && ((30 + CG.round) * Math.random()) > 27){
            if(CG.round > 2 && Math.random() > 0.5){
                myScale = 2;
                health = 400;
                speed = 1.5;
                attack = 5;
            }else{
                speed = 6;
                hasBomb = true;
            }
        }


        var guy = G.InitAndLoad(null, 'g_guy', {
                canRecruit: msg != null,
                plane: 2 + Math.ceil(Math.random() * 3), 
                spos: { x: CG.w - 50, y: CG.h - 140 },
                twitch: msg ? msg.twitch : '',
                message: msg ? msg.text : 'mmrr..',
                emote: msg ? msg.emote : EM.textures['moon2DUMB'],
                myScale: myScale,
                health: health,
                speed: speed,
                hasBomb: hasBomb,
                attack: attack,
            });

        if(msg){
            msg.guy = guy;
            msg.used = true;
        }
        CG.guys[guy.oid] = guy;
    },

    Click: function(isDown){
        var guys = UT.List(CG.guys);
        var bombs = UT.List(CG.bombs);
        var doBreak = false;

        for(var i = 0; i < bombs.length; i++){
            var bomb = bombs[i];
            var dist = G.dist({ x: CG.mx, y: CG.my }, bomb.pos);
            if(isDown && dist < 50){
                bomb.Explode();
                doBreak = true;
            }
        }

        if(doBreak)
            return;

        for (var i = 0; i < guys.length; i++){
            var guy = guys[i];
            var dist = G.dist({ x: CG.mx, y: CG.my }, guy.pos);

            if (isDown && dist < 50) {
                if(guy.myScale == 2){
                    if(!guy.clicked){
                        guy.Clicked();
                        break;
                    }
                }else{
                    guy.grabbed = true;
                    break;
                }
            }

            if(!isDown && guy.grabbed){
                guy.Flung();
                guy.grabbed = false;
            }
        }
    },

    Events: function () {

        /*
        $(document)._onoff('keydown', function (e, t, a) {
            var key = CG.GetKey(e);
            CG.guy[key] = true;

        })._onoff('keyup', function (e) {
            var key = CG.GetKey(e);
            CG.guy[key] = false;
        });*/

        $('canvas')._onoff('touchmove mousemove', function (e) {
            CG.UpdatePointer(e);
        });

        $('canvas')._onoff('mousedown touchstart', function (e) {
            CG.UpdatePointer(e);
            CG.mouse1 = {x: CG.mx, y: CG.my};
            CG.Click(true);
        });

        $('canvas')._onoff('mouseup touchstart', function (e) {
            CG.UpdatePointer(e);
            CG.mouse1 = null;
            CG.Click(false);
        });
    },

    GetKey: function (e) {
        var key = null;
        if (e.keyCode == 32) key = 'KeySpace';
        if (e.keyCode == 87) key = 'KeyUp';
        if (e.keyCode == 65) key = 'KeyLeft';
        if (e.keyCode == 83) key = 'KeyDown';
        if (e.keyCode == 68) key = 'KeyRight';
        if (e.keyCode == 69) key = 'KeyE';
        return key;
    },

    UpdatePointer: function (e) {
        var ev = e;
        if (e.type.indexOf('touch') >= 0)
            ev = e.originalEvent.touches[0];

        CG.mx = ((ev.pageX - $(G.con).offset().left) / G.Stage_.scale.x) + (G.Stage_.pivot.x);
        CG.my = ((ev.pageY - $(G.con).offset().top) / G.Stage_.scale.y) + (G.Stage_.pivot.y);
    },

}