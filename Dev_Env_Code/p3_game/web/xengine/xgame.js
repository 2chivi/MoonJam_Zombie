//xgame v1.01 : window resize errors
//gravity == 0.285

//G
var G = {};
(function (G) {
    G.IsServer = typeof exports !== 'undefined';
    G.Objs = {};
    G.LObjs_ = [];
    G.HasMatter_ = typeof Matter !== 'undefined';
    G.cycleTimes = [];
    G.cycleAvg = 0;
    G.LastTime_ = Date.now();
    G.StartWidth_ = 1920;
    G.StartHeight_ = 1080;
    G.FRate_ = 100 / 3;
    G.LastPivotPos = {x: 0, y: 0};
    G.PlayerArea = { max: {x: 0, y: 0}, min: {x: 0, y: 0}};
    G.Dudes = [];
    G.Loader_ = PIXI.Loader.shared;

    G.Init_ = function (con, onLoad) {
        G.HasServer = typeof(SN) != 'undefined';
        G.FRate_ = G.IsServer ? SN.FRate_ : G.FRate_;
        G.tickActions_ = [];
        G.InActiveComps = [];
        G.Tick = 0;
        G.con = con;
        G.Width = G.Width ? G.Width : G.StartWidth_;
        G.Height = G.Height ? G.Height : G.StartHeight_;
        G.Color = G.Color ? G.Color : 0x376FD7;

        if (typeof Matter !== 'undefined') {
            G.Bod = Matter.Bodies;
            G.Engine_ = Matter.Engine.create();
            G.Runner_ = Matter.Runner.create();
            G.World_ = G.Engine_.world;
            G.World_.isActive = true;
            G.Events_();
            G.Runner_.isFixed = true;
        }

        if (!G.IsServer) {
            var firstRender = G.Renderer_ == null;
            
            //{ transparent: true} for renderer options  //0x14171d
            if (firstRender){
                G.Renderer_ = new PIXI.Renderer({ 
                    transparent: true, width: G.Width, height: G.Height
                });
            }
            PIXI.Ticker.shared.autoStart = false;
            PIXI.Ticker.shared.stop();
            G.Root_ = new PIXI.Container();
            G.Stage_ = new PIXI.Container();
            G.UI_ = new PIXI.Container();
            G.Root_.addChild(G.Stage_);
            G.Root_.addChild(G.UI_);
            
            G.ParticleContainers = [];
            G.Interaction = new PIXI.interaction.InteractionManager({ root: G.Root_, view: G.Renderer_.view });

            if (firstRender)
                $(con).html(G.Renderer_.view);

            setTimeout(function(){
                $('canvas').trigger('click');
            },50);

        }

        UT.trigger('g_init');
        G.onLoad = onLoad;
        G.PlayReset_();
    };

    G.Events_ = function () {
        Matter.Events.on(G.Engine_, 'collisionStart', function (e) {
            for (var i = 0; i < e.pairs.length; i++) {
                var bodies = [e.pairs[i].bodyA, e.pairs[i].bodyB];
                var ob1 = G.Objs[bodies[0].oid];
                var ob2 = G.Objs[bodies[1].oid];

                if(ob1 && ob2){
                    if (ob1.CollideStart)
                        ob1.CollideStart(bodies[0].type, bodies[1].type, ob2, e.pairs[i]);
                    if (ob2.CollideStart)
                        ob2.CollideStart(bodies[1].type, bodies[0].type, ob1, e.pairs[i]);
                }
            }
        });

        Matter.Events.on(G.Engine_, 'collisionEnd', function (e) {
            for (var i = 0; i < e.pairs.length; i++) {
                var bodies = [e.pairs[i].bodyA, e.pairs[i].bodyB];
                var ob1 = G.Objs[bodies[0].oid];
                var ob2 = G.Objs[bodies[1].oid];

                if(ob1 && ob2){
                    if (ob1.CollideEnd)
                        ob1.CollideEnd(bodies[0].type, bodies[1].type, ob2);
                    if (ob2.CollideEnd)
                        ob2.CollideEnd(bodies[1].type, bodies[0].type, ob1);
                }
            }
        });
    }

    //todo fix this
    G.RemoveObject_ = function (obj) {
        if(obj){
            var stage = obj.stage;

            if(obj.OnRemove)
                obj.OnRemove();
            Matter.Composite.remove(G.World_, obj.comp);

            obj.ancParts._each(p=> {
                G.RemoveObject_(p);
            });

            obj.parts._each(part => {
                part.grs._each(y => {
                    stage.removeChild(y);
                    //if (y.fontSize == undefined){
                        //y.destroy();}
                });
            });
            delete G.Objs[obj.oid];
            var i = G.LObjs_.findIndex(x=> x.oid == obj.oid);
            G.LObjs_.splice(i,1);
        }
    }

    G.InitObj = function (type, oid) {
        if (oid)
            eval('var ob = new ' + type + "('" + oid + "');");
        else
            eval('var ob = new ' + type + "();");
        return ob;
    };

    G.LoadObj = function(obj, state){
        if (state) {
            Object.keys(state)._each(key => {
                obj[key] = state[key];
            });
        }

        obj.Init();
        G.AddObject(obj);
        return obj;
    }
    //LoadObjAndState
    G.InitAndLoad = function(oid, type, state){
        var obj = G.InitObj(type, oid);
        return G.LoadObj(obj, state);
    };

    G.AddObject = function (obj) {
        G.Objs[obj.oid] = obj;
        G.LObjs_.push(obj);

        if(obj.type == 'g_dude')
            G.Dudes = G.Objs._where(x=> x.type == 'g_dude');

        if (obj.stage)
            obj.stage.children = obj.stage.children._orderBy(x => x.zIndex);

        return {
            oid: obj.oid,
            x: obj.x,
            y: obj.y
        }
    };

    G.LoadObjects_ = function (obs) {
        G.Objs = {};
        G.LObjs_ = [];

        for (var i = 0; i < obs.length; i++) {
            var ob = G.InitObj(obs[i].type, obs[i].oid);

            Object.keys(obs[i])._each(x => {
                ob[x] = obs[i][x];
            });

            ob.Init();
            G.AddObject(ob);
        }
        G.LObjs_ = UT.List(G.Objs);
    };

    G.TickFunc_ = function (delta) {
        G.TickInputCheck_();

        if (G.PreTick_)
            G.PreTick_(delta);
        for (var i = 0; i < G.LObjs_.length; i++){
            if (G.LObjs_[i] && G.LObjs_[i].isActive){
                G.LObjs_[i].Tick(delta);
                G.LObjs_[i].PostTick(delta);
            }
        }
        if (G.PostTick_)
            G.PostTick_(delta);
    };

    G.TrackFPS_ = function(){
        if(!G.frames)
            G.frames = 0;
        G.frames++;
        G.Tick++;
        if (G.HasServer && !G.IsServer && CN)
            CN.ServerTick_++;
        if(G.frames % 100 == 0){
            G.frames = 0;
            if(G.fpsTime)
                G.FPS_ = 100 / ((Date.now() - G.fpsTime) / 1000);
            G.fpsTime = Date.now();
        }
    };

    G.PostPhysics_ = function () { };

    G.RenderFunc_ = function () {
        var serverObjs = [];
        if (G.HasServer)
            serverObjs = G.IsServer ? SN.Objs_ : CN.Objs_;

        if(!G.IsServer){
            G.bounds = {
                buffer: 300 / G.Stage_.scale.x,
                min: { x: G.Stage_.pivot.x, y: G.Stage_.pivot.y },
                max: { x: G.Stage_.pivot.x + (G.Width / G.Stage_.scale.x), y: G.Stage_.pivot.y + (G.Height / G.Stage_.scale.x) }
            };

            var dx = G.dist(G.LastPivotPos, G.Stage_.pivot);
            G.ScreenMoved = false;
            if (dx > (G.bounds.buffer * 0.5)) {
                G.ScreenMoved = true;
                G.LastPivotPos = { x: G.Stage_.pivot.x, y: G.Stage_.pivot.y };
            }

            G.ParticleContainers._each(con => {
                for (var i = 0; i < con.children.length; i++) {
                    var p = con.children[i];
                    p.x += p.vel.x;
                    p.y += p.vel.y;
                    if(p.scaleVel){
                        p.scale.x += p.scaleVel.x;
                        p.scale.y += p.scaleVel.y;
                    }
                    if(p.rotVel)
                        p.rotation += p.rotVel;

                    if(p.decay){
                        p.life--;
                        p.alpha = p.life / p.maxLife;
                    }
                    
                    if (p.life <= 0) {
                        con.removeChild(p);
                        p.destroy();
                    }
                }
            });

            for (var i = 0; i < G.LObjs_.length; i++) {
                var ob = G.LObjs_[i];
                ob.PreRender();
            }
        }

        for(var i = 0; i < serverObjs.length; i++){
            var ob = serverObjs[i];
            var old = {
                stick: G.IsServer ? G.Tick : CN.ServerTick_,
                pos: { x: ob.pos.x, y: ob.pos.y },
                vel: { x: ob.vel.x, y: ob.vel.y },
                angle: ob.con.angle
            };
            ob.olds._queue(old, 10);

            if (!G.IsServer && G.HasServer)
                CN.Interpolate_(ob);
        }
    };

    G.Cleanup_ = function(x, y){
        if (G.Engine_) {
            Matter.World.clear(G.World_);
            Matter.Engine.clear(G.Engine_);
        }

        if (!G.IsServer && G.Stage_) {
            if (x) {
                G.Width = x;
                G.Height = y;
                G.Renderer_.resize(x, y);
            }
            G.UI_.removeAllListeners();
            G.UI_.removeChildren();
            G.Stage_.removeAllListeners();
            G.Stage_.removeChildren();

            G.ParticleContainers._each(p=>{
                p.removeChildren();
            });
        }
    };

    G.PlayReset_ = function (x, y) {
        if (!G.World_ && !G.Stage_)
            return;

        G.Cleanup_(x, y);

        if (G.onLoad)
            G.onLoad();

        //SERVER SIDE LOOOOP=======================
        var fpsInt = Math.ceil(G.FRate_);
        G.old60Time = Date.now();
        G.acc_ = 0;
        G.deltaStore_ = 0;

        if (G.IsServer) {
            
            G.Loop_ = function () {
                G.basicLoop_();

                if ((Date.now() - G.old60Time) < (fpsInt - 4))
                    setTimeout(G.Loop_);
                else
                    setImmediate(G.Loop_);

                G.ttime = Date.now();
            };
            G.Loop_();
        } else { //CLIENT SIDE LOOOP------------------

            if (G.AnimationRequest_ != null)
                cancelAnimationFrame(G.AnimationRequest_);

            G.anim = function(){
                var updated = G.basicLoop_();

                if (updated) {
                    PIXI.Ticker.shared.update(Date.now());
                    G.Renderer_.render(G.Root_);
                    UT.trigger('g_post');

                    G.cycleTimes._queue(Date.now() - updated, 15);
                    G.cycleAvg = 0;
                    G.cycleTimes._each(x => { G.cycleAvg += x });
                    G.cycleAvg = G.cycleAvg / G.cycleTimes.length;
                }

                G.AnimationRequest_ = requestAnimationFrame(G.anim);
            }
            G.anim();

        }
    };

    G.basicLoop_ = function (time){
        var time = Date.now();
        var update = false;
        G.deltaStore_ += (time - G.old60Time);
        G.acc_ += (time - G.old60Time);
        G.old60Time = time;

        if (G.acc_ >= G.FRate_) {
            update = time;
            UT.trigger('g_tick');
            G.TickFunc_(G.deltaStore_ / G.FRate_);
            G.deltaStore_ = 0;

            if (G.HasMatter_)
                Matter.Runner.tick(G.Runner_, G.Engine_, G.FRate_);

            G.PostPhysics_();
            G.RenderFunc_(); //interpolation ?? vel changes
            G.TrackFPS_();
            G.LastTime_ = Date.now();
            G.acc_ = G.acc_ - G.FRate_;

            if (Math.abs(G.acc_) >= G.FRate_*20){
                UT.trigger('g_accum');
                G.acc_ = 0;
            }
        }

        return update;
    };


    G.HandleAnimations = function(x, isGraphic){
        if(x.animate){
            if (!x.astarted && x.animate.active){
                x.astarted = true;
                x.aTime = G.Tick;
            }

            if (!x.animate.active)
                x.aTime = G.Tick;

            //done
            if (x.astarted && G.Tween(x, isGraphic)){
                var dfunc = x.animate.done;                   

                if(!x.animate.repeat){
                    x.animate.active = false;
    
                    x.astarted = false;
                }
                else if(x.animate.repeat){
                    x.astarted = true;
                    x.aTime = G.Tick;
                    G.Tween(x, isGraphic); // needed for perfrect sync
                }

                if (dfunc) dfunc();
            }

            if(!x.animate.active){
                x.astarted = false;
            }
        }
    };

    G.Tween = function (part, isGraph) {
        var period = part.animate.period;
        var states = part.animate.states;
        if (period == Infinity || period == null)
            return false;
        var tick = G.Tick - part.aTime;

        G.TweenMove(part, isGraph, G.TweenStep(states, period, tick));
        return (G.Tick - part.aTime) >= period; // tick == (period - 1);
    };

    G.TweenStep = function(states, period, tick){
        var pct = tick / period;
        var key = Math.floor((states.length - 1) * pct);
        var state = states[key];
        var nstate = states[(key + 1) % (states.length)];
        var speriod = (period / (states.length - 1));
        var statePct = (tick - (speriod*key)) / speriod;

        return {
            x: state[0] != null ? state[0] + ((nstate[0] - state[0]) * statePct) : null,
            y: state[1] != null ? state[1] + ((nstate[1] - state[1]) * statePct) : null,
            ang: state[2] + ((nstate[2] - state[2]) * statePct)
        };
    };

    G.TweenMove = function (part, isGraphic, step) {
        var x = step.x;
        var y = step.y;
        var angle = step.ang;

        if(isGraphic){
            if (!isNaN(x) && x != null) {
                part.wx = x;
                part.wy = y;
            }
            part.wa = angle != null ? angle : part.wa;
        }else{
            if (!isNaN(x) && x != null){
                var newX = x;
                var newY = y;
                Matter.Body.setPosition(part, G.v(newX, newY));
            }
            if (angle != null){
                Matter.Body.setAngle(part, angle);
            }
        }
        return part;
    };

    G.TweenTo = function(part, isGr, period, to){
        part.astarted = false;
        var states = [];
        states.push([part.wx, part.wy, part.wa], to);
        part.animate = { states, period };
    };

    G.TickFunc = function(tick, func){
        G.tickActions_.push({tick, key: null, val: null, func});
    };

    G.TickAction = function(oid, tick, key, val, func){
        G.tickActions_.push({
            tick, key, val, oid, func
        });
    };

    G.TickInputCheck_ = function(){
        for (var i = G.tickActions_.length-1; i >= 0; i--) {
            var ta = G.tickActions_[i];
            if (G.Tick >= ta.tick) {
                if (ta.key && ta.oid && G.Objs[ta.oid])
                    G.Objs[ta.oid][ta.key] = ta.val;
                if(ta.func) 
                    ta.func(ta.oid != null ? G.Objs[ta.oid] : null, ta.key, ta.val);
                G.tickActions_.splice(i, 1);
            }
        }
    };

    G.apply = function(newObj, old){
        Object.keys(newObj)._each(k=>{
            old[k] = newObj[k];
        });
    };

    //generic = 0, terrain = 1, dude = 2, serverTerr = 14, delayTerr = 15
    G.cats = [0x0001, 0x0002, 0x0004, 0x0008, 0x0010, 0x0020, 
        0x0040, 0x0080, 0x0100, 0x0200, 0x0400, 0x0800, 0x1000, 0x2000, 0x4000, 0x8000];

    G.Default = {
        color: 0x000000,
        lineColor: 0x000000,
        alignment: 1, //  (0.5 = middle, 1 = outer, 0 = inner).
        zIndex: 0
    };

    G.filterTex = function (filter, pad, gr, ops = {}) {
        filter.padding = pad * 2;
        gr.filters = [filter];
        gr.pivot.set(0, 0);
        return G.Renderer_.generateTexture(gr, null, null,
            new PIXI.Rectangle(-pad, -pad, gr.width + (pad * 4), gr.height + (pad * 4)));
    }

    //pre-renders filter for performance
    G.filter = function (filter, pad, gr, ops = {}){
        var filterTex = G.filterTex(filter, pad, gr, ops);
        gr = new PIXI.Sprite();

        gr.texture = filterTex;
        G.apply(ops, gr);
        gr.pivot.set(gr.width / 2, gr.height / 2);
        return gr;
    }

    G.texture = function(gr, texture, ops = {}){
        if (G.IsServer) return null;
        if (!gr) { gr = new PIXI.Sprite(); G.apply(G.Default, gr); }
        G.apply(ops, gr);
        if(ops.size)
            gr.scale.set(gr.size, gr.size);
        
        gr.texture = texture;

        if(gr.offx)
            gr.pivot.set(gr.offx, gr.offy);
        else
            gr.pivot.set(gr.texture.width / 2, gr.texture.height / 2);
        return gr;
    };

    G.circle = function(gr, radius, ops){
        if (G.IsServer) return null;
        if (!gr) { gr = new PIXI.Graphics(); G.apply(G.Default, gr); }
        G.apply(ops, gr);

        gr.clear();
        if (gr.texture)
            gr.beginTextureFill(gr.texture)
        else
            gr.beginFill(gr.color, gr.opacity);
        gr.lineStyle(gr.lineWidth, gr.lineColor, gr.lineOpacity, gr.alignment);
        gr.drawCircle(0, 0, radius);
        gr.endFill();
        //gr.pivot.set(gr.offx, gr.offy);
        gr.filters = gr.filter ? [gr.filter] : null;
        return gr;
    };

    G.poly = function(gr, points, ops){
        if (G.IsServer) return null;
        if (!gr) { gr = new PIXI.Graphics(); G.apply(G.Default, gr); }
        G.apply(ops, gr);

        gr.clear();
        if (gr.texture)
            gr.beginTextureFill(gr.texture)
        else
            gr.beginFill(gr.color, gr.opacity);
        gr.lineStyle(gr.lineWidth, gr.lineColor, gr.lineOpacity, gr.alignment);
        gr.drawPolygon(points)
        gr.endFill();
        gr.filters = gr.filter ? [gr.filter] : null;

        if (gr.offx == null){
            var cen = G.center(points);
            gr.offx = cen.x;
            gr.offy = cen.y;
        }

        gr.pivot.set(gr.offx, gr.offy);
        return gr;
    };

    G.rect = function (gr, w, h, rad, ops) {
        if (G.IsServer) return null;
        if (!gr) { gr = new PIXI.Graphics(); G.apply(G.Default, gr); }
        gr.clear();
        G.apply(ops, gr);
        
        if(gr.texture)
            gr.beginTextureFill(gr.texture)
        else
            gr.beginFill(gr.color, gr.opacity);
        gr.lineStyle(gr.lineWidth, gr.lineColor, gr.lineOpacity, gr.alignment);
        if(rad != null)
            gr.drawRoundedRect(0,0,w,h,rad);
        else
            gr.drawRect(0, 0, w, h);
        gr.endFill();
        
        gr.pivot.set(gr.width / 2, gr.height / 2);
        gr.filters = gr.filter ? [gr.filter] : null;
        return gr;
    };


    G.line = function (gr, x, y, x2, y2, ops) {
        if (G.IsServer) return null;
        if(!gr){ gr = new PIXI.Graphics(); G.apply(G.Default, gr); }
        G.apply(ops, gr);
        ops.lineWidth = ops.lineWidth == 0 ? 2 : ops.lineWidth;

        gr.clear();
        gr.lineStyle(gr.lineWidth, gr.color, gr.opacity);
        gr.moveTo(x, y);
        gr.lineTo(x2, y2);
        return gr;
    };

    G.curve = function (gr, p1, p2, p3, color = '#000D11') {
        if (G.IsServer) return null;
        var gr = !gr ? new PIXI.Graphics() : gr;
        gr.clear();
        gr.lineStyle(2, color, 0.5);
        gr.moveTo(p1.x, p1.y);
        gr.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
        return gr;
    };

    G.text = function(gr, text, anchor, ops = {}){
        if (G.IsServer) return null;
        var isNew = !gr;
        
        var txtDef = {
            fontFamily: 'Arial',
            fontSize: 14,
            lineJoin: 'round',
            align: 'center',
            strokeThickness: 1,
        };
        if (isNew) G.apply(G.Default, txtDef);
        G.apply(ops, txtDef);

        var gr = isNew ? new PIXI.Text('sdf', txtDef) : gr;

        G.apply(ops, gr);
        gr.text = text;
        gr.anchor = anchor ? anchor : {x: 0.5, y: 0.5};
        gr.resolution = 2;
        return gr;
    };

    G.particle = function(gr, ops){
        var part = {};
        part.con = new PIXI.ParticleContainer(2000, {scale: true, alpha: true, rotation: true});
        part.texture = G.Renderer_.generateTexture(gr);
        part.x = ops.x;
        part.y = ops.y;
        part.decay = ops.decay ? ops.decay : true;
        part.life = ops.life ? ops.life : 15;
        part.maxLife = part.life;
        part.maxAlpha = part.alpha;
        part.vel = ops.vel ? ops.vel : {x: 0, y: 0};
        part.con.zIndex = ops.zIndex;

        G.Stage_.addChild(part.con);
        G.ParticleContainers.push(part.con);

        G.Stage_.children = G.Stage_.children._orderBy(x => x.zIndex);
        return part;
    };

    G.spawnParticle = function(gr, ops){
        if (gr.particle == null){
            gr.particle = G.particle(gr, ops);
        }

        var grPart = new PIXI.Sprite();
        G.apply(gr.particle, grPart);
        G.apply(ops, grPart);
        grPart.x = ops.pos.x;
        grPart.y = ops.pos.y;
        
        if(!grPart.anchor)
            grPart.anchor = { x: 0.25, y: 0.25 };
        gr.particle.con.addChild(grPart);
        return grPart;
    };

    G._sprite = function (src, offx, offy, scale) {
        if (G.IsServer) return null;
        var sprite = PIXI.Sprite.fromImage(src);
        sprite.scale.set(scale, scale);
        sprite.anchor.set(offx, offy);
        sprite.interactive = true;
        return sprite;
    };

    G.playAudio = function(audio, volume){
        if(!G.IsServer){
            if(!audio.loading){
                audio.loading = true;
                audio.pause();
                audio.volume = volume;
                audio.currentTime = 0;
                audio.prom = audio.play();
                
                audio.prom.then(_ => {
                    audio.loading = false;
                });
            }
        }
    };

    //Helper Functions-------------------------------------------------------

    G.Graphic = function(bod, props= {}){
        if(bod.label == 'Rectangle Body'){
            var w = bod.bounds.max.x - bod.bounds.min.x;
            var h = bod.bounds.max.y - bod.bounds.min.y;
            return G.rect(null, w, h, 3, props);
        }
        if(bod.label == 'Circle Body')
            return G.circle(null, bod.circleRadius, props);
    };

    //no duplicate verts
    G.SafeVerts = function(verts){
        verts = Matter.Vertices.fromPath(verts.toString());

        verts = verts.filter((v, ind, self)=> 
            ind == self.findIndex(s=> ~~s.x == ~~v.x && ~~s.y == ~~v.y));
        return verts;
    };

    G.TextureMatter = function(texture, totalVerts = 10, props = {}){
        var verts = G.Outline(texture, totalVerts);
        return G.Bod.fromVertices(0,0, verts, props)
    };

    //vertices around texture
    G.Outline = function(texture, totalVerts = 10) {
        var width = texture.width;
        //var off = {x: texture.width/2, y: texture.height/2};
        var pix = G.Renderer_.plugins.extract.pixels(texture);
        var verts = geom.contour(function (x, y) {
            return (pix[(y * width + x) * 4 + 3]) > 20;
        });

        var subVerts = [];
        var all = [];
        var eo = Math.min(pix.length, totalVerts) / 20;

        for (var i = 0; i < verts.length; i += eo) {
            subVerts.push({x: verts[i][0], y: verts[i][1]});
            all.push(verts[i][0], verts[i][1]);
        }

        return subVerts;
    },

    G.InBox = function(obj, box, buffer){
        return box != null && 
            obj.min.x < (box.max.x + buffer) &&
            obj.max.x > (box.min.x - buffer) &&
            obj.max.y > (box.min.y - buffer) &&
            obj.min.y < (box.max.y + buffer);
    }

    G.center = function(points){
        var t = this;
        var vectors = [];

        for (var i = 0; i < points.length - 1; i += 2)
            vectors.push({ x: points[i], y: points[i + 1] });

        return Matter.Vertices.centre(vectors);
    }

    G.v = function (x, y) {
        return { x: x, y: y };
    }

    G.vsub = function (x, y) {
        return Matter.Vector.sub(x, y);
    }

    G.vdot = function(v1, v2){
        return v1.x*v2.x + v1.y*v2.y;
    }

    G.vmult = function (x, y, mult) {
        if (isNaN(x)) { mult = y; y = x.y; x = x.x; }
        return Matter.Vector.mult({ x: x, y: y }, mult);
    }

    G.vnorm = function (x, y) {
        if (isNaN(x)) { y = x.y; x = x.x; }
        return Matter.Vector.normalise({ x: x, y: y });
    }

    G.mag = function(x, y){
        if (isNaN(x)) { y = x.y; x = x.x; }
        return Math.sqrt(x*x + y*y);
    }

    // line intercept math by Paul Bourke http://paulbourke.net/geometry/pointlineplane/
    G.intercept = function (x1, y1, x2, y2, x3, y3, x4, y4, ignoreLength = false){
        if ((x1 === x2 && y1 === y2) || (x3 === x4 && y3 === y4))
            return false

        denominator = ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1))

        if (denominator === 0)
            return false

        let ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator
        let ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator

        if(!ignoreLength){
            if (ua < 0 || ua > 1 || ub < 0 || ub > 1)
                return false
        }

        let x = x1 + ua * (x2 - x1)
        let y = y1 + ua * (y2 - y1)

        return { x, y }
    };

    G.dist = function (v1, v2) {
        return Math.sqrt(((v2.x - v1.x) * (v2.x - v1.x)) + ((v2.y - v1.y) * (v2.y - v1.y)));
    };

    G.UID_ = function () {
        var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var uid = "";
        for (var i = 0; i < 3; i++)
            uid += chars[Math.floor(Math.random() * chars.length)];
        return uid;
    };

}(typeof exports === 'undefined' ? G : exports));




