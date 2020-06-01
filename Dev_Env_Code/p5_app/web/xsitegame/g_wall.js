
//dude

class g_wall extends Gobj {

    constructor(oid) {
        super('g_wall', G.Stage_, G.World_, oid);
        var t = this;
        t.health = 300;
        t.maxHealth = 300;
    }

    Init() {
        var t = this;
        t.color = 0x0;

        t.Part('body', G.Bod.rectangle(t.spos.x, t.spos.y, 60, 300, {
            restitution: 0.5, inertia: Infinity, isStatic: true, isSensor: true,
        }));

        t.addG(t.body, 'bpart', {
            zIndex: 1.5, color: t.color, opacity: 0
        });

        
        super.Init();
    };

    Tick(delta) {
        var t = this;
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
    module.exports = g_wall;

