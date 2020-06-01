
//dude

class g_church extends Gobj {

    constructor(oid) {
        super('g_church', G.Stage_, G.World_, oid);
        var t = this;
        t.recruiting = false;
    }

    Init() {
        var t = this;
        t.color = 0x0;
        t.w = 350;

        t.Part('body', G.Bod.rectangle(t.spos.x, t.spos.y, t.w, 300, {
            isStatic: true, isSensor: true
        }));

        t.Part('wall1', G.Bod.rectangle(20 + t.w/2, 0, 70, 270, {
            isStatic: true,
        }));
        t.Part('wall2', G.Bod.rectangle(-t.w / 2, 0, 25, 500, {
            isStatic: true,
        }));



        t.addG(t.wall1, 'wall1', {
            zIndex: 3, color: t.color, opacity: 0
        });
        t.addG(t.wall2, 'wall2', {
            zIndex: 3, color: t.color, opacity: 0
        });

        var tex = G.texture(null, CG.textures.house, {});
        var ft = G.filterTex(EM.f2, 5, tex, { zIndex: 2 });

        t.addG(t.body, 'house', G.texture(null, ft, {
            zIndex: 1.23,
        }), 50, -180);
        t.body.grs.house.scale = {x: 2, y: 2};


        var gr = t.addG(t.body, 'bpart', {
            zIndex: 1.5, color: t.color, opacity: 0, lineOpacity: 0
        });

        t.addG(t.body, 'church', G.rect(null, 30, 30, 0, {
            zIndex: 2, color: t.color, opacity: 0,
        }), 0, (gr.height/2) - 20);

        super.Init();
        t.con.isStatic = true;
    };

    Recruit(guy){
        var t = this;
        t.recruiting = true;
        t.recruitEmote = guy.emote;
        t.recruitTwitch = guy.twitch;
        

        guy.health = 0;
        guy.CheckDeath(0, 100);
        CG.sxRecruit.play();
        t.lightup = true;

        clearTimeout(t.ttLight);
        t.ttLight = setTimeout(function(){
            t.lightup = false;
        },8000);

        clearTimeout(t.ttRecruit);
        t.ttRecruit =  setTimeout(function(){
            t.lightup = false;
            t.recruiting = false;

                CG.archers.push({
                    uid: G.UID_(),
                    isNew: true,
                    side: CG.archers.length % 2,
                    lastFire: Date.now(), 
                    twitch: t.recruitTwitch, 
                    emote: t.recruitEmote
                });
        }, 15000); //15000
    };

    Tick(delta) {
        var t = this;

        if(t.recruiting){
            if (t.lightup && CG.fog.sources[1].power < 1900)
                CG.fog.sources[1].power+= 6;

            //for(var i = 0; i < 2; i++){
                G.spawnParticle(CG.fxLight, {
                    zIndex: 20,
                    life: Math.random() * 100,
                    pos: { x: -40 + Math.random() * 80 + t.pos.x, y: -10 + Math.random() * 20 + t.pos.y - 70 },
                    vel: { x: 0, y: Math.random() * -5 }
                });
            //}
        }
    };

    CollideStart(myType, objType, obj) {
        var t = this;
    };

    CollideEnd(myType, objType, obj) {
        var t = this;
    };

    OnRemove() {
    };
}
if (typeof exports !== 'undefined')
    module.exports = g_church;

