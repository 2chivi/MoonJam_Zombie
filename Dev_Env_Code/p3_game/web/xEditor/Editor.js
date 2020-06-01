
class Editor extends React.Component {

    constructor() {
        super();
        var t = this;
        t.state = {};
        t.Lines = [];
        t.Points = [];
        t.removals = [];
        t.state.drawing = false;
        t.rd = 20;
        t.totalObjs = 0;


        $(window).on('mouseup', function (e) {
            if (t.state.drawing && e.target.nodeName == 'CANVAS'){
                t.clicked = true;
                var pnt = { x: Math.ceil(CG.mx / t.rd) * t.rd, y: Math.ceil(CG.my / t.rd) * t.rd };
                t.Points.push(pnt);

                console.log('test2');
                var line = G.line(null, pnt.x, pnt.y, pnt.x, pnt.y, { color: 0xffffff, lineWidth: 6 });
                G.Stage_.addChild(line);
                
                t.Lines.push(line);
            }
        });

        UT.on('g_init', 'editor', function(){
            t.PopulateDropDowns();
            t.PopulateFields();
            t.forceUpdate();

            //problem is that I'm doing this after creating the world
            CG.matterRender = Matter.Render.create({
                element: $(G.con)[0],
                engine: G.Engine_,
                bounds: {
                    min: { x: 0, y: 0 },
                    max: { x: G.Width / CG.Scale.x, y: G.Height / CG.Scale.x }
                },
                options: {
                    width: G.Width,
                    height: G.Height,

                    showAxes: true,
                    background: 'transparent',
                    wireframeBackground: 'transparent',
                    hasBounds: true
                }
            });
                

            $(CG.matterRender.canvas).css('position', 'absolute');
            $(CG.matterRender.canvas).css('top', '0');
            $(CG.matterRender.canvas).css('left', '0');
            $(CG.matterRender.canvas).prev().css('opacity', 1);

            Matter.Render.run(CG.matterRender);
        });


        t.ttLoop2 = setInterval(function () {
            if (G.LObjs_.length != t.totalObjs){
                t.totalObjs = G.LObjs_.length;
                t.PopulateDropDowns();
                t.forceUpdate();
            }
        }, 2000);

        t.ttLoop = setInterval(function(){
            if (t.state.drawing){
                var line = t.Lines[t.Lines.length - 1];
                var opnt = t.Points[t.Points.length - 1];
                var pnt = { x: Math.ceil(CG.mx / t.rd) * t.rd, y: Math.ceil(CG.my / t.rd) * t.rd };
                if (line) {
                    line = G.line(line, opnt.x, opnt.y, pnt.x, pnt.y, { });
                }
                if(t.mark){
                    t.mark.x = pnt.x;
                    t.mark.y = pnt.y;
                }
            }

            if(CG.cam && CG.matterRender){
                var test = G.Stage_.pivot;
                Matter.Bounds.shift(CG.matterRender.bounds, test);
            }
        },50);
    }

    PopulateDropDowns(){
        var t = this;
        var pobjs = UT.List(G.Objs._where(x => !x.IsAncPart));
        t.refs.ddObjs.setState({ data: pobjs });

        var pobj = t.refs.ddObjs.state.val;

        if(pobj){
            var cobjs = pobj.parts.concat(pobj.ancParts);
            cobjs = [{type: '-'}].concat(cobjs);
            t.refs.ddSubs.setState({ data: cobjs });
            var c = t.refs.ddSubs.state.val;
            if(c && c.type != '-' && c.type != 'con'){
                var cdata = c.IsAncPart ? UT.List(c.con.grs) : UT.List(c.grs);
                cdata = [{type: '-'}].concat(cdata);
                t.refs.ddGraphs.setState({  data: cdata });
            }
        }
    }

    PopulateFields(){
        var t = this;
        var p = t.refs.ddObjs.state.val;
        var c = t.refs.ddSubs.state.val;
        var g = t.refs.ddGraphs.state.val;
        var px, py, pa = 0;
        t.parent = p;
        t.target = p;
        t.targType = 'con';
        var hasChild = c && c.type != '-' && c.type != 'con' && p.main.id != c.id;

        if(!t.target) return;

        if (hasChild) {
            t.target = c;
            t.targType = c.IsAncPart ? 'ancPart' : 'part';
        }

        if (g && g.type != '-') {
            t.target = g;
            t.targType = 'graphic';
        }

        if (t.targType == 'con') {
            px = t.target.pos.x;
            py = t.target.pos.y;
            pa = t.target.con.angle;
        }
        if (t.targType == 'part' || t.targType == 'graphic') {
            px = t.target.wx;
            py = t.target.wy;
            pa = t.target.wa;
        }
        if (t.targType == 'ancPart') {
            px = t.target.ancX;
            py = t.target.ancY;
            pa = 0;
        }
        t.setState({ px, py, pa });
    }

