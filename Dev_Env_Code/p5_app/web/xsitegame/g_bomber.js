
//dude

class g_bomber extends Gobj {

    constructor(oid) {
        super('g_bomber', G.Stage_, G.World_, oid);
        var t = this;
        t.twitch = '';
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

        t.Part('body', G.Bod.rectangle(t.spos.x, t.spos.y, 30, 40, {
            restitution: 0.5, inertia: Infinity, friction: 0.02
        }));

        var l1 = t.l1 = t.addG(t.body, 'l1', G.texture(null, CG.leg, {
            zIndex: 1.5 - (t.plane * 0.01),
        }), 4, 0, 0, -20);
        var l2 = t.l2 = t.addG(t.body, 'l2', G.texture(null, CG.leg, {
            zIndex: 1.5 - (t.plane * 0.01),
        }), -4, 0, 0, -20);

        l1.animate = {
            states: [[l1.wx, l1.wy, 0], [l1.wx, l1.wy, -1], [l1.wx, l1.wy, 0], [l1.wx, l1.wy, 1], [l1.wx, l1.wy, 0]],
            period: 30, repeat: true, active: true,
        }
        l2.animate = {
            states: [[l2.wx, l2.wy, 0], [l2.wx, l2.wy, 1], [l2.wx, l2.wy, 0], [l2.wx, l2.wy, -1], [l2.wx, l2.wy, 0]],
            period: 30, repeat: true, active: true,
        }

        t.addG(t.body, 'head', G.texture(null, t.emote,
            { zIndex: 1.5 - (t.plane * 0.01) }), 0, -30);

        t.addG(t.body, 'bomb', G.texture(null, CG.textures.bomb, {
            zIndex: 1.5 - (t.plane * 0.01)
        }));
        t.body.grs.bomb.scale = { x: -0.4, y: 0.4 };
        

        t.addG(t.body, 'msg',
            G.text(null, t.twitch, null, txtSettings), 0, -40 - (t.body.grs.head.height / 2));
        //t.body.grs.bomb.wa = -0.5;

        super.Init();
        t.con.collisionFilter.category = G.cats[2];
        t.con.collisionFilter.mask = G.cats[t.plane] | G.cats[0] | G.cats[6];
    };

    Explode(){
        //get enemies near me
        //impart damange / velocity based on distance
        var t = this;
        CG.sxExplode.play();

        for(var i = 0; i < 20; i++){
            G.spawnParticle(CG.fxFire2, {
                zIndex: 18,
                life: 20,
                pos: { x: t.pos.x, y: t.pos.y-20 },
                vel: { x: -8 + Math.random() * 16, y: -8 + Math.random() * 16 }
            });
        }
        

        CG.guys._each(guy=> {
            var dist = G.dist(guy.pos, t.pos);

            if(dist < 500){
                guy.flung = true;
                var test = (1 / dist) * (1 / dist) * 2200000;

                var amnt = Math.max(10, (1 / dist) * (1 / dist) * 2200000);
                amnt = Math.min(600, amnt);

                var blast = Math.min(20, amnt*0.2);
                guy.SetVel(guy.pos.x > t.pos.x ? blast : -blast, -blast);
                guy.health -= amnt;
                guy.CheckDeath(1);

                if(guy.health <= 0){
                    guy.DeathAnimation(false, ()=> Math.random()*-blast*0.5, ()=> Math.random()*-blast*0.5);
                }
            }
        });

        G.RemoveObject_(t);
        delete CG.bombs[t.oid];
    };

    Tick(delta) {
        var t = this;


        if (G.Tick % 2 == 0) {
            G.spawnParticle(CG.fxFire1, {
                zIndex: 18,
                life: 20,
                pos: { x: t.pos.x - 30, y: t.pos.y },
                vel: { x: 0, y: Math.random() * -3 }
            });
        }

        t.SetVel(3, t.vel.y);
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
    module.exports = g_bomber;

