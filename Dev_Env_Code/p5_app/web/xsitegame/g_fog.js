
//dude

class g_fog extends Gobj {

    constructor(oid) {
        super('g_fog', G.Stage_, G.World_, oid);
        var t = this;
    }

    Init() {
        var t = this;
        t.color = 0x0;
        t.squares = [];
        t.sources = [];

        t.Part('body', G.Bod.rectangle(t.spos.x, t.spos.y, 40, 40, {
            restitution: 0.5, inertia: Infinity, isStatic: true
        }));



        var size = t.fsize = 50;
        var w = Math.ceil(CG.w / size);
        var h = Math.ceil(CG.h / size);

        var pxGR = G.rect(null, size, size, 0, { color: 0x0, opacity: 1 });
        var tex = G.Renderer_.generateTexture(pxGR, null, null, new PIXI.Rectangle(-25,-25,50,50));

        
        for(var i = 0; i < w; i++){
            for(var j = 0; j < h; j++){

                var g = t.addG(t.body, 'bpart' + i + '-' + j, G.texture(null, tex, {
                    zIndex: 20
                }), 25 + i * size, 25 + j * size);

                t.squares.push(g);
            }
        }

        t.addG(t.body, 'bpart', {
            zIndex: 1.5, color: t.color,
        });


        super.Init();

        setTimeout(function(){
            t.sources = [
                //{ x: CG.mx, y: CG.my, power: 1000 },
                { x: CG.moon.pos.x + 70, y: CG.moon.pos.y - 40, power: 400 },
                { x: CG.wall.pos.x, y: CG.wall.pos.y, power: 1250 },
                {}
            ];
        },500);
    };

    Tick(delta) {
        var t = this;

        if(!t.sources.length > 0) return;

        if(CG.activeArrow != null)
            t.sources[2] = { x: CG.activeArrow.pos.x, y: CG.activeArrow.pos.y, power: 400 };

        if(CG.activeArrow == null)
            t.sources[2] = {};

        
        if (!CG.church.lightup && t.sources.length > 0 && t.sources[1].power > 1250)
            t.sources[1].power -= 10;

        if(G.Tick % 2 == 0){
            
            t.squares._each(p=>{
                if(!p) return;
                var alpha = 1;

                for (var i = 0; i < t.sources.length; i++){
                    var src = t.sources[i];
                    if(src.power){
                        var dist = Math.max(Math.abs(src.x - p.x), Math.abs(src.y - p.y));
                        var a = dist / src.power;
                        alpha = a < alpha ? a : alpha;
                    }
                }

                 p.alpha = alpha;
            });
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
    module.exports = g_fog;

