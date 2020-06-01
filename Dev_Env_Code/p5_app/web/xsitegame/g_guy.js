
//dude

class g_guy extends Gobj {

    constructor(oid) {
        super('g_guy', G.Stage_, G.World_, oid);
        var t = this;
        t.health = 100;
        t.dying = false;
        t.attack = 1;
        t.speed = 1.5 + Math.random()* 3;
        t.hit = false;
        t.plane = 1;
        t.grounded = 0;
        t.recruiting = false;
        t.message = 'test 12322';
        t.twitch = '';
        t.canRecruit = false;
        t.myScale = 2;
        t.clicked = false;
        t.hasBomb = false;
    }

    Init() {
        var t = this;
        t.color = 0xff0000;
        if(!t.emote)
            t.emote = EM.textures['moon2DUMB'];

        var txtSettings = {
            fontSize: 20, strokeThickness: 4,
            fontWeight: 600,
            fill: 'white',
            zIndex: 5,
        };

        t.w = 30 * t.myScale;
        t.h = 55 * t.myScale;
        t.Part('body', G.Bod.rectangle(t.spos.x, t.spos.y, t.w , t.h, {
            restitution: 0.5, inertia: Infinity, friction: 0.02
        }));

        if(t.hasBomb){
            t.addG(t.body, 'bomb', G.texture(null, CG.textures.bomb, {
                zIndex: 1.5001 - (t.plane * 0.01)
            }));
            t.body.grs.bomb.scale = {x: 0.4, y: 0.4};
        }

        var l1 = t.l1= t.addG(t.body, 'l1', G.texture(null, CG.leg, {
            zIndex: 1.5 - (t.plane * 0.01), 
        }), 4, 0, 0, -20);
        var l2 = t.l2 = t.addG(t.body, 'l2', G.texture(null, CG.leg, {
            zIndex: 1.5 - (t.plane * 0.01),
        }), -4, 0, 0, -20);
        l1.scale = { x: t.myScale, y: t.myScale };
        l2.scale = { x: t.myScale, y: t.myScale };

        var arm = t.arm = t.addG(t.body, 'arm', G.texture(null, CG.leg, {
            zIndex: 1.5 - (t.plane * 0.01),
        }), -10, -20, 0, -20);
        arm.wa = 1.5;
        arm.scale = { x: t.myScale, y: t.myScale };

        arm.animate = {
            states: [[arm.wx, arm.wy, 1.5], [arm.wx, arm.wy, 2.5], [arm.wx, arm.wy, 1.5]],
            period: 20, repeat: true, active: false,
        }

        l1.animate = {
            states: [[l1.wx, l1.wy, 0], [l1.wx, l1.wy, -1], [l1.wx, l1.wy, 0], [l1.wx, l1.wy, 1], [l1.wx, l1.wy, 0]],
            period: (80 / t.speed) * t.myScale, repeat: true, active: true,
        }
        l2.animate = {
            states: [[l2.wx, l2.wy, 0], [l2.wx, l2.wy, 1], [l2.wx, l2.wy, 0], [l2.wx, l2.wy, -1], [l2.wx, l2.wy, 0]],
            period: (80 / t.speed)*t.myScale, repeat: true, active: true,
        }


        if(t.emote){
            t.addG(t.body, 'head', G.texture(null, t.emote,
                { zIndex: 1.5 - (t.plane * 0.01) }), 0, -20 * t.myScale);
            t.body.grs.head.scale = {x: t.myScale, y: t.myScale};
        }

        if(t.twitch && t.twitch.length > 0){
            t.addG(t.body, 'msg',
                G.text(null, t.twitch, null, txtSettings), 0, -40 - (t.body.grs.head.height / 2));
        }
        

        
        super.Init();
        t.con.collisionFilter.category = G.cats[2];
        t.con.collisionFilter.mask = G.cats[t.plane] | G.cats[0] | G.cats[6];
        t.con.grav = 2;
    };

    DeathAnimation(resetVel, vx, vy){
        var t = this;
        if(resetVel)
            t.SetVel(0, 0);
        t.SetPos(t.pos.x, t.pos.y, -Math.PI / 2);
        t.arm.hidden = true;
        CG.sxSplat.play();

        if(!vx)
            vx = function() { return -10 + Math.random() * 20 };
        if(!vy)
            vy = function() { return -2 + Math.random() * 4};;

        for (var h = 0; h < 20; h++) {
            G.spawnParticle(CG.fxBlood, {
                life: 30,
                zIndex: 18,
                vel: { x: vx(), y: vy() },
                pos: { x: t.pos.x, y: t.pos.y }
            });
        }
    };

    FallDamage(){
        var t = this;
        if(t.vel.y > 10){
            var vel = Math.abs(t.vel.y)*0.75;
            t.health -= vel*5;
            t.CheckDeath(5);

            if(t.health <= 0){
                t.DeathAnimation(true);
            }
        }
    }

