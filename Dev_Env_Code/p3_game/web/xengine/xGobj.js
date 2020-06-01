
class Gobj {

    constructor(type, stage, world, oid, group) {
        var t = this;
        t.stage = stage;
        t.world = world;
        t.type = type;
        t.parts = [];
        t.ancParts = [];
        t.anchors = [];
        t.visible = true;
        t.isActive = false; //adds or remove objects completely for performance
        t.InFrame = true; //performance for visibility

        t.oid = oid ? oid : (type + "_" + G.LObjs_.length + "_" + G.UID_());

        if (G.HasMatter_) {
            t.comp = Matter.Composite.create({});
            t.comp.gobj = t.type + " " + t.oid;
            t.group = group ? group : Matter.Body.nextGroup(true);
        }
    }

    Init(options = {}, addObject) {
        var t = this;
        t.isActive = true;
        t.main = t.parts[0];
        t.IsParent = !t.IsAncPart;

        if(t.parts.length > 1){
            options.parts = t.parts;
            t.con = Matter.Body.create(options);
            t.Setup('con',t.con);
        }else
            t.con = t.main;
        
        t.vel = t.con.velocity;
        t.pos = t.con.position;
        Matter.Composite.addBody(t.comp, t.con);
        Matter.World.add(t.world, [t.comp]);

        if(t.state)
            t.olds = [];
        if (addObject)
            G.AddObject(t);
        t.updated = true;
    }

    Part(type, bod){
        var t = this;
        t.Setup(type, bod);
        t.parts.push(bod);
        return bod;
    }

    AncPart(type, anchors, bod){
        var t = this;
        var p = new Gobj(type, t.stage, t.world, type + t.oid, t.group);
        var wx = bod.position.x;
        var wy = bod.position.y;

        t[type] = p;
        p.IsAncPart = true;
        p.Part(type, bod);
        p.Init({}, true);
        p.ancX = wx;
        p.ancY = wy;
        p.ancA = 0;
        p.HasLink = anchors != null;

        if(p.HasLink){
            var anc = anchors[0];
            p.SetPos(t.main.position.x - anc.x + wx, t.main.position.y - anc.y + wy)

            anchors._each(a => {
                t.addLink({
                    bodyA: t.main, bodyB: bod, length: 0,
                    pointA: { x: wx, y: wy },
                    pointB: { x: a.x, y: a.y },
                });
            }); 
        }else{
            p.parentObj = t;
        }
        
        
        t.ancParts.push(p);
    }

    Setup(type, bod) {
        var t = this;
        t[type] = bod;
        bod.grs = {};

        bod.oid = t.oid;
        bod.collisionFilter.group = t.group;
        bod.frictionAir = bod.isSensor ? 0 : bod.frictionAir;
        bod.type = type;
        bod.ogVerts = [];
        bod.ogAxes = [];

        bod.wx = t.parts[0] ? bod.position.x : 0;
        bod.wy = t.parts[0] ? bod.position.y : 0;
        bod.wa = 0;

        if(t.parts[0] && type != 'con'){
            Matter.Body.setPosition(bod, 
                { x: t.parts[0].position.x + bod.wx, y: t.parts[0].position.y + bod.wy });
        }

        bod.vertices._each(v => {
            bod.ogVerts.push({ x: v.x, y: v.y });
        });
        bod.axes._each(v => {
            bod.ogAxes.push({ x: v.x, y: v.y });
        });

        //render stuff
        bod.render.lineWidth = 2;
        bod.render.strokeStyle = "rgba(191, 108, 63, 1)";
        bod.render.fillStyle = "transparent";
        return bod;
    }

    SetActive(active){
        var t = this;
        if(active != t.isActive){
            t.isActive = t.comp.isActive = active;
            t.updated = true;

            for (var i = 0; i < t.ancParts.length; i++)
                t.ancParts[i].SetActive(active);
            if (t.world && active)
                Matter.World.add(t.world, [t.comp]);
            else if (t.world)
                Matter.Composite.remove(t.world, t.comp);
        }
    }

    addG(bod, type, gr, wx = 0, wy = 0, px = 0, py = 0) {
        var t = this;
        if(!gr.transform)
            gr = G.Graphic(bod, gr);

        gr.type = type;
        //gr.bod = bod;
        gr.pivot.set(px + gr.pivot.x, py + gr.pivot.y);
        gr.wx = wx;
        gr.wy = wy;
        gr.wa = 0;
        gr.hidden = false;
        bod.grs[type] = gr;
        t.stage.addChild(gr);
        return gr;
    }

    SetPos(x, y, ang, roundedSync = false){
        var t= this;
        ang = ang != null ? ang : t.main.angle;

        if(roundedSync){
            t.RoundedSync();
        }else{
            if (t.parentObj) {
                var d = {
                    x: t.ancX,// (t.pos.x) - t.parentObj.pos.x,
                    y: t.ancY //(t.pos.y) - t.parentObj.pos.y
                }
                var cos = Math.cos(ang);
                var sin = Math.sin(ang);

                x = x + (d.x * cos - d.y * sin);
                y = y + (d.x * sin + d.y * cos);
                ang += t.ancA;
            }

            Matter.Body.setAngle(t.con, ang);
            Matter.Body.setPosition(t.con, { x, y });
        }

        for (var i = 0; i < t.ancParts.length; i++) {
            t.ancParts[i].SetPos(x, y, ang, roundedSync);
        }

        t.updated = true;
    }

