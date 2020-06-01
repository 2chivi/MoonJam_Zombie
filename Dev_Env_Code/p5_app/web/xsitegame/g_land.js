
//dude

class g_land extends Gobj {

    constructor(oid) {
        super('g_land', G.Stage_, G.World_, oid);
        var t = this;
        t.pnts = [100, 0, 75, 50, 100, 100, 25, 100, 0, 50, 25, 0];
    }

    Init() {
        var t = this;
        t.color = 0xffffff;
        t.verts = G.SafeVerts(t.pnts);

        t.Part('terrain', G.Bod.fromVertices(0, 0, t.verts, {
            isStatic: true, isSensor: t.plane == -1
        }));

        //for collision detection?
        t.terrain.parts._each(x => { x.oid = t.oid; x.type = 'terrain' });

        var off = {
            x: t.terrain.vertices._max(x => x.x).x - t.verts._max(x => x.x).x,
            y: t.terrain.vertices._max(x => x.y).y - t.verts._max(x => x.y).y
        }

        t.Offset(t.pnts, off.x, off.y);

        if (!G.IsServer) {
            if(t.plane == -1){
                t.addG(t.terrain, 'rect', G.poly(null, t.pnts, {
                    color: t.color, zIndex: 1.2, lineWidth: 5,
                    alignment: 0,
                    offx: 0, offy: 0, texture: CG.textures.grass
                }));

                t.addG(t.terrain, 'rect2', G.poly(null, t.pnts, {
                    color: t.color, zIndex: 1.05, lineWidth: 5, lineOpacity: 0.7, alignment: 0,
                    offx: 0, offy: 0, texture: CG.textures.grass, alpha: 0.5
                }),-CG.w/2 + 300, -50);


                t.terrain.grs.rect2.scale.x = -1;
                //t.terrain.grs.rect2.tint = 0x0;
            }
        }

        super.Init({ isStatic: true });
        t.SetPos(t.pos.x - off.x, t.pos.y - off.y);
        t.con.collisionFilter.category = G.cats[t.plane];
    };

    Tick(delta) {
        var t = this;

        t.Events();
    };

    Offset(ar, dx, dy) {
        for (var i = 0; i < ar.length - 1; i += 2) {
            ar[i] += dx;
            ar[i + 1] += dy;
        }
        return ar;
    }

    Events() {
        var t = this;

    }

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
    module.exports = g_land;

