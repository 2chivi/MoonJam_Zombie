
//dude

class g_moon extends Gobj {

    constructor(oid) {
        super('g_moon', G.Stage_, G.World_, oid);
        var t = this;
    }

    Init() {
        var t = this;
        t.color = 0xffffff;
        t.clouds = [];
        t.shot = false;

        t.Part('body', G.Bod.rectangle(t.spos.x, t.spos.y, 20, 20, {
            isStatic: true, isSensor: true
        }));

        var tex = G.texture(null, CG.textures.moon, { zIndex: 1.25});
        var ft = G.filterTex(EM.f3, 5, tex, { zIndex: 2 });


        t.addG(t.body, 'house', G.texture(null, ft, {
            zIndex: 0.5,
        }), 0, 0);
        t.body.grs.house.scale = { x: 1.3, y: 1.3 };

        t.addG(t.body, 'house2', tex, 100, -250);
        t.body.grs.house2.zIndex = 0.5;
        t.body.grs.house2.scale = { x: 0.5, y: 0.5 };
        t.body.grs.house2.wa = -0.2;


        t.addG(t.body, 'stars', G.rect(null, CG.w, 900, 1, 
            { alpha: 0.5, zIndex: 0,  texture: CG.textures.stars }), 300 + -CG.w/2);
        //t.body.grs.stars.zIndex = 0.75;


        var cloud = t.addG(t.body, 'cloud1', G.rect(null, 400, 200, 1,
            { alpha: 0.2,  texture: CG.textures.cloud }), -CG.w - 100);
        cloud.scale = {x: 2.5, y: 2};
        cloud.tspeed = 1;
        t.clouds.push(cloud);

        var cloud = t.addG(t.body, 'cloud2', G.rect(null, 400, 200, 1,
            { alpha: 0.2, texture: CG.textures.cloud }), -100 -CG.w/4, -70);
        cloud.scale = { x: 2, y: 1.5 };
        cloud.tspeed = 0.8;
        t.clouds.push(cloud);

        var cloud = t.addG(t.body, 'cloud3', G.rect(null, 400, 200, 1,
            { alpha: 0.2, texture: CG.textures.cloud }), -CG.w/2, 80);
        cloud.scale = { x: 2.5, y: 2 };
        cloud.tspeed = 1.4;
        t.clouds.push(cloud);

        var cloud = t.addG(t.body, 'witch', G.rect(null, 200, 200, 1,
            { zIndex: 0.7, alpha: 0.95, texture: CG.textures.witch }), 500, -50);
        cloud.scale = { x: -0.5, y: 0.5 };
        cloud.tspeed = -2;
        t.clouds.push(cloud);



        var pnts = [1560, 300, 140, 520, 160, 620, 1560, 300];

        t.flare1 = t.addG(t.body, 'flare1', G.poly(null, pnts,
            { zIndex: 10, alpha: 0, offx: 0, offy: 0, color: 0xb7af91, }), -t.spos.x, -t.spos.y);

        pnts = [140, 540, 1880, 1100, 620, 1100, 140, 620, 140, 540];
        t.flare2 = t.addG(t.body, 'flare2', G.poly(null, pnts,
            { zIndex: 10, alpha: 0, offx: 0, offy: 0, color: 0xb7af91, }), -t.spos.x, -t.spos.y);

        t.emote = EM.textures['moon2M'];
        t.head = t.addG(t.body, 'head', G.texture(null, t.emote, 
            { zIndex: 1.5, alpha: 0 }), -50 + CG.church.spos.x - t.spos.x, -300 + CG.church.spos.y - t.spos.y);
        t.head.scale = {x: 0.8, y: 0.8};

        super.Init();
    };

    Flare(){
        var t = this;
        t.charging = true;
        t.flare1.alpha 
        CG.sxLaser.play();
        t.shot = false;
        t.head.alpha = 0.8;
        

        setTimeout(function(){
            setTimeout(function(){
                t.head.alpha = 0;
            },500);
            
            t.charging = false;
        }, 3000);
    }

    Shoot(){
        var t = this;
        t.shot = true;
        CG.sxLaserShot.play();

        //each guy take damage
        CG.guys._each(g=> {  
            g.health -= 50;
            g.CheckDeath(1.5);

            if(g.health <= 0)
                g.DeathAnimation();
        });

        clearTimeout(t.ttTime);
        t.ttTime = setTimeout(function(){  
            t.shot = false;
        }, 6000);
    }

    Tick(delta) {
        var t = this;
        t.updated = true;

        if(t.charging && t.flare1.alpha < 0.5)
            t.flare1.alpha += 0.01;

        else if (t.charging && t.flare2.alpha < 0.5){
            if(!t.shot){
                t.Shoot();
                CG.fog.sources[1].power = 3500;
            }
            t.flare2.alpha += 0.05;
        }

        if(!t.charging){
            t.flare1.alpha = 0;
            t.flare2.alpha = 0;
        }

        t.clouds._each(x=> {
            x.wx += x.tspeed;
            if(x.wx < (-CG.w-200) && x.tspeed == -2){
                x.wx = 500;
                x.wy = -200 + Math.random() * 200;
            }
            else if(x.wx > 500){
                if(x.tspeed != 2)
                    x.tspeed = 0.5 + Math.random()*1;
                x.wx = -CG.w - 200;
                x.wy = -200 + Math.random()*200;

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
    module.exports = g_moon;

