
//dude

class g_arrow extends Gobj {

    constructor(oid) {
        super('g_arrow', G.Stage_, G.World_, oid);
        var t = this;
        t.firing = false;
        t.damage = 100;
    }

    Init() {
        var t = this;
        t.color = 0x0;

        t.Part('body', G.Bod.rectangle(t.spos.x, t.spos.y, 30, 10, {
            inertia: Infinity, frictionAir: 0, isSensor: true,
        }));

        t.addG(t.body, 'bpart', G.texture(null, CG.textures.arrow, {
            zIndex: 2.1,
        }));
        t.body.grs.bpart.scale = {x: 0.4, y: 0.4};


        super.Init();
        t.con.collisionFilter.category = G.cats[6];
        t.con.collisionFilter.mask = G.cats[1] | G.cats[2];
    };

    Fire(){
        var t = this;
        var grav = 0.285;

        if(UT.List(CG.guys).length > 0){
            var guys = UT.List(CG.guys)._where(x=> 
                !x.flung && !x.grabbed && x.pos.x > (CG.archer.pos.x+250));

            var guy = guys.length > 0 ? guys[Math.floor(guys.length * Math.random())] : null;

            if(guy){
                var floorTop = CG['floor' + guy.plane].con.bounds.min.y;
                var disToFloor = floorTop - t.pos.y;
                var time = disToFloor / 0.285;
                time = Math.sqrt((2 * disToFloor) / grav);

                var futurePos = guy.pos.x - (Math.abs(guy.vel.x) * time) - 80;
                var dist = Math.abs(t.pos.x - futurePos);
                var vOrigin = dist / time;

                var ranCons = 0.5;
                if (dist > 300)
                    ranCons = 1;
                if (dist > 600)
                    ranCons = 2;
                if (dist > 900)
                    ranCons = 3;

                vOrigin = -ranCons + vOrigin + Math.random() * ranCons * 2;

                //18
                t.SetVel(vOrigin, -1);
                t.firing = true;

                clearTimeout(t.ttArrow);
                t.ttArrow = setTimeout(function () {
                    if (t.firing)
                        t.ResetArrow();
                }, 5000);
            }
        }
    }

    ResetArrow(){
        var t = this;
        t.hitTarget = null;
        t.hitOffset = null;
        t.SetVel(0, 0);
        t.SetPos(t.spos.x, t.spos.y);
        t.firing = false;
        if(CG.activeArrow && CG.activeArrow.oid == t.oid)
            CG.activeArrow = null;
    };

    Tick(delta) {
        var t = this;
        if(!t.firing){
            t.body.grs.bpart.alpha = 0;
            t.SetVel(0,0);
            t.SetPos(t.spos.x, t.spos.y);
        }else{
            t.body.grs.bpart.alpha = 1;

            if(CG.activeArrow == null)
                CG.activeArrow = t;

            if(t.pos.y > (CG.h + 100)){
                t.body.grs.bpart.alpha = 0;
                t.ResetArrow();
            }

            G.spawnParticle(CG.fxFire1, {
                zIndex: 18,
                pos: {x: t.pos.x, y: t.pos.y},
                vel: {x: 0, y: Math.random()*-3}
            });

            if(t.hitTarget == null)
                t.SetPos(t.pos.x, t.pos.y, Math.atan2(t.vel.y, t.vel.x));

            if (t.hitTarget != null){
                t.SetPos((t.hitTarget.pos.x + t.hitOffset.x), (t.hitTarget.pos.y + t.hitOffset.y));
            }
        }
    };

    CollideStart(myType, objType, obj) {
        var t = this;

        if (obj.type == 'g_guy' && t.firing && t.hitTarget == null && !obj.dying && !obj.grabbed){
            obj.hit = true;
            clearTimeout(obj.ttHit);
            obj.ttHit = setTimeout(function(){
                obj.hit = false;
            }, 500);
            obj.SetVel(obj.vel.x+4, obj.vel.y-2);
            var dmg = Math.random() > 0.5 ? t.damage : 75;

            if(dmg <= 75)
                CG.sxSplat2.play();

            obj.health -= dmg;
            obj.CheckDeath(5/2);

            if(obj.health <=0){
                obj.DeathAnimation(false, ()=> Math.random()*t.vel.x*0.5, ()=> -2 + Math.random()*4);
            }

            t.hitOffset = {x: obj.pos.x - t.pos.x - t.vel.x*2, y: obj.pos.y - t.pos.y - t.vel.y*2};
            t.hitTarget = obj;

            setTimeout(function(){
                t.body.grs.bpart.alpha = 0;
                t.ResetArrow();
            },200);
        }
    };

    CollideEnd(myType, objType, obj) {
        var t = this;
    };

    OnRemove() {
    };
}
if (typeof exports !== 'undefined')
    module.exports = g_arrow;

