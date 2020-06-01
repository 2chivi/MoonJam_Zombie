
//dude

class g_cam extends Gobj {

    constructor(oid) {
        super('g_cam', G.Stage_, G.World_, oid);
        var t = this;
    }

    Init() {
        var t = this;
        t.color = 0xffffff;

        t.Part('body', G.Bod.rectangle(t.spos.x, t.spos.y, 2, 2, {
            isSensor: true, isStatic: true
        }));

        t.addG(t.body, 'bpart', 
            { color: t.color, opacity: 0, lineWidth: 4, lineOpacity: 0 });

        //t.addG(t.body, 'bpart',G.circle(null, 10, {
            //zIndex: 1.5, color: t.color, opacity:0.2, lineWidth:4, lineOpacity:0.2
        //}));

        super.Init();
        t.con.grav = 0;
    };

    Tick(delta) {
        var t = this;
        var cenx = G.Stage_.pivot.x + 0.5 * (G.Width / G.Stage_.scale.x);
        var ceny = G.Stage_.pivot.y + 0.5 * (G.Height / G.Stage_.scale.x);
        var dx = t.pos.x - cenx;
        var dy = t.pos.y - (ceny + 0);
        var rate = 17;

        //t.centerOffset = {x: }
        G.Stage_.pivot.x += dx / rate;
        G.Stage_.pivot.y += dy / rate;
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
    module.exports = g_cam;