    Zoom(dir){
        G.Stage_.scale = { x: G.Stage_.scale.x *= dir, y: G.Stage_.scale.y *= dir };
    }

    Draw(){
        var t = this;

        if(!t.mark){
            t.mark = G.circle(null, 5, { lineWidth:2, lineColor: 0xffffff });
            G.Stage_.addChild(t.mark);
        }

        if(t.state.drawing){
            var ss = [];
            t.Points._each(p => { ss.push(p.x); ss.push(p.y); })
            console.log(ss);
        }

        t.removals = t.removals.concat(t.Lines.slice());
        t.Lines = [];
        t.Points = [];

        setTimeout(function(){
            t.removals._each(x => {
                G.Stage_.removeChild(x);
            });
            t.removals = [];
        },2000);
        
        t.setState({ drawing: !t.state.drawing });
    }

    PickedObj(obj, isParent){
        var t = this;
        t.PopulateDropDowns();
        setTimeout(function(){
            t.PopulateFields();
        },50);

        /*
        if (isParent){
            var data = obj.parts.concat(obj.ancParts);
            t.refs.ddSubs.setState({ val: null, data });
        }else{
            var c = t.refs.ddSubs.state.val;
            if(c.IsAncPart)
                t.refs.ddGraphs.setState({ val: null, data: UT.List(c.con.grs) });
            else
                t.refs.ddGraphs.setState({ val: null, data: UT.List(c.grs) });
        }*/
    }

    Move(mx, my, ma, to = 1){
        var t = this;

        clearTimeout(t.ttMove);
        t.ttMove = setTimeout(function(){
            mx = Number(mx);
            my = Number(my);
            ma = Number(ma);
            console.log(mx);

            if(t.targType == 'con'){
                t.target.SetPos(mx, my, ma);
            }

            if(t.targType == 'part'){
                t.target.wx = mx;
                t.target.wy = my;
                t.target.wa = ma;

                var cos = Math.cos(t.parent.main.angle);
                var sin = Math.sin(t.parent.main.angle);

                Matter.Body.setPosition(t.target, { 
                    x: t.parent.main.position.x + (mx * cos - my * sin), 
                    y: t.parent.main.position.y + (mx * sin + my * cos)
                });
                Matter.Body.setAngle(t.target, ma + t.parent.main.angle);
            }

            if(t.targType == 'ancPart'){
                t.target.ancX = mx;
                t.target.ancY = my;
                t.target.ancA = ma;
            }

            if(t.targType == 'graphic'){
                t.target.wx = mx;
                t.target.wy = my;
                t.target.wa = ma;
            }
        }, to);
        
        t.setState({ px: mx, py: my, pa: ma});
    }

    render() {
        var t = this;
        var drawName = t.state.drawing ? 'Stop Draw' : 'Draw';
        t.obj = t.refs.ddObjs ? t.refs.ddObjs.state.val : null;

        return <div className='Editor'>

            <div class='btn' onClick={()=> { t.Zoom(1.2) }}>Z-In</div>
            <div class='btn' onClick={() => { t.Zoom(0.8) }}>Z-Out</div>
            <div class='btn' onClick={() => { t.Draw(); }}>{drawName}</div>
            <DD ref='ddObjs' valueType='oid' nameType='type'
                onChange={(v, e) => { t.PickedObj(v, true);}} />
            <DD ref='ddSubs' valueType='type' nameType='type'
                onChange={(v, e) => { t.PickedObj(v, false); }} />
            <DD ref='ddGraphs' valueType='type' nameType='type'
                onChange={(v, e) => { t.PickedObj(v, false); }} />

            <div class='btn' onClick={() => { t.Move(t.state.px - 5, t.state.py, t.state.pa); }}>left</div>
            <div class='btn' onClick={() => { t.Move(t.state.px + 5, t.state.py, t.state.pa); }}>right</div>
            <input value={t.state.px} 
                onChange={(e) => { t.Move($(e.target).val(), t.state.py, t.state.pa, 1000) }} />

            <div class='btn' onClick={() => { t.Move(t.state.px, t.state.py - 5, t.state.pa); }}>up</div>
            <div class='btn' onClick={() => { t.Move(t.state.px, t.state.py + 5, t.state.pa); }}>down</div>
            <input value={t.state.py}
                onChange={(e) => { t.state.px, t.Move($(e.target).val(), t.state.pa, 1000) }} />

            <div class='btn' onClick={() => { t.Move(t.state.px, t.state.py, t.state.pa-0.1); }}>angL</div>
            <div class='btn' onClick={() => { t.Move(t.state.px, t.state.py, t.state.pa + 0.1); }}>angR</div>
            <input value={t.state.pa}
                onChange={(e) => { t.Move(t.state.px, t.state.py, t.state.pa, 1000) }} />
        </div>
    }
}