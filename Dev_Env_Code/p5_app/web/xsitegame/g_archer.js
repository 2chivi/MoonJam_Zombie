
//dude

class g_archer extends Gobj {

    constructor(oid) {
        super('g_archer', G.Stage_, G.World_, oid);
        var t = this;
        t.fireRate = Math.max(5, 100 - CG.totalArchers);
        t.upkeep = 10;
        t.arrows = [];
        t.twitch = '';
        t.archer = null;
    }

    Init() {
        var t = this;
        t.color = 0x0;
        if (!t.emote)
            t.emote = EM.textures['moon2DUMB'];

        var txtSettings = {
            fontSize: 20, strokeThickness: 4,
            fontWeight: 600,
            fill: 'white',
            zIndex: 5,
        };

        for (var i = 0; i < 20; i++)
            t.arrows.push(G.InitAndLoad(null, 'g_arrow', { spos: t.spos }));

        t.Part('body', G.Bod.rectangle(t.spos.x, t.spos.y, 40, 40, {
            restitution: 0.5, inertia: Infinity, isStatic: true
        }));


        t.addG(t.body, 'head', G.texture(null, t.emote,
            { zIndex: 1.1,}), -20, -15);

        t.addG(t.body, 'msg',
            G.text(null, t.twitch, null, txtSettings), 0, -40 - (t.body.grs.head.height / 2));

        t.body.grs.head.alpha = 0;

        if(t.side == 0){
            txtSettings.fontSize = 25;
            t.addG(t.body, 'count',
                G.text(null, 0, null, txtSettings), -15, 70);
        }
        


        super.Init();
    };

    ShowArcher(a){
        var t = this;
        if(a.emote){
            t.archer = a;
            G.texture(t.body.grs.head, a.emote, { zIndex: 1.1, opacity: 1 });
            t.body.grs.head.alpha = 1;

            if(a.twitch){
                t.body.grs.msg.text = a.twitch;
            }
        }
    }

    Tick(delta) {
        var t = this;
        var now = Date.now();
        t.body.grs.head.visible = t.archer != null;

        if(t.side == 0)
            t.body.grs.count.text = CG.archers.length;

        CG.archers._each(a=> {
            if(now > (a.lastFire + 2500) && a.side == t.side){
                a.lastFire = now;
                if (a.isNew || t.archer == null)
                    t.ShowArcher(a);

                a.isNew = false;
                

                if(Math.random() > 0.8){
                    var arrow = t.arrows._first(x => x.firing == false);
                    if (arrow) arrow.Fire();
                }
            }
        });

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
    module.exports = g_archer;