    RoundedSync(){
        var t= this;
        var ogAng = SN.Form(t.con.angle);
        var ogPos = {x: SN.Form(t.pos.x), y: SN.Form(t.pos.y)};
        var ogVel = { x: SN.Form(t.vel.x), y: SN.Form(t.vel.y) };

        t.con.syncFrame = true;

        t.con.parts._each(p => {
            var verts = p.ogVerts; //custom attribtue
            var axes = p.ogAxes;
            for (var j = 0; j < verts.length; j++) {
                p.vertices[j].x = verts[j].x;
                p.vertices[j].y = verts[j].y;
            }
            for (var j = 0; j < axes.length; j++) {
                p.axes[j].x = axes[j].x;
                p.axes[j].y = axes[j].y;
            }

            p.angle = p.wa;
            p.position.x = p.wx;//is this right?
            p.position.y = p.wy;
        });

        Matter.Body.setPosition(t.con, ogPos);
        Matter.Body.setAngle(t.con, ogAng);
        Matter.Body.setVelocity(t.con, ogVel);
        Matter.Body.setAngularVelocity(t.con, SN.Form(t.con.angularVelocity));

        var imp = t.con.positionImpulse;
        var cimp = t.con.constraintImpulse;
        t.con.positionImpulse = { x: SN.Form(imp.x, 2), y: SN.Form(imp.y, 2) };
        t.con.constraintImpulse = {
            x: SN.Form(cimp.x, 2),
            y: SN.Form(cimp.y, 2),
            angle: SN.Form(cimp.angle, 2)
        };

        /*
        if (t.type == 'g_dude') {
            console.log('testing3: ');
            console.log('stufffff: ' + t.con.angle + " " + t.con.angularVelocity + " " +
                t.con.positionImpulse.y + " " + t.con.positionImpulse.x + " " + t.con.constraintImpulse.angle + " " + t.con.position.x + " " + t.con.position.y + " " +
                vel.y + " " + t.con.vertices[0].x + " " + t.con.vertices[0].y);
        }*/
    };

    SetForce(x, y, xpos, ypos) {
        var t = this;
        Matter.Body.applyForce(t.con,
            { x: xpos ? xpos : 0, y: ypos ? ypos : 0 }, { x: x, y: y });
    };

    SetVel(x, y) {
        var t = this;
        Matter.Body.setVelocity(t.con, { x: x, y: y });
        for (var i = 0; i < t.ancParts.length; i++){
            t.ancParts[i].SetVel(x, y);
        }
    };

    Toggle(visible) {
        var t = this;
        if (!G.IsServer) {
            t.parts._each(x=> {
                x.grs._each(g=> {
                    g.visible = visible;
                });
            })

            t.InFrame = visible;
            t.visible = visible;
            for (var i = 0; i < t.ancParts.length; i++)
                t.ancParts[i].Toggle(visible);
        }
    };

    addLink(link) {
        var t = this;
        link = Matter.Constraint.create(link);
        //link.damping = 0.1;
        link.render.strokeStyle = '#ff00ff';
        Matter.Composite.addConstraint(t.comp, link);
        return link;
    };

    PreRender() {
        var t = this;
        var checkInFrame = G.ScreenMoved || t.updated || (!t.main.isStatic && G.Tick % 10 == 0 && G.bounds);

        if (checkInFrame && G.bounds){
            var oldVis = t.InFrame;
            var bounds = t.main.isStatic ? t.con.bounds : { min: t.pos, max: t.pos };
            t.InFrame = G.InBox(bounds, G.bounds, G.bounds.buffer);
            if (oldVis != t.InFrame){
                t.updated = true;
                clearTimeout(t.ttActive);
                t.ttActive = setTimeout(function(){
                    if(t.main.isStatic)
                        t.SetActive(t.InFrame);
                },200);
            }
        }

        t.parts._each(part => {
            var grKeys = Object.keys(part.grs);
            var cos, sin = null;

            if (!t.main.isStatic || t.updated) {
                cos = Math.cos(t.con.angle + part.wa);
                sin = Math.sin(t.con.angle + part.wa);
            }

            for (var k = 0; k < grKeys.length; k++) {
                var gr = part.grs[grKeys[k]];

                if (!t.main.isStatic || t.updated) {
                    gr.rotation = t.con.angle + part.wa + gr.wa;
                    gr.x = part.position.x + (gr.wx * cos - gr.wy * sin);
                    gr.y = part.position.y + (gr.wx * sin + gr.wy * cos);
                }

                G.HandleAnimations(gr, true);
                gr.visible = t.isActive && !gr.hidden;
            }
        });

        t.updated = false;
    };

    CollideStart(myType, objType, obj) {
        var t= this;
        if (t.parentObj)
            t.parentObj.CollideStart(myType, objType, obj);
    };

    CollideEnd(myType, objType, obj) {
        var t = this;
        if (t.parentObj)
            t.parentObj.CollideEnd(myType, objType, obj);
    };

    Tick(delta) {
        var t= this;
        if(t.parentObj){
            var p = t.parentObj;
            t.SetPos(p.pos.x, p.pos.y, p.con.angle);
            t.SetVel(p.vel.x, p.vel.y);
        }
    };

    PostTick(){
        var t = this;
        t.parts._each(part => {
            G.HandleAnimations(part, false);
        });
    };

}
if (typeof exports !== 'undefined')
    module.exports = Gobj;