    Flung(){
        var t = this;
        var max = 50;
        var vx = (CG.mx - t.prevPos.x) * 0.3;
        var vy = (CG.my - t.prevPos.y) * 0.3
        vy = Math.max(vy, -max);

        if (vx > max) vx = max;
        if (vx < -max) vx = -max;

        t.SetVel(vx, vy);
        t.flung = true;

        for(var i = 0; i < 6; i++){
            G.TickFunc(G.Tick + i, function () {
                for(var h = 0; h < 2; h++){
                    G.spawnParticle(CG.fxFlung, {
                        zIndex: 21,
                        pos: { x: -8 + Math.random()* 16 + t.pos.x, y: t.pos.y }
                    });
                }
            });
        }
        
    };

    CheckDeath(money = 5, when=1000){
        var t = this;

        if(t.health <= 0 && !t.dying){
            t.dying = true;
            
            setTimeout(function () {
                CG.score += 1;
                CG.money += money;
                G.RemoveObject_(t);
                delete CG.guys[t.oid];
            }, when);
        }
    }

    Clicked(){
        var t = this;
        t.health -= 30;
        t.clicked = true;
        t.SetVel(0, -5);
        t.CheckDeath(20);
        if(t.health <= 0)
            t.DeathAnimation();
        else
            CG.sxSplat2.play();
        setTimeout(function(){ t.clicked = false; }, 1000);
    }

    Tick(delta) {
        var t = this;
        t.prevPos = {x: t.pos.x, y: t.pos.y};
        t.l1.animate.active = false;
        t.l2.animate.active = false;
        t.arm.animate.active = false;

        if(t.pos.x > (CG.w+ 500) || t.pos.x < -500 || t.pos.y > 2000){
            t.SetPos(t.spos.x, t.spos.y);
            t.SetVel(0,0);
        }

        if(t.grabbed){
            //t.SetVel(CG.mx - prevPos.x, CG.my - prevPos.y);
            t.SetVel(0,0);
            t.SetPos(CG.mx, CG.my);
            t.arm.animate.active = true;
        }

        if(t.hasBomb && !t.dying){
            if (G.Tick % 2 == 0) {
                G.spawnParticle(CG.fxFire1, {
                    zIndex: 18,
                    life: 20,
                    pos: { x: t.pos.x + 30, y: t.pos.y },
                    vel: { x: 0, y: Math.random() * -3 }
                });
            }
        }

        if (!t.grabbed && !t.flung && !t.recruiting && !t.hit && !CG.moon.shot){
            var nearWall = G.dist(t.pos, {x: CG.wall.pos.x, y: t.pos.y}) < 50;

            if(nearWall && G.Tick % 15 == 0){
                if(t.hasBomb && !t.dying){
                    CG.sxExplode.play();
                    CG.wall.health -= 50;
                    t.health = 0;
                    t.CheckDeath();
                    t.DeathAnimation();

                    for (var i = 0; i < 20; i++) {
                        G.spawnParticle(CG.fxFire2, {
                            zIndex: 18,
                            life: 20,
                            pos: { x: t.pos.x, y: t.pos.y - 20 },
                            vel: { x: -8 + Math.random() * 16, y: -8 + Math.random() * 16 }
                        });
                    }


                }else{
                    CG.wall.health -= t.attack;
                    if (!CG.sxHit.sounds || CG.sxHit.sounds.length < 10)
                        CG.sxHit.play();
                }
            }

            if (!nearWall && G.Tick % 30 == 0 && t.body.grs.msg && t.body.grs.msg.text != t.message && Math.random() > 0.7){
                t.body.grs.msg.text = t.message;

                setTimeout(function () { 
                    t.body.grs.msg.text = t.twitch;
                },3000);
            }

            if(t.grounded && !nearWall && !t.dying && !t.clicked && !CG.moon.shot){
                t.SetVel(-t.speed, t.vel.y);
                t.l1.animate.active = true;
                t.l2.animate.active = true;
            }else{
                t.arm.animate.active = true;
            }
        }

        if(t.health <= 0 && !t.dying){
            t.CheckDeath();
        }
    };

    CollideStart(myType, objType, obj) {
        var t = this;

        if(objType == 'terrain'){
            t.grounded++;
            t.flung = false;
            t.FallDamage();
        }
        
        if (obj.type == 'g_church' && objType =='body' && !t.recruiting){
            var canRecruit = t.canRecruit && !t.recruiting && !t.dying && !obj.recruiting;
            t.grabbed = false;

            if(canRecruit)
                obj.Recruit(t);
            else{
                setTimeout(function(){
                    t.SetPos(t.spos.x, t.spos.y);
                    t.SetVel(0, 0);
                }, 1000);
            }
        }
    };

    CollideEnd(myType, objType, obj) {
        var t = this;
        if (objType == 'terrain') {
            t.grounded--;
        }
    };

    OnRemove() {
    };
}
if (typeof exports !== 'undefined')
    module.exports = g_guy;

