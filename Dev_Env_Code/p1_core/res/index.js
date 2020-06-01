IsServer = typeof exports !== 'undefined';

class API {
    constructor(port, reconnect = true, serverLoc) {
        var t = this;
        t.reconnect = reconnect;
        t.Unique = 0;
        t.DoneFuncs = {};
        
        if(serverLoc)
            t.ServerLoc = serverLoc;
        else{
            if (IsServer || window.location.hostname == 'localhost')
                t.ServerLoc = 'http://localhost:' + port;
            else
                t.ServerLoc = ServerLoc + '?port=' + port;
        }
        t.Init();
    }

    Init() {
        var t = this;

        t.Sock = io(t.ServerLoc, { reconnectionDelayMax: 10000, reconnection: t.reconnect });
        t.Sock.on('any', function (key, args) {
            var func = t.DoneFuncs[key];
            if (func) {
                t.DoneFuncs[key](args);
                delete t.DoneFuncs[key];
            }else{
                console.log(key);
                console.log(t.DoneFuncs);
                console.log('API Sock Failure?')
            }
        });
    }

    Call(method, args, done) {
        var t = this;
        var key = t.Unique;
        t.Unique++;

        if (done)
            t.DoneFuncs[key] = done;

        t.Sock.emit('any', method, key, args);
    }
};
if (IsServer) module.exports = API;//LINQ 1.3 : Fix inherit != null

var UT = {};
(function (exp) {
    var t = exp;
    t.Events = {};

    t.PushUnique = function (newObject, array) {
        for (var h = 0; h < array.length; h++) {
            if (newObject._id == array[h]._id)
                array.splice(h, 1);
        }
        array.push(newObject);
    };

    t.Dict = function (array) {
        var dict = {};
        for (var i = 0; i < array.length; i++)
            dict[array[i]._id] = array[i];
        return dict;
    };

    t.List = function (obj) {
        if (!obj) return null;
        return Object.keys(obj).map(function (key) {
            return obj[key];
        });
    };

    t.Extensions = function () {
        //LINQ pseudo.. pick == select
        Array.prototype._select = function (func) {
            return t.Select(this, func);
        };
        Array.prototype._each = function (func) {
            return t.Select(this, func);
        };
        Array.prototype._orderBy = function () {
            return t.OrderBy(this, arguments);
        };
        Array.prototype._max = function (func) {
            return t.Max(this, func, true);
        };
        Array.prototype._min = function (func) {
            return t.Max(this, func, false);
        };
        Array.prototype._avg = function () {
            var sum = 0;
            this._each(x=> { sum += x });
            return sum / this.length;
        };
        Array.prototype._mode = function () {
            var max = '';
            var maxi = 0;
            var b = {};
            for (let k of this) {
                if (b[k]) b[k]++; else b[k] = 1;
                if (maxi < b[k]) { max = k; maxi = b[k] }
            }
            return max;
        };
        Array.prototype._where = function (func) {
            return t.Where(this, func);
        };
        Array.prototype._any = function (func) {
            return t.Where(this, func).length > 0;
        };
        Array.prototype._first = function (func) {
            return t.First(this, func);
        };
        Array.prototype._queue = function(item, maxLength){
            this.push(item);
            if (this.length > maxLength)
                this.shift();
        };
        Object.defineProperty(Object.prototype, "_each", {
            value: function (func) { return t.Select(t.List(this), func); },
            enumerable: false, writable: true
        });
        Object.defineProperty(Object.prototype, "_where", {
            value: function (func) { return t.Where(t.List(this), func); },
            enumerable: false, writable: true
        });
        Object.defineProperty(Object.prototype, "_any", {
            value: function (func) { return (t.Where(t.List(this), func).length > 0); },
            enumerable: false, writable: true
        });
        Object.defineProperty(Object.prototype, "_first", {
            value: function (func) { return t.First(t.List(this), func); },
            enumerable: false, writable: true
        });
        Object.defineProperty(Object.prototype, "_orderBy", {
            value: function (func) { return t.OrderBy(t.List(this), arguments); },
            enumerable: false, writable: true
        });
    };

    if (typeof $ != 'undefined') {
        $.prototype._select = function (func) {
            return t.Select(this, func);
        };
        $.prototype._onoff = function (e1, e2, e3) {
            if (e3)
                $(this).off(e1, e2).on(e1, e2, e3);
            else
                $(this).off(e1).on(e1, e2);
            return $(this);
        };
    }

    t.Select = function (objs, func) {
        var filtered = [];
        for (var i = 0; i < objs.length; i++)
            filtered.push(func(objs[i]));
        return filtered;
    };

    t.First = function (objs, func) {
        if (func)
            objs = t.Where(objs, func);
        if (objs.length > 0)
            return objs[0];
        return null;
    };

    t.Max = function(objs, func, isMax){
        var max = null;
        var maxObj = null;
        for(var i = 0; i < objs.length; i++){
            if (max == null || (isMax ? (func(objs[i]) > max) : (func(objs[i]) < max))){
                max = func(objs[i]);
                maxObj = objs[i];
            }
        }
        return maxObj;
    };

    t.OrderBy = function (objs, args) {
        var orderedList = objs;
        orderedList.sort(function (a, b) {
            for (var i = 0; i < args.length; i++) {
                var arg = args[i];
                var a1 = (arg(a) ? arg(a) : null);
                var a2 = (arg(b) ? arg(b) : null);
                if (a1 != a2)
                    return a1 - a2;
            }
        });
        return orderedList;
    };

    t.Where = function (objs, func) {
        var filtered = [];
        for (var i = 0; i < objs.length; i++) {
            if (!func || func(objs[i]))
                filtered.push(objs[i]);
        }
        return filtered;
    };

    t.on = function (ev, uid, done) {
        var evt = {};
        evt.ev = ev;
        evt.done = done;
        t.Events[ev + uid] = evt;
    };

    t.trigger = function (ev, stuff) {
        t.Events._each(e => {
            if (e.ev == ev) {
                e.done(stuff);
            }
        });
    };

}(typeof exports === 'undefined' ? UT : exports));

//UTIL v1.0

//#region Control Creation
var UX = {



};
//#endregion
/* ======== No Steal Code (>.>) Twelve47Kevin@gmail.com ======== */ 
"use strict";/* ======== No Steal Code (>.>) Twelve47Kevin@gmail.com ======== */ 
"use strict";

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var Editor =
/*#__PURE__*/
function (_React$Component) {
  _inherits(Editor, _React$Component);

  function Editor() {
    var _this;

    _classCallCheck(this, Editor);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(Editor).call(this));

    var t = _assertThisInitialized(_this);

    t.state = {};
    t.Lines = [];
    t.Points = [];
    t.removals = [];
    t.state.drawing = false;
    t.rd = 20;
    t.totalObjs = 0;
    $(window).on('mouseup', function (e) {
      if (t.state.drawing && e.target.nodeName == 'CANVAS') {
        t.clicked = true;
        var pnt = {
          x: Math.ceil(CG.mx / t.rd) * t.rd,
          y: Math.ceil(CG.my / t.rd) * t.rd
        };
        t.Points.push(pnt);
        console.log('test2');
        var line = G.line(null, pnt.x, pnt.y, pnt.x, pnt.y, {
          color: 0xffffff,
          lineWidth: 6
        });
        G.Stage_.addChild(line);
        t.Lines.push(line);
      }
    });
    UT.on('g_init', 'editor', function () {
      t.PopulateDropDowns();
      t.PopulateFields();
      t.forceUpdate(); //problem is that I'm doing this after creating the world

      CG.matterRender = Matter.Render.create({
        element: $(G.con)[0],
        engine: G.Engine_,
        bounds: {
          min: {
            x: 0,
            y: 0
          },
          max: {
            x: G.Width / CG.Scale.x,
            y: G.Height / CG.Scale.x
          }
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
      if (G.LObjs_.length != t.totalObjs) {
        t.totalObjs = G.LObjs_.length;
        t.PopulateDropDowns();
        t.forceUpdate();
      }
    }, 2000);
    t.ttLoop = setInterval(function () {
      if (t.state.drawing) {
        var line = t.Lines[t.Lines.length - 1];
        var opnt = t.Points[t.Points.length - 1];
        var pnt = {
          x: Math.ceil(CG.mx / t.rd) * t.rd,
          y: Math.ceil(CG.my / t.rd) * t.rd
        };

        if (line) {
          line = G.line(line, opnt.x, opnt.y, pnt.x, pnt.y, {});
        }

        if (t.mark) {
          t.mark.x = pnt.x;
          t.mark.y = pnt.y;
        }
      }

      if (CG.cam && CG.matterRender) {
        var test = G.Stage_.pivot;
        Matter.Bounds.shift(CG.matterRender.bounds, test);
      }
    }, 50);
    return _this;
  }

  _createClass(Editor, [{
    key: "PopulateDropDowns",
    value: function PopulateDropDowns() {
      var t = this;
      var pobjs = UT.List(G.Objs._where(function (x) {
        return !x.IsAncPart;
      }));
      t.refs.ddObjs.setState({
        data: pobjs
      });
      var pobj = t.refs.ddObjs.state.val;

      if (pobj) {
        var cobjs = pobj.parts.concat(pobj.ancParts);
        cobjs = [{
          type: '-'
        }].concat(cobjs);
        t.refs.ddSubs.setState({
          data: cobjs
        });
        var c = t.refs.ddSubs.state.val;

        if (c && c.type != '-' && c.type != 'con') {
          var cdata = c.IsAncPart ? UT.List(c.con.grs) : UT.List(c.grs);
          cdata = [{
            type: '-'
          }].concat(cdata);
          t.refs.ddGraphs.setState({
            data: cdata
          });
        }
      }
    }
  }, {
    key: "PopulateFields",
    value: function PopulateFields() {
      var t = this;
      var p = t.refs.ddObjs.state.val;
      var c = t.refs.ddSubs.state.val;
      var g = t.refs.ddGraphs.state.val;
      var px,
          py,
          pa = 0;
      t.parent = p;
      t.target = p;
      t.targType = 'con';
      var hasChild = c && c.type != '-' && c.type != 'con' && p.main.id != c.id;
      if (!t.target) return;

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

      t.setState({
        px: px,
        py: py,
        pa: pa
      });
    }
  }, {
    key: "Zoom",
    value: function Zoom(dir) {
      G.Stage_.scale = {
        x: G.Stage_.scale.x *= dir,
        y: G.Stage_.scale.y *= dir
      };
    }
  }, {
    key: "Draw",
    value: function Draw() {
      var t = this;

      if (!t.mark) {
        t.mark = G.circle(null, 5, {
          lineWidth: 2,
          lineColor: 0xffffff
        });
        G.Stage_.addChild(t.mark);
      }

      if (t.state.drawing) {
        var ss = [];

        t.Points._each(function (p) {
          ss.push(p.x);
          ss.push(p.y);
        });

        console.log(ss);
      }

      t.removals = t.removals.concat(t.Lines.slice());
      t.Lines = [];
      t.Points = [];
      setTimeout(function () {
        t.removals._each(function (x) {
          G.Stage_.removeChild(x);
        });

        t.removals = [];
      }, 2000);
      t.setState({
        drawing: !t.state.drawing
      });
    }
  }, {
    key: "PickedObj",
    value: function PickedObj(obj, isParent) {
      var t = this;
      t.PopulateDropDowns();
      setTimeout(function () {
        t.PopulateFields();
      }, 50);
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
  }, {
    key: "Move",
    value: function Move(mx, my, ma) {
      var to = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 1;
      var t = this;
      clearTimeout(t.ttMove);
      t.ttMove = setTimeout(function () {
        mx = Number(mx);
        my = Number(my);
        ma = Number(ma);
        console.log(mx);

        if (t.targType == 'con') {
          t.target.SetPos(mx, my, ma);
        }

        if (t.targType == 'part') {
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

        if (t.targType == 'ancPart') {
          t.target.ancX = mx;
          t.target.ancY = my;
          t.target.ancA = ma;
        }

        if (t.targType == 'graphic') {
          t.target.wx = mx;
          t.target.wy = my;
          t.target.wa = ma;
        }
      }, to);
      t.setState({
        px: mx,
        py: my,
        pa: ma
      });
    }
  }, {
    key: "render",
    value: function render() {
      var t = this;
      var drawName = t.state.drawing ? 'Stop Draw' : 'Draw';
      t.obj = t.refs.ddObjs ? t.refs.ddObjs.state.val : null;
      return React.createElement("div", {
        className: "Editor"
      }, React.createElement("div", {
        "class": "btn",
        onClick: function onClick() {
          t.Zoom(1.2);
        }
      }, "Z-In"), React.createElement("div", {
        "class": "btn",
        onClick: function onClick() {
          t.Zoom(0.8);
        }
      }, "Z-Out"), React.createElement("div", {
        "class": "btn",
        onClick: function onClick() {
          t.Draw();
        }
      }, drawName), React.createElement(DD, {
        ref: "ddObjs",
        valueType: "oid",
        nameType: "type",
        onChange: function onChange(v, e) {
          t.PickedObj(v, true);
        }
      }), React.createElement(DD, {
        ref: "ddSubs",
        valueType: "type",
        nameType: "type",
        onChange: function onChange(v, e) {
          t.PickedObj(v, false);
        }
      }), React.createElement(DD, {
        ref: "ddGraphs",
        valueType: "type",
        nameType: "type",
        onChange: function onChange(v, e) {
          t.PickedObj(v, false);
        }
      }), React.createElement("div", {
        "class": "btn",
        onClick: function onClick() {
          t.Move(t.state.px - 5, t.state.py, t.state.pa);
        }
      }, "left"), React.createElement("div", {
        "class": "btn",
        onClick: function onClick() {
          t.Move(t.state.px + 5, t.state.py, t.state.pa);
        }
      }, "right"), React.createElement("input", {
        value: t.state.px,
        onChange: function onChange(e) {
          t.Move($(e.target).val(), t.state.py, t.state.pa, 1000);
        }
      }), React.createElement("div", {
        "class": "btn",
        onClick: function onClick() {
          t.Move(t.state.px, t.state.py - 5, t.state.pa);
        }
      }, "up"), React.createElement("div", {
        "class": "btn",
        onClick: function onClick() {
          t.Move(t.state.px, t.state.py + 5, t.state.pa);
        }
      }, "down"), React.createElement("input", {
        value: t.state.py,
        onChange: function onChange(e) {
          t.state.px, t.Move($(e.target).val(), t.state.pa, 1000);
        }
      }), React.createElement("div", {
        "class": "btn",
        onClick: function onClick() {
          t.Move(t.state.px, t.state.py, t.state.pa - 0.1);
        }
      }, "angL"), React.createElement("div", {
        "class": "btn",
        onClick: function onClick() {
          t.Move(t.state.px, t.state.py, t.state.pa + 0.1);
        }
      }, "angR"), React.createElement("input", {
        value: t.state.pa,
        onChange: function onChange(e) {
          t.Move(t.state.px, t.state.py, t.state.pa, 1000);
        }
      }));
    }
  }]);

  return Editor;
}(React.Component); //xgame v1.01 : window resize errors
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
  G.LastPivotPos = {
    x: 0,
    y: 0
  };
  G.PlayerArea = {
    max: {
      x: 0,
      y: 0
    },
    min: {
      x: 0,
      y: 0
    }
  };
  G.Dudes = [];
  G.Loader_ = PIXI.Loader.shared;

  G.Init_ = function (con, onLoad) {
    G.HasServer = typeof SN != 'undefined';
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
      var firstRender = G.Renderer_ == null; //{ transparent: true} for renderer options  //0x14171d

      if (firstRender) {
        G.Renderer_ = new PIXI.Renderer({
          transparent: true,
          width: G.Width,
          height: G.Height
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
      G.Interaction = new PIXI.interaction.InteractionManager({
        root: G.Root_,
        view: G.Renderer_.view
      });
      if (firstRender) $(con).html(G.Renderer_.view);
      setTimeout(function () {
        $('canvas').trigger('click');
      }, 50);
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

        if (ob1 && ob2) {
          if (ob1.CollideStart) ob1.CollideStart(bodies[0].type, bodies[1].type, ob2, e.pairs[i]);
          if (ob2.CollideStart) ob2.CollideStart(bodies[1].type, bodies[0].type, ob1, e.pairs[i]);
        }
      }
    });
    Matter.Events.on(G.Engine_, 'collisionEnd', function (e) {
      for (var i = 0; i < e.pairs.length; i++) {
        var bodies = [e.pairs[i].bodyA, e.pairs[i].bodyB];
        var ob1 = G.Objs[bodies[0].oid];
        var ob2 = G.Objs[bodies[1].oid];

        if (ob1 && ob2) {
          if (ob1.CollideEnd) ob1.CollideEnd(bodies[0].type, bodies[1].type, ob2);
          if (ob2.CollideEnd) ob2.CollideEnd(bodies[1].type, bodies[0].type, ob1);
        }
      }
    });
  }; //todo fix this


  G.RemoveObject_ = function (obj) {
    if (obj) {
      var stage = obj.stage;
      if (obj.OnRemove) obj.OnRemove();
      Matter.Composite.remove(G.World_, obj.comp);

      obj.ancParts._each(function (p) {
        G.RemoveObject_(p);
      });

      obj.parts._each(function (part) {
        part.grs._each(function (y) {
          stage.removeChild(y); //if (y.fontSize == undefined){
          //y.destroy();}
        });
      });

      delete G.Objs[obj.oid];
      var i = G.LObjs_.findIndex(function (x) {
        return x.oid == obj.oid;
      });
      G.LObjs_.splice(i, 1);
    }
  };

  G.InitObj = function (type, oid) {
    if (oid) eval('var ob = new ' + type + "('" + oid + "');");else eval('var ob = new ' + type + "();");
    return ob;
  };

  G.LoadObj = function (obj, state) {
    if (state) {
      Object.keys(state)._each(function (key) {
        obj[key] = state[key];
      });
    }

    obj.Init();
    G.AddObject(obj);
    return obj;
  }; //LoadObjAndState


  G.InitAndLoad = function (oid, type, state) {
    var obj = G.InitObj(type, oid);
    return G.LoadObj(obj, state);
  };

  G.AddObject = function (obj) {
    G.Objs[obj.oid] = obj;
    G.LObjs_.push(obj);
    if (obj.type == 'g_dude') G.Dudes = G.Objs._where(function (x) {
      return x.type == 'g_dude';
    });
    if (obj.stage) obj.stage.children = obj.stage.children._orderBy(function (x) {
      return x.zIndex;
    });
    return {
      oid: obj.oid,
      x: obj.x,
      y: obj.y
    };
  };

  G.LoadObjects_ = function (obs) {
    G.Objs = {};
    G.LObjs_ = [];

    for (var i = 0; i < obs.length; i++) {
      var ob = G.InitObj(obs[i].type, obs[i].oid);

      Object.keys(obs[i])._each(function (x) {
        ob[x] = obs[i][x];
      });

      ob.Init();
      G.AddObject(ob);
    }

    G.LObjs_ = UT.List(G.Objs);
  };

  G.TickFunc_ = function (delta) {
    G.TickInputCheck_();
    if (G.PreTick_) G.PreTick_(delta);

    for (var i = 0; i < G.LObjs_.length; i++) {
      if (G.LObjs_[i] && G.LObjs_[i].isActive) {
        G.LObjs_[i].Tick(delta);
        G.LObjs_[i].PostTick(delta);
      }
    }

    if (G.PostTick_) G.PostTick_(delta);
  };

  G.TrackFPS_ = function () {
    if (!G.frames) G.frames = 0;
    G.frames++;
    G.Tick++;
    if (G.HasServer && !G.IsServer && CN) CN.ServerTick_++;

    if (G.frames % 100 == 0) {
      G.frames = 0;
      if (G.fpsTime) G.FPS_ = 100 / ((Date.now() - G.fpsTime) / 1000);
      G.fpsTime = Date.now();
    }
  };

  G.PostPhysics_ = function () {};

  G.RenderFunc_ = function () {
    var serverObjs = [];
    if (G.HasServer) serverObjs = G.IsServer ? SN.Objs_ : CN.Objs_;

    if (!G.IsServer) {
      G.bounds = {
        buffer: 300 / G.Stage_.scale.x,
        min: {
          x: G.Stage_.pivot.x,
          y: G.Stage_.pivot.y
        },
        max: {
          x: G.Stage_.pivot.x + G.Width / G.Stage_.scale.x,
          y: G.Stage_.pivot.y + G.Height / G.Stage_.scale.x
        }
      };
      var dx = G.dist(G.LastPivotPos, G.Stage_.pivot);
      G.ScreenMoved = false;

      if (dx > G.bounds.buffer * 0.5) {
        G.ScreenMoved = true;
        G.LastPivotPos = {
          x: G.Stage_.pivot.x,
          y: G.Stage_.pivot.y
        };
      }

      G.ParticleContainers._each(function (con) {
        for (var i = 0; i < con.children.length; i++) {
          var p = con.children[i];
          p.x += p.vel.x;
          p.y += p.vel.y;

          if (p.scaleVel) {
            p.scale.x += p.scaleVel.x;
            p.scale.y += p.scaleVel.y;
          }

          if (p.rotVel) p.rotation += p.rotVel;

          if (p.decay) {
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

    for (var i = 0; i < serverObjs.length; i++) {
      var ob = serverObjs[i];
      var old = {
        stick: G.IsServer ? G.Tick : CN.ServerTick_,
        pos: {
          x: ob.pos.x,
          y: ob.pos.y
        },
        vel: {
          x: ob.vel.x,
          y: ob.vel.y
        },
        angle: ob.con.angle
      };

      ob.olds._queue(old, 10);

      if (!G.IsServer && G.HasServer) CN.Interpolate_(ob);
    }
  };

  G.Cleanup_ = function (x, y) {
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

      G.ParticleContainers._each(function (p) {
        p.removeChildren();
      });
    }
  };

  G.PlayReset_ = function (x, y) {
    if (!G.World_ && !G.Stage_) return;
    G.Cleanup_(x, y);
    if (G.onLoad) G.onLoad(); //SERVER SIDE LOOOOP=======================

    var fpsInt = Math.ceil(G.FRate_);
    G.old60Time = Date.now();
    G.acc_ = 0;
    G.deltaStore_ = 0;

    if (G.IsServer) {
      G.Loop_ = function () {
        G.basicLoop_();
        if (Date.now() - G.old60Time < fpsInt - 4) setTimeout(G.Loop_);else setImmediate(G.Loop_);
        G.ttime = Date.now();
      };

      G.Loop_();
    } else {
      //CLIENT SIDE LOOOP------------------
      if (G.AnimationRequest_ != null) cancelAnimationFrame(G.AnimationRequest_);

      G.anim = function () {
        var updated = G.basicLoop_();

        if (updated) {
          PIXI.Ticker.shared.update(Date.now());
          G.Renderer_.render(G.Root_);
          UT.trigger('g_post');

          G.cycleTimes._queue(Date.now() - updated, 15);

          G.cycleAvg = 0;

          G.cycleTimes._each(function (x) {
            G.cycleAvg += x;
          });

          G.cycleAvg = G.cycleAvg / G.cycleTimes.length;
        }

        G.AnimationRequest_ = requestAnimationFrame(G.anim);
      };

      G.anim();
    }
  };

  G.basicLoop_ = function (time) {
    var time = Date.now();
    var update = false;
    G.deltaStore_ += time - G.old60Time;
    G.acc_ += time - G.old60Time;
    G.old60Time = time;

    if (G.acc_ >= G.FRate_) {
      update = time;
      UT.trigger('g_tick');
      G.TickFunc_(G.deltaStore_ / G.FRate_);
      G.deltaStore_ = 0;
      if (G.HasMatter_) Matter.Runner.tick(G.Runner_, G.Engine_, G.FRate_);
      G.PostPhysics_();
      G.RenderFunc_(); //interpolation ?? vel changes

      G.TrackFPS_();
      G.LastTime_ = Date.now();
      G.acc_ = G.acc_ - G.FRate_;

      if (Math.abs(G.acc_) >= G.FRate_ * 20) {
        UT.trigger('g_accum');
        G.acc_ = 0;
      }
    }

    return update;
  };

  G.HandleAnimations = function (x, isGraphic) {
    if (x.animate) {
      if (!x.astarted && x.animate.active) {
        x.astarted = true;
        x.aTime = G.Tick;
      }

      if (!x.animate.active) x.aTime = G.Tick; //done

      if (x.astarted && G.Tween(x, isGraphic)) {
        var dfunc = x.animate.done;

        if (!x.animate.repeat) {
          x.animate.active = false;
          x.astarted = false;
        } else if (x.animate.repeat) {
          x.astarted = true;
          x.aTime = G.Tick;
          G.Tween(x, isGraphic); // needed for perfrect sync
        }

        if (dfunc) dfunc();
      }

      if (!x.animate.active) {
        x.astarted = false;
      }
    }
  };

  G.Tween = function (part, isGraph) {
    var period = part.animate.period;
    var states = part.animate.states;
    if (period == Infinity || period == null) return false;
    var tick = G.Tick - part.aTime;
    G.TweenMove(part, isGraph, G.TweenStep(states, period, tick));
    return G.Tick - part.aTime >= period; // tick == (period - 1);
  };

  G.TweenStep = function (states, period, tick) {
    var pct = tick / period;
    var key = Math.floor((states.length - 1) * pct);
    var state = states[key];
    var nstate = states[(key + 1) % states.length];
    var speriod = period / (states.length - 1);
    var statePct = (tick - speriod * key) / speriod;
    return {
      x: state[0] != null ? state[0] + (nstate[0] - state[0]) * statePct : null,
      y: state[1] != null ? state[1] + (nstate[1] - state[1]) * statePct : null,
      ang: state[2] + (nstate[2] - state[2]) * statePct
    };
  };

  G.TweenMove = function (part, isGraphic, step) {
    var x = step.x;
    var y = step.y;
    var angle = step.ang;

    if (isGraphic) {
      if (!isNaN(x) && x != null) {
        part.wx = x;
        part.wy = y;
      }

      part.wa = angle != null ? angle : part.wa;
    } else {
      if (!isNaN(x) && x != null) {
        var newX = x;
        var newY = y;
        Matter.Body.setPosition(part, G.v(newX, newY));
      }

      if (angle != null) {
        Matter.Body.setAngle(part, angle);
      }
    }

    return part;
  };

  G.TweenTo = function (part, isGr, period, to) {
    part.astarted = false;
    var states = [];
    states.push([part.wx, part.wy, part.wa], to);
    part.animate = {
      states: states,
      period: period
    };
  };

  G.TickFunc = function (tick, func) {
    G.tickActions_.push({
      tick: tick,
      key: null,
      val: null,
      func: func
    });
  };

  G.TickAction = function (oid, tick, key, val, func) {
    G.tickActions_.push({
      tick: tick,
      key: key,
      val: val,
      oid: oid,
      func: func
    });
  };

  G.TickInputCheck_ = function () {
    for (var i = G.tickActions_.length - 1; i >= 0; i--) {
      var ta = G.tickActions_[i];

      if (G.Tick >= ta.tick) {
        if (ta.key && ta.oid && G.Objs[ta.oid]) G.Objs[ta.oid][ta.key] = ta.val;
        if (ta.func) ta.func(ta.oid != null ? G.Objs[ta.oid] : null, ta.key, ta.val);
        G.tickActions_.splice(i, 1);
      }
    }
  };

  G.apply = function (newObj, old) {
    Object.keys(newObj)._each(function (k) {
      old[k] = newObj[k];
    });
  }; //generic = 0, terrain = 1, dude = 2, serverTerr = 14, delayTerr = 15


  G.cats = [0x0001, 0x0002, 0x0004, 0x0008, 0x0010, 0x0020, 0x0040, 0x0080, 0x0100, 0x0200, 0x0400, 0x0800, 0x1000, 0x2000, 0x4000, 0x8000];
  G.Default = {
    color: 0x000000,
    lineColor: 0x000000,
    alignment: 1,
    //  (0.5 = middle, 1 = outer, 0 = inner).
    zIndex: 0
  };

  G.filterTex = function (filter, pad, gr) {
    var ops = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
    filter.padding = pad * 2;
    gr.filters = [filter];
    gr.pivot.set(0, 0);
    return G.Renderer_.generateTexture(gr, null, null, new PIXI.Rectangle(-pad, -pad, gr.width + pad * 4, gr.height + pad * 4));
  }; //pre-renders filter for performance


  G.filter = function (filter, pad, gr) {
    var ops = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
    var filterTex = G.filterTex(filter, pad, gr, ops);
    gr = new PIXI.Sprite();
    gr.texture = filterTex;
    G.apply(ops, gr);
    gr.pivot.set(gr.width / 2, gr.height / 2);
    return gr;
  };

  G.texture = function (gr, texture) {
    var ops = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    if (G.IsServer) return null;

    if (!gr) {
      gr = new PIXI.Sprite();
      G.apply(G.Default, gr);
    }

    G.apply(ops, gr);
    if (ops.size) gr.scale.set(gr.size, gr.size);
    gr.texture = texture;
    if (gr.offx) gr.pivot.set(gr.offx, gr.offy);else gr.pivot.set(gr.texture.width / 2, gr.texture.height / 2);
    return gr;
  };

  G.circle = function (gr, radius, ops) {
    if (G.IsServer) return null;

    if (!gr) {
      gr = new PIXI.Graphics();
      G.apply(G.Default, gr);
    }

    G.apply(ops, gr);
    gr.clear();
    if (gr.texture) gr.beginTextureFill(gr.texture);else gr.beginFill(gr.color, gr.opacity);
    gr.lineStyle(gr.lineWidth, gr.lineColor, gr.lineOpacity, gr.alignment);
    gr.drawCircle(0, 0, radius);
    gr.endFill(); //gr.pivot.set(gr.offx, gr.offy);

    gr.filters = gr.filter ? [gr.filter] : null;
    return gr;
  };

  G.poly = function (gr, points, ops) {
    if (G.IsServer) return null;

    if (!gr) {
      gr = new PIXI.Graphics();
      G.apply(G.Default, gr);
    }

    G.apply(ops, gr);
    gr.clear();
    if (gr.texture) gr.beginTextureFill(gr.texture);else gr.beginFill(gr.color, gr.opacity);
    gr.lineStyle(gr.lineWidth, gr.lineColor, gr.lineOpacity, gr.alignment);
    gr.drawPolygon(points);
    gr.endFill();
    gr.filters = gr.filter ? [gr.filter] : null;

    if (gr.offx == null) {
      var cen = G.center(points);
      gr.offx = cen.x;
      gr.offy = cen.y;
    }

    gr.pivot.set(gr.offx, gr.offy);
    return gr;
  };

  G.rect = function (gr, w, h, rad, ops) {
    if (G.IsServer) return null;

    if (!gr) {
      gr = new PIXI.Graphics();
      G.apply(G.Default, gr);
    }

    gr.clear();
    G.apply(ops, gr);
    if (gr.texture) gr.beginTextureFill(gr.texture);else gr.beginFill(gr.color, gr.opacity);
    gr.lineStyle(gr.lineWidth, gr.lineColor, gr.lineOpacity, gr.alignment);
    if (rad != null) gr.drawRoundedRect(0, 0, w, h, rad);else gr.drawRect(0, 0, w, h);
    gr.endFill();
    gr.pivot.set(gr.width / 2, gr.height / 2);
    gr.filters = gr.filter ? [gr.filter] : null;
    return gr;
  };

  G.line = function (gr, x, y, x2, y2, ops) {
    if (G.IsServer) return null;

    if (!gr) {
      gr = new PIXI.Graphics();
      G.apply(G.Default, gr);
    }

    G.apply(ops, gr);
    ops.lineWidth = ops.lineWidth == 0 ? 2 : ops.lineWidth;
    gr.clear();
    gr.lineStyle(gr.lineWidth, gr.color, gr.opacity);
    gr.moveTo(x, y);
    gr.lineTo(x2, y2);
    return gr;
  };

  G.curve = function (gr, p1, p2, p3) {
    var color = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : '#000D11';
    if (G.IsServer) return null;
    var gr = !gr ? new PIXI.Graphics() : gr;
    gr.clear();
    gr.lineStyle(2, color, 0.5);
    gr.moveTo(p1.x, p1.y);
    gr.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
    return gr;
  };

  G.text = function (gr, text, anchor) {
    var ops = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
    if (G.IsServer) return null;
    var isNew = !gr;
    var txtDef = {
      fontFamily: 'Arial',
      fontSize: 14,
      lineJoin: 'round',
      align: 'center',
      strokeThickness: 1
    };
    if (isNew) G.apply(G.Default, txtDef);
    G.apply(ops, txtDef);
    var gr = isNew ? new PIXI.Text('sdf', txtDef) : gr;
    G.apply(ops, gr);
    gr.text = text;
    gr.anchor = anchor ? anchor : {
      x: 0.5,
      y: 0.5
    };
    gr.resolution = 2;
    return gr;
  };

  G.particle = function (gr, ops) {
    var part = {};
    part.con = new PIXI.ParticleContainer(2000, {
      scale: true,
      alpha: true,
      rotation: true
    });
    part.texture = G.Renderer_.generateTexture(gr);
    part.x = ops.x;
    part.y = ops.y;
    part.decay = ops.decay ? ops.decay : true;
    part.life = ops.life ? ops.life : 15;
    part.maxLife = part.life;
    part.maxAlpha = part.alpha;
    part.vel = ops.vel ? ops.vel : {
      x: 0,
      y: 0
    };
    part.con.zIndex = ops.zIndex;
    G.Stage_.addChild(part.con);
    G.ParticleContainers.push(part.con);
    G.Stage_.children = G.Stage_.children._orderBy(function (x) {
      return x.zIndex;
    });
    return part;
  };

  G.spawnParticle = function (gr, ops) {
    if (gr.particle == null) {
      gr.particle = G.particle(gr, ops);
    }

    var grPart = new PIXI.Sprite();
    G.apply(gr.particle, grPart);
    G.apply(ops, grPart);
    grPart.x = ops.pos.x;
    grPart.y = ops.pos.y;
    if (!grPart.anchor) grPart.anchor = {
      x: 0.25,
      y: 0.25
    };
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

  G.playAudio = function (audio, volume) {
    if (!G.IsServer) {
      if (!audio.loading) {
        audio.loading = true;
        audio.pause();
        audio.volume = volume;
        audio.currentTime = 0;
        audio.prom = audio.play();
        audio.prom.then(function (_) {
          audio.loading = false;
        });
      }
    }
  }; //Helper Functions-------------------------------------------------------


  G.Graphic = function (bod) {
    var props = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    if (bod.label == 'Rectangle Body') {
      var w = bod.bounds.max.x - bod.bounds.min.x;
      var h = bod.bounds.max.y - bod.bounds.min.y;
      return G.rect(null, w, h, 3, props);
    }

    if (bod.label == 'Circle Body') return G.circle(null, bod.circleRadius, props);
  }; //no duplicate verts


  G.SafeVerts = function (verts) {
    verts = Matter.Vertices.fromPath(verts.toString());
    verts = verts.filter(function (v, ind, self) {
      return ind == self.findIndex(function (s) {
        return ~~s.x == ~~v.x && ~~s.y == ~~v.y;
      });
    });
    return verts;
  };

  G.TextureMatter = function (texture) {
    var totalVerts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 10;
    var props = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var verts = G.Outline(texture, totalVerts);
    return G.Bod.fromVertices(0, 0, verts, props);
  }; //vertices around texture


  G.Outline = function (texture) {
    var totalVerts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 10;
    var width = texture.width; //var off = {x: texture.width/2, y: texture.height/2};

    var pix = G.Renderer_.plugins.extract.pixels(texture);
    var verts = geom.contour(function (x, y) {
      return pix[(y * width + x) * 4 + 3] > 20;
    });
    var subVerts = [];
    var all = [];
    var eo = Math.min(pix.length, totalVerts) / 20;

    for (var i = 0; i < verts.length; i += eo) {
      subVerts.push({
        x: verts[i][0],
        y: verts[i][1]
      });
      all.push(verts[i][0], verts[i][1]);
    }

    return subVerts;
  }, G.InBox = function (obj, box, buffer) {
    return box != null && obj.min.x < box.max.x + buffer && obj.max.x > box.min.x - buffer && obj.max.y > box.min.y - buffer && obj.min.y < box.max.y + buffer;
  };

  G.center = function (points) {
    var t = this;
    var vectors = [];

    for (var i = 0; i < points.length - 1; i += 2) {
      vectors.push({
        x: points[i],
        y: points[i + 1]
      });
    }

    return Matter.Vertices.centre(vectors);
  };

  G.v = function (x, y) {
    return {
      x: x,
      y: y
    };
  };

  G.vsub = function (x, y) {
    return Matter.Vector.sub(x, y);
  };

  G.vdot = function (v1, v2) {
    return v1.x * v2.x + v1.y * v2.y;
  };

  G.vmult = function (x, y, mult) {
    if (isNaN(x)) {
      mult = y;
      y = x.y;
      x = x.x;
    }

    return Matter.Vector.mult({
      x: x,
      y: y
    }, mult);
  };

  G.vnorm = function (x, y) {
    if (isNaN(x)) {
      y = x.y;
      x = x.x;
    }

    return Matter.Vector.normalise({
      x: x,
      y: y
    });
  };

  G.mag = function (x, y) {
    if (isNaN(x)) {
      y = x.y;
      x = x.x;
    }

    return Math.sqrt(x * x + y * y);
  }; // line intercept math by Paul Bourke http://paulbourke.net/geometry/pointlineplane/


  G.intercept = function (x1, y1, x2, y2, x3, y3, x4, y4) {
    var ignoreLength = arguments.length > 8 && arguments[8] !== undefined ? arguments[8] : false;
    if (x1 === x2 && y1 === y2 || x3 === x4 && y3 === y4) return false;
    denominator = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
    if (denominator === 0) return false;
    var ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator;
    var ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator;

    if (!ignoreLength) {
      if (ua < 0 || ua > 1 || ub < 0 || ub > 1) return false;
    }

    var x = x1 + ua * (x2 - x1);
    var y = y1 + ua * (y2 - y1);
    return {
      x: x,
      y: y
    };
  };

  G.dist = function (v1, v2) {
    return Math.sqrt((v2.x - v1.x) * (v2.x - v1.x) + (v2.y - v1.y) * (v2.y - v1.y));
  };

  G.UID_ = function () {
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var uid = "";

    for (var i = 0; i < 3; i++) {
      uid += chars[Math.floor(Math.random() * chars.length)];
    }

    return uid;
  };
})(typeof exports === 'undefined' ? G : exports);

var Gobj =
/*#__PURE__*/
function () {
  function Gobj(type, stage, world, oid, group) {
    _classCallCheck(this, Gobj);

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

    t.oid = oid ? oid : type + "_" + G.LObjs_.length + "_" + G.UID_();

    if (G.HasMatter_) {
      t.comp = Matter.Composite.create({});
      t.comp.gobj = t.type + " " + t.oid;
      t.group = group ? group : Matter.Body.nextGroup(true);
    }
  }

  _createClass(Gobj, [{
    key: "Init",
    value: function Init() {
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var addObject = arguments.length > 1 ? arguments[1] : undefined;
      var t = this;
      t.isActive = true;
      t.main = t.parts[0];
      t.IsParent = !t.IsAncPart;

      if (t.parts.length > 1) {
        options.parts = t.parts;
        t.con = Matter.Body.create(options);
        t.Setup('con', t.con);
      } else t.con = t.main;

      t.vel = t.con.velocity;
      t.pos = t.con.position;
      Matter.Composite.addBody(t.comp, t.con);
      Matter.World.add(t.world, [t.comp]);
      if (t.state) t.olds = [];
      if (addObject) G.AddObject(t);
      t.updated = true;
    }
  }, {
    key: "Part",
    value: function Part(type, bod) {
      var t = this;
      t.Setup(type, bod);
      t.parts.push(bod);
      return bod;
    }
  }, {
    key: "AncPart",
    value: function AncPart(type, anchors, bod) {
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

      if (p.HasLink) {
        var anc = anchors[0];
        p.SetPos(t.main.position.x - anc.x + wx, t.main.position.y - anc.y + wy);

        anchors._each(function (a) {
          t.addLink({
            bodyA: t.main,
            bodyB: bod,
            length: 0,
            pointA: {
              x: wx,
              y: wy
            },
            pointB: {
              x: a.x,
              y: a.y
            }
          });
        });
      } else {
        p.parentObj = t;
      }

      t.ancParts.push(p);
    }
  }, {
    key: "Setup",
    value: function Setup(type, bod) {
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

      if (t.parts[0] && type != 'con') {
        Matter.Body.setPosition(bod, {
          x: t.parts[0].position.x + bod.wx,
          y: t.parts[0].position.y + bod.wy
        });
      }

      bod.vertices._each(function (v) {
        bod.ogVerts.push({
          x: v.x,
          y: v.y
        });
      });

      bod.axes._each(function (v) {
        bod.ogAxes.push({
          x: v.x,
          y: v.y
        });
      }); //render stuff


      bod.render.lineWidth = 2;
      bod.render.strokeStyle = "rgba(191, 108, 63, 1)";
      bod.render.fillStyle = "transparent";
      return bod;
    }
  }, {
    key: "SetActive",
    value: function SetActive(active) {
      var t = this;

      if (active != t.isActive) {
        t.isActive = t.comp.isActive = active;
        t.updated = true;

        for (var i = 0; i < t.ancParts.length; i++) {
          t.ancParts[i].SetActive(active);
        }

        if (t.world && active) Matter.World.add(t.world, [t.comp]);else if (t.world) Matter.Composite.remove(t.world, t.comp);
      }
    }
  }, {
    key: "addG",
    value: function addG(bod, type, gr) {
      var wx = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
      var wy = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0;
      var px = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 0;
      var py = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : 0;
      var t = this;
      if (!gr.transform) gr = G.Graphic(bod, gr);
      gr.type = type; //gr.bod = bod;

      gr.pivot.set(px + gr.pivot.x, py + gr.pivot.y);
      gr.wx = wx;
      gr.wy = wy;
      gr.wa = 0;
      gr.hidden = false;
      bod.grs[type] = gr;
      t.stage.addChild(gr);
      return gr;
    }
  }, {
    key: "SetPos",
    value: function SetPos(x, y, ang) {
      var roundedSync = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
      var t = this;
      ang = ang != null ? ang : t.main.angle;

      if (roundedSync) {
        t.RoundedSync();
      } else {
        if (t.parentObj) {
          var d = {
            x: t.ancX,
            // (t.pos.x) - t.parentObj.pos.x,
            y: t.ancY //(t.pos.y) - t.parentObj.pos.y

          };
          var cos = Math.cos(ang);
          var sin = Math.sin(ang);
          x = x + (d.x * cos - d.y * sin);
          y = y + (d.x * sin + d.y * cos);
          ang += t.ancA;
        }

        Matter.Body.setAngle(t.con, ang);
        Matter.Body.setPosition(t.con, {
          x: x,
          y: y
        });
      }

      for (var i = 0; i < t.ancParts.length; i++) {
        t.ancParts[i].SetPos(x, y, ang, roundedSync);
      }

      t.updated = true;
    }
  }, {
    key: "RoundedSync",
    value: function RoundedSync() {
      var t = this;
      var ogAng = SN.Form(t.con.angle);
      var ogPos = {
        x: SN.Form(t.pos.x),
        y: SN.Form(t.pos.y)
      };
      var ogVel = {
        x: SN.Form(t.vel.x),
        y: SN.Form(t.vel.y)
      };
      t.con.syncFrame = true;

      t.con.parts._each(function (p) {
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
        p.position.x = p.wx; //is this right?

        p.position.y = p.wy;
      });

      Matter.Body.setPosition(t.con, ogPos);
      Matter.Body.setAngle(t.con, ogAng);
      Matter.Body.setVelocity(t.con, ogVel);
      Matter.Body.setAngularVelocity(t.con, SN.Form(t.con.angularVelocity));
      var imp = t.con.positionImpulse;
      var cimp = t.con.constraintImpulse;
      t.con.positionImpulse = {
        x: SN.Form(imp.x, 2),
        y: SN.Form(imp.y, 2)
      };
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
    }
  }, {
    key: "SetForce",
    value: function SetForce(x, y, xpos, ypos) {
      var t = this;
      Matter.Body.applyForce(t.con, {
        x: xpos ? xpos : 0,
        y: ypos ? ypos : 0
      }, {
        x: x,
        y: y
      });
    }
  }, {
    key: "SetVel",
    value: function SetVel(x, y) {
      var t = this;
      Matter.Body.setVelocity(t.con, {
        x: x,
        y: y
      });

      for (var i = 0; i < t.ancParts.length; i++) {
        t.ancParts[i].SetVel(x, y);
      }
    }
  }, {
    key: "Toggle",
    value: function Toggle(visible) {
      var t = this;

      if (!G.IsServer) {
        t.parts._each(function (x) {
          x.grs._each(function (g) {
            g.visible = visible;
          });
        });

        t.InFrame = visible;
        t.visible = visible;

        for (var i = 0; i < t.ancParts.length; i++) {
          t.ancParts[i].Toggle(visible);
        }
      }
    }
  }, {
    key: "addLink",
    value: function addLink(link) {
      var t = this;
      link = Matter.Constraint.create(link); //link.damping = 0.1;

      link.render.strokeStyle = '#ff00ff';
      Matter.Composite.addConstraint(t.comp, link);
      return link;
    }
  }, {
    key: "PreRender",
    value: function PreRender() {
      var t = this;
      var checkInFrame = G.ScreenMoved || t.updated || !t.main.isStatic && G.Tick % 10 == 0 && G.bounds;

      if (checkInFrame && G.bounds) {
        var oldVis = t.InFrame;
        var bounds = t.main.isStatic ? t.con.bounds : {
          min: t.pos,
          max: t.pos
        };
        t.InFrame = G.InBox(bounds, G.bounds, G.bounds.buffer);

        if (oldVis != t.InFrame) {
          t.updated = true;
          clearTimeout(t.ttActive);
          t.ttActive = setTimeout(function () {
            if (t.main.isStatic) t.SetActive(t.InFrame);
          }, 200);
        }
      }

      t.parts._each(function (part) {
        var grKeys = Object.keys(part.grs);
        var cos,
            sin = null;

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
    }
  }, {
    key: "CollideStart",
    value: function CollideStart(myType, objType, obj) {
      var t = this;
      if (t.parentObj) t.parentObj.CollideStart(myType, objType, obj);
    }
  }, {
    key: "CollideEnd",
    value: function CollideEnd(myType, objType, obj) {
      var t = this;
      if (t.parentObj) t.parentObj.CollideEnd(myType, objType, obj);
    }
  }, {
    key: "Tick",
    value: function Tick(delta) {
      var t = this;

      if (t.parentObj) {
        var p = t.parentObj;
        t.SetPos(p.pos.x, p.pos.y, p.con.angle);
        t.SetVel(p.vel.x, p.vel.y);
      }
    }
  }, {
    key: "PostTick",
    value: function PostTick() {
      var t = this;

      t.parts._each(function (part) {
        G.HandleAnimations(part, false);
      });
    }
  }]);

  return Gobj;
}();

if (typeof exports !== 'undefined') module.exports = Gobj;/* ======== No Steal Code (>.>) Twelve47Kevin@gmail.com ======== */ 
"use strict";

var _CG;

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _get(target, property, receiver) { if (typeof Reflect !== "undefined" && Reflect.get) { _get = Reflect.get; } else { _get = function _get(target, property, receiver) { var base = _superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(receiver); } return desc.value; }; } return _get(target, property, receiver || target); }

function _superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = _getPrototypeOf(object); if (object === null) break; } return object; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

$(function () {
  UT.Extensions();
  M.Init();
  M.Dad = ReactDOM.render(React.createElement(Dad, null), document.getElementById('root'));
});
var M = {
  Init: function Init() {
    if (!M.ModMode) {
      setTimeout(function () {
        CG.Init();
      }, 200);
    }
  }
};

var Dad =
/*#__PURE__*/
function (_React$Component) {
  _inherits(Dad, _React$Component);

  function Dad() {
    var _this;

    _classCallCheck(this, Dad);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(Dad).call(this));
    _this.state = {};
    return _this;
  }

  _createClass(Dad, [{
    key: "render",
    value: function render() {
      var t = this;
      return React.createElement("div", {
        className: "dad"
      }, React.createElement("div", {
        className: "div-gcontainer"
      }, React.createElement("div", {
        className: "div-game"
      })), React.createElement(End, {
        ref: "End"
      }), React.createElement(Start, {
        ref: "Start"
      }), React.createElement(UI, {
        ref: "UI"
      }));
    }
  }]);

  return Dad;
}(React.Component);

var DD =
/*#__PURE__*/
function (_React$Component2) {
  _inherits(DD, _React$Component2);

  function DD(props) {
    var _this2;

    _classCallCheck(this, DD);

    _this2 = _possibleConstructorReturn(this, _getPrototypeOf(DD).call(this));

    var t = _assertThisInitialized(_this2);

    t.state = {};
    t.state.data = props.data ? props.data : [];
    t.state.val = t.state.data[0];
    return _this2;
  }

  _createClass(DD, [{
    key: "OnChange",
    value: function OnChange(e) {
      var t = this;
      var i = $(e.target).find('option:selected').attr('index');
      t.state.val = t.state.data[i];
      if (t.props.onChange) t.props.onChange(t.state.data[i], t);
    }
  }, {
    key: "render",
    value: function render() {
      var t = this;
      var ops = [];

      if (!t.state.val && t.state.data && t.state.data[0] != null) {
        t.state.val = t.state.data[0];
        if (t.props.onChange) t.props.onChange(t.state.data[0], t);
      }

      for (var i = 0; i < t.state.data.length; i++) {
        var x = t.state.data[i];
        var currVal = _typeof(t.state.val) == 'object' ? t.state.val[t.props.valueType] : t.state.val;
        var val = _typeof(x) == 'object' ? x[t.props.valueType] : x;
        var name = _typeof(x) == 'object' ? x[t.props.nameType] : x;
        var select = currVal == val;
        if (select) ops.push(React.createElement("option", {
          selected: "true",
          index: i,
          value: val
        }, name));else ops.push(React.createElement("option", {
          index: i,
          value: val
        }, name));
      }

      return React.createElement("select", {
        className: "div-dd",
        onChange: function onChange(e) {
          return t.OnChange(e);
        }
      }, ops);
    }
  }]);

  return DD;
}(React.Component);

var End =
/*#__PURE__*/
function (_React$Component3) {
  _inherits(End, _React$Component3);

  function End() {
    var _this3;

    _classCallCheck(this, End);

    _this3 = _possibleConstructorReturn(this, _getPrototypeOf(End).call(this));

    var t = _assertThisInitialized(_this3);

    t.state = {
      ended: false
    };
    return _this3;
  }

  _createClass(End, [{
    key: "render",
    value: function render() {
      var t = this;
      if (!t.state.ended) return null;
      return React.createElement("div", {
        className: "End"
      }, React.createElement("div", {
        className: "div-title"
      }, "The Castle has Fallen"), React.createElement("div", {
        className: "div-title-2"
      }, "Score: ", CG.score), React.createElement("div", {
        className: "div-credits"
      }, React.createElement("div", {
        className: "div-title-2"
      }, "Credits"), React.createElement("div", null, "- Programming / Art / Design: ", React.createElement("b", null, "Skivvy"), " (Twelve47Studios.com) "), React.createElement("div", null, "- Inspired By an old Web-Game: \"Defend your Castle\" "), React.createElement("div", null, "- Music : https://www.free-stock-music.com/purrple-cat-wishing-well.html  (Purrple Cat)"), React.createElement("div", null, "- Texture : http://texturelib.com/license/ (Dmitriy Chugai)"), React.createElement("div", null, "- Sounds : https://freesound.org/ (bubaproducer) (plasterbrain) (InspectorJ) (gprosser) (kretopi) (InspectorJ) (cydon) (YourFriendJesse)")), React.createElement("div", null, React.createElement("div", {
        onClick: function onClick() {
          location.reload();
        },
        className: "btn div-restart"
      }, "Restart"), React.createElement("div", {
        onClick: function onClick() {
          CG.Continue();
        },
        className: "btn div-continue"
      }, "Continue? (noob)")));
    }
  }]);

  return End;
}(React.Component);

var EM = {
  textures: {},
  GetEmotes: function GetEmotes(done) {
    EM.f1 = new PIXI.filters.GlowFilter(5, 5, 0, 0x0, 1);
    EM.f2 = new PIXI.filters.GlowFilter(10, 10, 0, 0x0, 1);
    EM.f3 = new PIXI.filters.GlowFilter(5, 5, 0, 0xffffa1, 1);
    var url = 'https://api.twitchemotes.com/api/v4/channels/' + '121059319';
    $.get(url, function (data) {
      if (data.emotes) {
        data.emotes._each(function (em) {
          EM.twitchEmotes[em.id] = {
            id: em.id,
            code: em.code,
            origin: 'twitch'
          };
        });
      }

      EM.LoadEmotes(UT.List(EM.twitchEmotes), function () {
        G.Loader_.load(function (loader, res) {
          res._each(function (r) {
            if (!CG.textures[r.name]) {
              var tex = G.texture(null, r.texture, {});
              var ft = G.filterTex(EM.f1, 5, tex, {
                zIndex: 5
              });
              EM.textures[r.name] = ft;
            }
          });

          if (done) done(EM.textures);
        });
      });
    });
  },
  To64Data: function To64Data(stuff) {
    var t2 = btoa(new Uint8Array(stuff).reduce(function (data, _byte) {
      return data + String.fromCharCode(_byte);
    }, ''));
    return 'data:image/png;base64,' + t2;
  },
  LoadEmotes: function LoadEmotes(list, done) {
    var total = list.length;

    list._each(function (d) {
      var url = "https://static-cdn.jtvnw.net/emoticons/v1/" + d.id + "/2.0";
      if (d.origin == 'ffz') url = 'https://cdn.frankerfacez.com/emoticon/' + d.id + '/' + d.size;

      if (d.origin != 'bttv') {
        var oReq = new XMLHttpRequest();
        oReq.open("GET", url, true);
        oReq.responseType = "arraybuffer";
        oReq.edata = d;

        oReq.onload = function (oEvent) {
          var arrayBuffer = oReq.response;
          var src = EM.To64Data(arrayBuffer);
          if (!G.Loader_.resources[oEvent.target.edata.code]) G.Loader_.add(oEvent.target.edata.code, src);
          total--;
          if (total <= 0) done();
        };

        oReq.send();
      } else total--;
    });
  },
  twitchEmotes: {
    '1': {
      origin: 'twitch',
      code: '\:-?\)',
      id: 1
    },
    '354': {
      origin: 'twitch',
      code: '4Head',
      id: 354
    },
    '4057': {
      origin: 'twitch',
      code: 'BrokeBack',
      id: 4057
    },
    '22639': {
      origin: 'twitch',
      code: 'BabyRage',
      id: 22639
    },
    '86': {
      origin: 'twitch',
      code: 'BibleThump',
      id: 86
    },
    '153556': {
      origin: 'twitch',
      code: 'BlessRNG',
      id: 153556
    },
    '33': {
      origin: 'twitch',
      code: 'DansGame',
      id: 33
    },
    '111700': {
      origin: 'twitch',
      code: 'DatSheffy',
      id: 111700
    },
    '360': {
      origin: 'twitch',
      code: 'FailFish',
      id: 360
    },
    '30259': {
      origin: 'twitch',
      code: 'HeyGuys',
      id: 30259
    },
    '114836': {
      origin: 'twitch',
      code: 'Jebaited',
      id: 114836
    },
    '25': {
      origin: 'twitch',
      code: 'Kappa',
      id: 25
    },
    '55338': {
      origin: 'twitch',
      code: 'KappaPride',
      id: 55338
    },
    '41': {
      origin: 'twitch',
      code: 'Kreygasm',
      id: 41
    },
    '425618': {
      origin: 'twitch',
      code: 'LUL',
      id: 425618
    },
    '28': {
      origin: 'twitch',
      code: 'MrDestructoid',
      id: 28
    },
    '58765': {
      origin: 'twitch',
      code: 'NotLikeThis',
      id: 58765
    },
    '88': {
      origin: 'twitch',
      code: 'PogChamp',
      id: 88
    },
    '245': {
      origin: 'twitch',
      code: 'ResidentSleeper',
      id: 245
    },
    '64138': {
      origin: 'twitch',
      code: 'SeemsGood',
      id: 64138
    },
    '34': {
      origin: 'twitch',
      code: 'SwiftRage',
      id: 34
    },
    '81274': {
      origin: 'twitch',
      code: 'VoHiYo',
      id: 81274
    },
    '28087': {
      origin: 'twitch',
      code: 'WutFace',
      id: 28087
    }
  }
}; //dude

var g_archer =
/*#__PURE__*/
function (_Gobj) {
  _inherits(g_archer, _Gobj);

  function g_archer(oid) {
    var _this4;

    _classCallCheck(this, g_archer);

    _this4 = _possibleConstructorReturn(this, _getPrototypeOf(g_archer).call(this, 'g_archer', G.Stage_, G.World_, oid));

    var t = _assertThisInitialized(_this4);

    t.fireRate = Math.max(5, 100 - CG.totalArchers);
    t.upkeep = 10;
    t.arrows = [];
    t.twitch = '';
    t.archer = null;
    return _this4;
  }

  _createClass(g_archer, [{
    key: "Init",
    value: function Init() {
      var t = this;
      t.color = 0x0;
      if (!t.emote) t.emote = EM.textures['moon2DUMB'];
      var txtSettings = {
        fontSize: 20,
        strokeThickness: 4,
        fontWeight: 600,
        fill: 'white',
        zIndex: 5
      };

      for (var i = 0; i < 20; i++) {
        t.arrows.push(G.InitAndLoad(null, 'g_arrow', {
          spos: t.spos
        }));
      }

      t.Part('body', G.Bod.rectangle(t.spos.x, t.spos.y, 40, 40, {
        restitution: 0.5,
        inertia: Infinity,
        isStatic: true
      }));
      t.addG(t.body, 'head', G.texture(null, t.emote, {
        zIndex: 1.1
      }), -20, -15);
      t.addG(t.body, 'msg', G.text(null, t.twitch, null, txtSettings), 0, -40 - t.body.grs.head.height / 2);
      t.body.grs.head.alpha = 0;

      if (t.side == 0) {
        txtSettings.fontSize = 25;
        t.addG(t.body, 'count', G.text(null, 0, null, txtSettings), -15, 70);
      }

      _get(_getPrototypeOf(g_archer.prototype), "Init", this).call(this);
    }
  }, {
    key: "ShowArcher",
    value: function ShowArcher(a) {
      var t = this;

      if (a.emote) {
        t.archer = a;
        G.texture(t.body.grs.head, a.emote, {
          zIndex: 1.1,
          opacity: 1
        });
        t.body.grs.head.alpha = 1;

        if (a.twitch) {
          t.body.grs.msg.text = a.twitch;
        }
      }
    }
  }, {
    key: "Tick",
    value: function Tick(delta) {
      var t = this;
      var now = Date.now();
      t.body.grs.head.visible = t.archer != null;
      if (t.side == 0) t.body.grs.count.text = CG.archers.length;

      CG.archers._each(function (a) {
        if (now > a.lastFire + 2500 && a.side == t.side) {
          a.lastFire = now;
          if (a.isNew || t.archer == null) t.ShowArcher(a);
          a.isNew = false;

          if (Math.random() > 0.8) {
            var arrow = t.arrows._first(function (x) {
              return x.firing == false;
            });

            if (arrow) arrow.Fire();
          }
        }
      });
    }
  }, {
    key: "CollideStart",
    value: function CollideStart(myType, objType, obj) {
      var t = this;
    }
  }, {
    key: "CollideEnd",
    value: function CollideEnd(myType, objType, obj) {
      var t = this;
    }
  }, {
    key: "OnRemove",
    value: function OnRemove() {}
  }]);

  return g_archer;
}(Gobj);

if (typeof exports !== 'undefined') module.exports = g_archer; //dude

var g_arrow =
/*#__PURE__*/
function (_Gobj2) {
  _inherits(g_arrow, _Gobj2);

  function g_arrow(oid) {
    var _this5;

    _classCallCheck(this, g_arrow);

    _this5 = _possibleConstructorReturn(this, _getPrototypeOf(g_arrow).call(this, 'g_arrow', G.Stage_, G.World_, oid));

    var t = _assertThisInitialized(_this5);

    t.firing = false;
    t.damage = 100;
    return _this5;
  }

  _createClass(g_arrow, [{
    key: "Init",
    value: function Init() {
      var t = this;
      t.color = 0x0;
      t.Part('body', G.Bod.rectangle(t.spos.x, t.spos.y, 30, 10, {
        inertia: Infinity,
        frictionAir: 0,
        isSensor: true
      }));
      t.addG(t.body, 'bpart', G.texture(null, CG.textures.arrow, {
        zIndex: 2.1
      }));
      t.body.grs.bpart.scale = {
        x: 0.4,
        y: 0.4
      };

      _get(_getPrototypeOf(g_arrow.prototype), "Init", this).call(this);

      t.con.collisionFilter.category = G.cats[6];
      t.con.collisionFilter.mask = G.cats[1] | G.cats[2];
    }
  }, {
    key: "Fire",
    value: function Fire() {
      var t = this;
      var grav = 0.285;

      if (UT.List(CG.guys).length > 0) {
        var guys = UT.List(CG.guys)._where(function (x) {
          return !x.flung && !x.grabbed && x.pos.x > CG.archer.pos.x + 250;
        });

        var guy = guys.length > 0 ? guys[Math.floor(guys.length * Math.random())] : null;

        if (guy) {
          var floorTop = CG['floor' + guy.plane].con.bounds.min.y;
          var disToFloor = floorTop - t.pos.y;
          var time = disToFloor / 0.285;
          time = Math.sqrt(2 * disToFloor / grav);
          var futurePos = guy.pos.x - Math.abs(guy.vel.x) * time - 80;
          var dist = Math.abs(t.pos.x - futurePos);
          var vOrigin = dist / time;
          var ranCons = 0.5;
          if (dist > 300) ranCons = 1;
          if (dist > 600) ranCons = 2;
          if (dist > 900) ranCons = 3;
          vOrigin = -ranCons + vOrigin + Math.random() * ranCons * 2; //18

          t.SetVel(vOrigin, -1);
          t.firing = true;
          clearTimeout(t.ttArrow);
          t.ttArrow = setTimeout(function () {
            if (t.firing) t.ResetArrow();
          }, 5000);
        }
      }
    }
  }, {
    key: "ResetArrow",
    value: function ResetArrow() {
      var t = this;
      t.hitTarget = null;
      t.hitOffset = null;
      t.SetVel(0, 0);
      t.SetPos(t.spos.x, t.spos.y);
      t.firing = false;
      if (CG.activeArrow && CG.activeArrow.oid == t.oid) CG.activeArrow = null;
    }
  }, {
    key: "Tick",
    value: function Tick(delta) {
      var t = this;

      if (!t.firing) {
        t.body.grs.bpart.alpha = 0;
        t.SetVel(0, 0);
        t.SetPos(t.spos.x, t.spos.y);
      } else {
        t.body.grs.bpart.alpha = 1;
        if (CG.activeArrow == null) CG.activeArrow = t;

        if (t.pos.y > CG.h + 100) {
          t.body.grs.bpart.alpha = 0;
          t.ResetArrow();
        }

        G.spawnParticle(CG.fxFire1, {
          zIndex: 18,
          pos: {
            x: t.pos.x,
            y: t.pos.y
          },
          vel: {
            x: 0,
            y: Math.random() * -3
          }
        });
        if (t.hitTarget == null) t.SetPos(t.pos.x, t.pos.y, Math.atan2(t.vel.y, t.vel.x));

        if (t.hitTarget != null) {
          t.SetPos(t.hitTarget.pos.x + t.hitOffset.x, t.hitTarget.pos.y + t.hitOffset.y);
        }
      }
    }
  }, {
    key: "CollideStart",
    value: function CollideStart(myType, objType, obj) {
      var t = this;

      if (obj.type == 'g_guy' && t.firing && t.hitTarget == null && !obj.dying && !obj.grabbed) {
        obj.hit = true;
        clearTimeout(obj.ttHit);
        obj.ttHit = setTimeout(function () {
          obj.hit = false;
        }, 500);
        obj.SetVel(obj.vel.x + 4, obj.vel.y - 2);
        var dmg = Math.random() > 0.5 ? t.damage : 75;
        if (dmg <= 75) CG.sxSplat2.play();
        obj.health -= dmg;
        obj.CheckDeath(5 / 2);

        if (obj.health <= 0) {
          obj.DeathAnimation(false, function () {
            return Math.random() * t.vel.x * 0.5;
          }, function () {
            return -2 + Math.random() * 4;
          });
        }

        t.hitOffset = {
          x: obj.pos.x - t.pos.x - t.vel.x * 2,
          y: obj.pos.y - t.pos.y - t.vel.y * 2
        };
        t.hitTarget = obj;
        setTimeout(function () {
          t.body.grs.bpart.alpha = 0;
          t.ResetArrow();
        }, 200);
      }
    }
  }, {
    key: "CollideEnd",
    value: function CollideEnd(myType, objType, obj) {
      var t = this;
    }
  }, {
    key: "OnRemove",
    value: function OnRemove() {}
  }]);

  return g_arrow;
}(Gobj);

if (typeof exports !== 'undefined') module.exports = g_arrow; //dude

var g_bomber =
/*#__PURE__*/
function (_Gobj3) {
  _inherits(g_bomber, _Gobj3);

  function g_bomber(oid) {
    var _this6;

    _classCallCheck(this, g_bomber);

    _this6 = _possibleConstructorReturn(this, _getPrototypeOf(g_bomber).call(this, 'g_bomber', G.Stage_, G.World_, oid));

    var t = _assertThisInitialized(_this6);

    t.twitch = '';
    return _this6;
  }

  _createClass(g_bomber, [{
    key: "Init",
    value: function Init() {
      var t = this;
      t.color = 0x0;
      if (!t.emote) t.emote = EM.textures['moon2DUMB'];
      var txtSettings = {
        fontSize: 20,
        strokeThickness: 4,
        fontWeight: 600,
        fill: 'white',
        zIndex: 5
      };
      t.Part('body', G.Bod.rectangle(t.spos.x, t.spos.y, 30, 40, {
        restitution: 0.5,
        inertia: Infinity,
        friction: 0.02
      }));
      var l1 = t.l1 = t.addG(t.body, 'l1', G.texture(null, CG.leg, {
        zIndex: 1.5 - t.plane * 0.01
      }), 4, 0, 0, -20);
      var l2 = t.l2 = t.addG(t.body, 'l2', G.texture(null, CG.leg, {
        zIndex: 1.5 - t.plane * 0.01
      }), -4, 0, 0, -20);
      l1.animate = {
        states: [[l1.wx, l1.wy, 0], [l1.wx, l1.wy, -1], [l1.wx, l1.wy, 0], [l1.wx, l1.wy, 1], [l1.wx, l1.wy, 0]],
        period: 30,
        repeat: true,
        active: true
      };
      l2.animate = {
        states: [[l2.wx, l2.wy, 0], [l2.wx, l2.wy, 1], [l2.wx, l2.wy, 0], [l2.wx, l2.wy, -1], [l2.wx, l2.wy, 0]],
        period: 30,
        repeat: true,
        active: true
      };
      t.addG(t.body, 'head', G.texture(null, t.emote, {
        zIndex: 1.5 - t.plane * 0.01
      }), 0, -30);
      t.addG(t.body, 'bomb', G.texture(null, CG.textures.bomb, {
        zIndex: 1.5 - t.plane * 0.01
      }));
      t.body.grs.bomb.scale = {
        x: -0.4,
        y: 0.4
      };
      t.addG(t.body, 'msg', G.text(null, t.twitch, null, txtSettings), 0, -40 - t.body.grs.head.height / 2); //t.body.grs.bomb.wa = -0.5;

      _get(_getPrototypeOf(g_bomber.prototype), "Init", this).call(this);

      t.con.collisionFilter.category = G.cats[2];
      t.con.collisionFilter.mask = G.cats[t.plane] | G.cats[0] | G.cats[6];
    }
  }, {
    key: "Explode",
    value: function Explode() {
      //get enemies near me
      //impart damange / velocity based on distance
      var t = this;
      CG.sxExplode.play();

      for (var i = 0; i < 20; i++) {
        G.spawnParticle(CG.fxFire2, {
          zIndex: 18,
          life: 20,
          pos: {
            x: t.pos.x,
            y: t.pos.y - 20
          },
          vel: {
            x: -8 + Math.random() * 16,
            y: -8 + Math.random() * 16
          }
        });
      }

      CG.guys._each(function (guy) {
        var dist = G.dist(guy.pos, t.pos);

        if (dist < 500) {
          guy.flung = true;
          var test = 1 / dist * (1 / dist) * 2200000;
          var amnt = Math.max(10, 1 / dist * (1 / dist) * 2200000);
          amnt = Math.min(600, amnt);
          var blast = Math.min(20, amnt * 0.2);
          guy.SetVel(guy.pos.x > t.pos.x ? blast : -blast, -blast);
          guy.health -= amnt;
          guy.CheckDeath(1);

          if (guy.health <= 0) {
            guy.DeathAnimation(false, function () {
              return Math.random() * -blast * 0.5;
            }, function () {
              return Math.random() * -blast * 0.5;
            });
          }
        }
      });

      G.RemoveObject_(t);
      delete CG.bombs[t.oid];
    }
  }, {
    key: "Tick",
    value: function Tick(delta) {
      var t = this;

      if (G.Tick % 2 == 0) {
        G.spawnParticle(CG.fxFire1, {
          zIndex: 18,
          life: 20,
          pos: {
            x: t.pos.x - 30,
            y: t.pos.y
          },
          vel: {
            x: 0,
            y: Math.random() * -3
          }
        });
      }

      t.SetVel(3, t.vel.y);
    }
  }, {
    key: "CollideStart",
    value: function CollideStart(myType, objType, obj) {
      var t = this;
    }
  }, {
    key: "CollideEnd",
    value: function CollideEnd(myType, objType, obj) {
      var t = this;
    }
  }, {
    key: "OnRemove",
    value: function OnRemove() {}
  }]);

  return g_bomber;
}(Gobj);

if (typeof exports !== 'undefined') module.exports = g_bomber; //dude

var g_cam =
/*#__PURE__*/
function (_Gobj4) {
  _inherits(g_cam, _Gobj4);

  function g_cam(oid) {
    var _this7;

    _classCallCheck(this, g_cam);

    _this7 = _possibleConstructorReturn(this, _getPrototypeOf(g_cam).call(this, 'g_cam', G.Stage_, G.World_, oid));

    var t = _assertThisInitialized(_this7);

    return _this7;
  }

  _createClass(g_cam, [{
    key: "Init",
    value: function Init() {
      var t = this;
      t.color = 0xffffff;
      t.Part('body', G.Bod.rectangle(t.spos.x, t.spos.y, 2, 2, {
        isSensor: true,
        isStatic: true
      }));
      t.addG(t.body, 'bpart', {
        color: t.color,
        opacity: 0,
        lineWidth: 4,
        lineOpacity: 0
      }); //t.addG(t.body, 'bpart',G.circle(null, 10, {
      //zIndex: 1.5, color: t.color, opacity:0.2, lineWidth:4, lineOpacity:0.2
      //}));

      _get(_getPrototypeOf(g_cam.prototype), "Init", this).call(this);

      t.con.grav = 0;
    }
  }, {
    key: "Tick",
    value: function Tick(delta) {
      var t = this;
      var cenx = G.Stage_.pivot.x + 0.5 * (G.Width / G.Stage_.scale.x);
      var ceny = G.Stage_.pivot.y + 0.5 * (G.Height / G.Stage_.scale.x);
      var dx = t.pos.x - cenx;
      var dy = t.pos.y - (ceny + 0);
      var rate = 17; //t.centerOffset = {x: }

      G.Stage_.pivot.x += dx / rate;
      G.Stage_.pivot.y += dy / rate;
    }
  }, {
    key: "CollideStart",
    value: function CollideStart(myType, objType, obj) {
      var t = this;
    }
  }, {
    key: "CollideEnd",
    value: function CollideEnd(myType, objType, obj) {
      var t = this;
    }
  }, {
    key: "OnRemove",
    value: function OnRemove() {}
  }]);

  return g_cam;
}(Gobj);

if (typeof exports !== 'undefined') module.exports = g_cam; //dude

var g_church =
/*#__PURE__*/
function (_Gobj5) {
  _inherits(g_church, _Gobj5);

  function g_church(oid) {
    var _this8;

    _classCallCheck(this, g_church);

    _this8 = _possibleConstructorReturn(this, _getPrototypeOf(g_church).call(this, 'g_church', G.Stage_, G.World_, oid));

    var t = _assertThisInitialized(_this8);

    t.recruiting = false;
    return _this8;
  }

  _createClass(g_church, [{
    key: "Init",
    value: function Init() {
      var t = this;
      t.color = 0x0;
      t.w = 350;
      t.Part('body', G.Bod.rectangle(t.spos.x, t.spos.y, t.w, 300, {
        isStatic: true,
        isSensor: true
      }));
      t.Part('wall1', G.Bod.rectangle(20 + t.w / 2, 0, 70, 270, {
        isStatic: true
      }));
      t.Part('wall2', G.Bod.rectangle(-t.w / 2, 0, 25, 500, {
        isStatic: true
      }));
      t.addG(t.wall1, 'wall1', {
        zIndex: 3,
        color: t.color,
        opacity: 0
      });
      t.addG(t.wall2, 'wall2', {
        zIndex: 3,
        color: t.color,
        opacity: 0
      });
      var tex = G.texture(null, CG.textures.house, {});
      var ft = G.filterTex(EM.f2, 5, tex, {
        zIndex: 2
      });
      t.addG(t.body, 'house', G.texture(null, ft, {
        zIndex: 1.23
      }), 50, -180);
      t.body.grs.house.scale = {
        x: 2,
        y: 2
      };
      var gr = t.addG(t.body, 'bpart', {
        zIndex: 1.5,
        color: t.color,
        opacity: 0,
        lineOpacity: 0
      });
      t.addG(t.body, 'church', G.rect(null, 30, 30, 0, {
        zIndex: 2,
        color: t.color,
        opacity: 0
      }), 0, gr.height / 2 - 20);

      _get(_getPrototypeOf(g_church.prototype), "Init", this).call(this);

      t.con.isStatic = true;
    }
  }, {
    key: "Recruit",
    value: function Recruit(guy) {
      var t = this;
      t.recruiting = true;
      t.recruitEmote = guy.emote;
      t.recruitTwitch = guy.twitch;
      guy.health = 0;
      guy.CheckDeath(0, 100);
      CG.sxRecruit.play();
      t.lightup = true;
      clearTimeout(t.ttLight);
      t.ttLight = setTimeout(function () {
        t.lightup = false;
      }, 8000);
      clearTimeout(t.ttRecruit);
      t.ttRecruit = setTimeout(function () {
        t.lightup = false;
        t.recruiting = false;
        CG.archers.push({
          uid: G.UID_(),
          isNew: true,
          side: CG.archers.length % 2,
          lastFire: Date.now(),
          twitch: t.recruitTwitch,
          emote: t.recruitEmote
        });
      }, 15000); //15000
    }
  }, {
    key: "Tick",
    value: function Tick(delta) {
      var t = this;

      if (t.recruiting) {
        if (t.lightup && CG.fog.sources[1].power < 1900) CG.fog.sources[1].power += 6; //for(var i = 0; i < 2; i++){

        G.spawnParticle(CG.fxLight, {
          zIndex: 20,
          life: Math.random() * 100,
          pos: {
            x: -40 + Math.random() * 80 + t.pos.x,
            y: -10 + Math.random() * 20 + t.pos.y - 70
          },
          vel: {
            x: 0,
            y: Math.random() * -5
          }
        }); //}
      }
    }
  }, {
    key: "CollideStart",
    value: function CollideStart(myType, objType, obj) {
      var t = this;
    }
  }, {
    key: "CollideEnd",
    value: function CollideEnd(myType, objType, obj) {
      var t = this;
    }
  }, {
    key: "OnRemove",
    value: function OnRemove() {}
  }]);

  return g_church;
}(Gobj);

if (typeof exports !== 'undefined') module.exports = g_church; //dude

var g_fog =
/*#__PURE__*/
function (_Gobj6) {
  _inherits(g_fog, _Gobj6);

  function g_fog(oid) {
    var _this9;

    _classCallCheck(this, g_fog);

    _this9 = _possibleConstructorReturn(this, _getPrototypeOf(g_fog).call(this, 'g_fog', G.Stage_, G.World_, oid));

    var t = _assertThisInitialized(_this9);

    return _this9;
  }

  _createClass(g_fog, [{
    key: "Init",
    value: function Init() {
      var t = this;
      t.color = 0x0;
      t.squares = [];
      t.sources = [];
      t.Part('body', G.Bod.rectangle(t.spos.x, t.spos.y, 40, 40, {
        restitution: 0.5,
        inertia: Infinity,
        isStatic: true
      }));
      var size = t.fsize = 50;
      var w = Math.ceil(CG.w / size);
      var h = Math.ceil(CG.h / size);
      var pxGR = G.rect(null, size, size, 0, {
        color: 0x0,
        opacity: 1
      });
      var tex = G.Renderer_.generateTexture(pxGR, null, null, new PIXI.Rectangle(-25, -25, 50, 50));

      for (var i = 0; i < w; i++) {
        for (var j = 0; j < h; j++) {
          var g = t.addG(t.body, 'bpart' + i + '-' + j, G.texture(null, tex, {
            zIndex: 20
          }), 25 + i * size, 25 + j * size);
          t.squares.push(g);
        }
      }

      t.addG(t.body, 'bpart', {
        zIndex: 1.5,
        color: t.color
      });

      _get(_getPrototypeOf(g_fog.prototype), "Init", this).call(this);

      setTimeout(function () {
        t.sources = [//{ x: CG.mx, y: CG.my, power: 1000 },
        {
          x: CG.moon.pos.x + 70,
          y: CG.moon.pos.y - 40,
          power: 400
        }, {
          x: CG.wall.pos.x,
          y: CG.wall.pos.y,
          power: 1250
        }, {}];
      }, 500);
    }
  }, {
    key: "Tick",
    value: function Tick(delta) {
      var t = this;
      if (!t.sources.length > 0) return;
      if (CG.activeArrow != null) t.sources[2] = {
        x: CG.activeArrow.pos.x,
        y: CG.activeArrow.pos.y,
        power: 400
      };
      if (CG.activeArrow == null) t.sources[2] = {};
      if (!CG.church.lightup && t.sources.length > 0 && t.sources[1].power > 1250) t.sources[1].power -= 10;

      if (G.Tick % 2 == 0) {
        t.squares._each(function (p) {
          if (!p) return;
          var alpha = 1;

          for (var i = 0; i < t.sources.length; i++) {
            var src = t.sources[i];

            if (src.power) {
              var dist = Math.max(Math.abs(src.x - p.x), Math.abs(src.y - p.y));
              var a = dist / src.power;
              alpha = a < alpha ? a : alpha;
            }
          }

          p.alpha = alpha;
        });
      }
    }
  }, {
    key: "CollideStart",
    value: function CollideStart(myType, objType, obj) {
      var t = this;
    }
  }, {
    key: "CollideEnd",
    value: function CollideEnd(myType, objType, obj) {
      var t = this;
    }
  }, {
    key: "OnRemove",
    value: function OnRemove() {}
  }]);

  return g_fog;
}(Gobj);

if (typeof exports !== 'undefined') module.exports = g_fog; //dude

var g_guy =
/*#__PURE__*/
function (_Gobj7) {
  _inherits(g_guy, _Gobj7);

  function g_guy(oid) {
    var _this10;

    _classCallCheck(this, g_guy);

    _this10 = _possibleConstructorReturn(this, _getPrototypeOf(g_guy).call(this, 'g_guy', G.Stage_, G.World_, oid));

    var t = _assertThisInitialized(_this10);

    t.health = 100;
    t.dying = false;
    t.attack = 1;
    t.speed = 1.5 + Math.random() * 3;
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
    return _this10;
  }

  _createClass(g_guy, [{
    key: "Init",
    value: function Init() {
      var t = this;
      t.color = 0xff0000;
      if (!t.emote) t.emote = EM.textures['moon2DUMB'];
      var txtSettings = {
        fontSize: 20,
        strokeThickness: 4,
        fontWeight: 600,
        fill: 'white',
        zIndex: 5
      };
      t.w = 30 * t.myScale;
      t.h = 55 * t.myScale;
      t.Part('body', G.Bod.rectangle(t.spos.x, t.spos.y, t.w, t.h, {
        restitution: 0.5,
        inertia: Infinity,
        friction: 0.02
      }));

      if (t.hasBomb) {
        t.addG(t.body, 'bomb', G.texture(null, CG.textures.bomb, {
          zIndex: 1.5001 - t.plane * 0.01
        }));
        t.body.grs.bomb.scale = {
          x: 0.4,
          y: 0.4
        };
      }

      var l1 = t.l1 = t.addG(t.body, 'l1', G.texture(null, CG.leg, {
        zIndex: 1.5 - t.plane * 0.01
      }), 4, 0, 0, -20);
      var l2 = t.l2 = t.addG(t.body, 'l2', G.texture(null, CG.leg, {
        zIndex: 1.5 - t.plane * 0.01
      }), -4, 0, 0, -20);
      l1.scale = {
        x: t.myScale,
        y: t.myScale
      };
      l2.scale = {
        x: t.myScale,
        y: t.myScale
      };
      var arm = t.arm = t.addG(t.body, 'arm', G.texture(null, CG.leg, {
        zIndex: 1.5 - t.plane * 0.01
      }), -10, -20, 0, -20);
      arm.wa = 1.5;
      arm.scale = {
        x: t.myScale,
        y: t.myScale
      };
      arm.animate = {
        states: [[arm.wx, arm.wy, 1.5], [arm.wx, arm.wy, 2.5], [arm.wx, arm.wy, 1.5]],
        period: 20,
        repeat: true,
        active: false
      };
      l1.animate = {
        states: [[l1.wx, l1.wy, 0], [l1.wx, l1.wy, -1], [l1.wx, l1.wy, 0], [l1.wx, l1.wy, 1], [l1.wx, l1.wy, 0]],
        period: 80 / t.speed * t.myScale,
        repeat: true,
        active: true
      };
      l2.animate = {
        states: [[l2.wx, l2.wy, 0], [l2.wx, l2.wy, 1], [l2.wx, l2.wy, 0], [l2.wx, l2.wy, -1], [l2.wx, l2.wy, 0]],
        period: 80 / t.speed * t.myScale,
        repeat: true,
        active: true
      };

      if (t.emote) {
        t.addG(t.body, 'head', G.texture(null, t.emote, {
          zIndex: 1.5 - t.plane * 0.01
        }), 0, -20 * t.myScale);
        t.body.grs.head.scale = {
          x: t.myScale,
          y: t.myScale
        };
      }

      if (t.twitch && t.twitch.length > 0) {
        t.addG(t.body, 'msg', G.text(null, t.twitch, null, txtSettings), 0, -40 - t.body.grs.head.height / 2);
      }

      _get(_getPrototypeOf(g_guy.prototype), "Init", this).call(this);

      t.con.collisionFilter.category = G.cats[2];
      t.con.collisionFilter.mask = G.cats[t.plane] | G.cats[0] | G.cats[6];
      t.con.grav = 2;
    }
  }, {
    key: "DeathAnimation",
    value: function DeathAnimation(resetVel, vx, vy) {
      var t = this;
      if (resetVel) t.SetVel(0, 0);
      t.SetPos(t.pos.x, t.pos.y, -Math.PI / 2);
      t.arm.hidden = true;
      CG.sxSplat.play();
      if (!vx) vx = function vx() {
        return -10 + Math.random() * 20;
      };
      if (!vy) vy = function vy() {
        return -2 + Math.random() * 4;
      };
      ;

      for (var h = 0; h < 20; h++) {
        G.spawnParticle(CG.fxBlood, {
          life: 30,
          zIndex: 18,
          vel: {
            x: vx(),
            y: vy()
          },
          pos: {
            x: t.pos.x,
            y: t.pos.y
          }
        });
      }
    }
  }, {
    key: "FallDamage",
    value: function FallDamage() {
      var t = this;

      if (t.vel.y > 10) {
        var vel = Math.abs(t.vel.y) * 0.75;
        t.health -= vel * 5;
        t.CheckDeath(5);

        if (t.health <= 0) {
          t.DeathAnimation(true);
        }
      }
    }
  }, {
    key: "Flung",
    value: function Flung() {
      var t = this;
      var max = 50;
      var vx = (CG.mx - t.prevPos.x) * 0.3;
      var vy = (CG.my - t.prevPos.y) * 0.3;
      vy = Math.max(vy, -max);
      if (vx > max) vx = max;
      if (vx < -max) vx = -max;
      t.SetVel(vx, vy);
      t.flung = true;

      for (var i = 0; i < 6; i++) {
        G.TickFunc(G.Tick + i, function () {
          for (var h = 0; h < 2; h++) {
            G.spawnParticle(CG.fxFlung, {
              zIndex: 21,
              pos: {
                x: -8 + Math.random() * 16 + t.pos.x,
                y: t.pos.y
              }
            });
          }
        });
      }
    }
  }, {
    key: "CheckDeath",
    value: function CheckDeath() {
      var money = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 5;
      var when = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1000;
      var t = this;

      if (t.health <= 0 && !t.dying) {
        t.dying = true;
        setTimeout(function () {
          CG.score += 1;
          CG.money += money;
          G.RemoveObject_(t);
          delete CG.guys[t.oid];
        }, when);
      }
    }
  }, {
    key: "Clicked",
    value: function Clicked() {
      var t = this;
      t.health -= 30;
      t.clicked = true;
      t.SetVel(0, -5);
      t.CheckDeath(20);
      if (t.health <= 0) t.DeathAnimation();else CG.sxSplat2.play();
      setTimeout(function () {
        t.clicked = false;
      }, 1000);
    }
  }, {
    key: "Tick",
    value: function Tick(delta) {
      var t = this;
      t.prevPos = {
        x: t.pos.x,
        y: t.pos.y
      };
      t.l1.animate.active = false;
      t.l2.animate.active = false;
      t.arm.animate.active = false;

      if (t.pos.x > CG.w + 500 || t.pos.x < -500 || t.pos.y > 2000) {
        t.SetPos(t.spos.x, t.spos.y);
        t.SetVel(0, 0);
      }

      if (t.grabbed) {
        //t.SetVel(CG.mx - prevPos.x, CG.my - prevPos.y);
        t.SetVel(0, 0);
        t.SetPos(CG.mx, CG.my);
        t.arm.animate.active = true;
      }

      if (t.hasBomb && !t.dying) {
        if (G.Tick % 2 == 0) {
          G.spawnParticle(CG.fxFire1, {
            zIndex: 18,
            life: 20,
            pos: {
              x: t.pos.x + 30,
              y: t.pos.y
            },
            vel: {
              x: 0,
              y: Math.random() * -3
            }
          });
        }
      }

      if (!t.grabbed && !t.flung && !t.recruiting && !t.hit && !CG.moon.shot) {
        var nearWall = G.dist(t.pos, {
          x: CG.wall.pos.x,
          y: t.pos.y
        }) < 50;

        if (nearWall && G.Tick % 15 == 0) {
          if (t.hasBomb && !t.dying) {
            CG.sxExplode.play();
            CG.wall.health -= 50;
            t.health = 0;
            t.CheckDeath();
            t.DeathAnimation();

            for (var i = 0; i < 20; i++) {
              G.spawnParticle(CG.fxFire2, {
                zIndex: 18,
                life: 20,
                pos: {
                  x: t.pos.x,
                  y: t.pos.y - 20
                },
                vel: {
                  x: -8 + Math.random() * 16,
                  y: -8 + Math.random() * 16
                }
              });
            }
          } else {
            CG.wall.health -= t.attack;
            if (!CG.sxHit.sounds || CG.sxHit.sounds.length < 10) CG.sxHit.play();
          }
        }

        if (!nearWall && G.Tick % 30 == 0 && t.body.grs.msg && t.body.grs.msg.text != t.message && Math.random() > 0.7) {
          t.body.grs.msg.text = t.message;
          setTimeout(function () {
            t.body.grs.msg.text = t.twitch;
          }, 3000);
        }

        if (t.grounded && !nearWall && !t.dying && !t.clicked && !CG.moon.shot) {
          t.SetVel(-t.speed, t.vel.y);
          t.l1.animate.active = true;
          t.l2.animate.active = true;
        } else {
          t.arm.animate.active = true;
        }
      }

      if (t.health <= 0 && !t.dying) {
        t.CheckDeath();
      }
    }
  }, {
    key: "CollideStart",
    value: function CollideStart(myType, objType, obj) {
      var t = this;

      if (objType == 'terrain') {
        t.grounded++;
        t.flung = false;
        t.FallDamage();
      }

      if (obj.type == 'g_church' && objType == 'body' && !t.recruiting) {
        var canRecruit = t.canRecruit && !t.recruiting && !t.dying && !obj.recruiting;
        t.grabbed = false;
        if (canRecruit) obj.Recruit(t);else {
          setTimeout(function () {
            t.SetPos(t.spos.x, t.spos.y);
            t.SetVel(0, 0);
          }, 1000);
        }
      }
    }
  }, {
    key: "CollideEnd",
    value: function CollideEnd(myType, objType, obj) {
      var t = this;

      if (objType == 'terrain') {
        t.grounded--;
      }
    }
  }, {
    key: "OnRemove",
    value: function OnRemove() {}
  }]);

  return g_guy;
}(Gobj);

if (typeof exports !== 'undefined') module.exports = g_guy; //dude

var g_land =
/*#__PURE__*/
function (_Gobj8) {
  _inherits(g_land, _Gobj8);

  function g_land(oid) {
    var _this11;

    _classCallCheck(this, g_land);

    _this11 = _possibleConstructorReturn(this, _getPrototypeOf(g_land).call(this, 'g_land', G.Stage_, G.World_, oid));

    var t = _assertThisInitialized(_this11);

    t.pnts = [100, 0, 75, 50, 100, 100, 25, 100, 0, 50, 25, 0];
    return _this11;
  }

  _createClass(g_land, [{
    key: "Init",
    value: function Init() {
      var t = this;
      t.color = 0xffffff;
      t.verts = G.SafeVerts(t.pnts);
      t.Part('terrain', G.Bod.fromVertices(0, 0, t.verts, {
        isStatic: true,
        isSensor: t.plane == -1
      })); //for collision detection?

      t.terrain.parts._each(function (x) {
        x.oid = t.oid;
        x.type = 'terrain';
      });

      var off = {
        x: t.terrain.vertices._max(function (x) {
          return x.x;
        }).x - t.verts._max(function (x) {
          return x.x;
        }).x,
        y: t.terrain.vertices._max(function (x) {
          return x.y;
        }).y - t.verts._max(function (x) {
          return x.y;
        }).y
      };
      t.Offset(t.pnts, off.x, off.y);

      if (!G.IsServer) {
        if (t.plane == -1) {
          t.addG(t.terrain, 'rect', G.poly(null, t.pnts, {
            color: t.color,
            zIndex: 1.2,
            lineWidth: 5,
            alignment: 0,
            offx: 0,
            offy: 0,
            texture: CG.textures.grass
          }));
          t.addG(t.terrain, 'rect2', G.poly(null, t.pnts, {
            color: t.color,
            zIndex: 1.05,
            lineWidth: 5,
            lineOpacity: 0.7,
            alignment: 0,
            offx: 0,
            offy: 0,
            texture: CG.textures.grass,
            alpha: 0.5
          }), -CG.w / 2 + 300, -50);
          t.terrain.grs.rect2.scale.x = -1; //t.terrain.grs.rect2.tint = 0x0;
        }
      }

      _get(_getPrototypeOf(g_land.prototype), "Init", this).call(this, {
        isStatic: true
      });

      t.SetPos(t.pos.x - off.x, t.pos.y - off.y);
      t.con.collisionFilter.category = G.cats[t.plane];
    }
  }, {
    key: "Tick",
    value: function Tick(delta) {
      var t = this;
      t.Events();
    }
  }, {
    key: "Offset",
    value: function Offset(ar, dx, dy) {
      for (var i = 0; i < ar.length - 1; i += 2) {
        ar[i] += dx;
        ar[i + 1] += dy;
      }

      return ar;
    }
  }, {
    key: "Events",
    value: function Events() {
      var t = this;
    }
  }, {
    key: "CollideStart",
    value: function CollideStart(myType, objType, obj) {
      var t = this;
    }
  }, {
    key: "CollideEnd",
    value: function CollideEnd(myType, objType, obj) {
      var t = this;
    }
  }, {
    key: "OnRemove",
    value: function OnRemove() {}
  }]);

  return g_land;
}(Gobj);

if (typeof exports !== 'undefined') module.exports = g_land; //dude

var g_moon =
/*#__PURE__*/
function (_Gobj9) {
  _inherits(g_moon, _Gobj9);

  function g_moon(oid) {
    var _this12;

    _classCallCheck(this, g_moon);

    _this12 = _possibleConstructorReturn(this, _getPrototypeOf(g_moon).call(this, 'g_moon', G.Stage_, G.World_, oid));

    var t = _assertThisInitialized(_this12);

    return _this12;
  }

  _createClass(g_moon, [{
    key: "Init",
    value: function Init() {
      var t = this;
      t.color = 0xffffff;
      t.clouds = [];
      t.shot = false;
      t.Part('body', G.Bod.rectangle(t.spos.x, t.spos.y, 20, 20, {
        isStatic: true,
        isSensor: true
      }));
      var tex = G.texture(null, CG.textures.moon, {
        zIndex: 1.25
      });
      var ft = G.filterTex(EM.f3, 5, tex, {
        zIndex: 2
      });
      t.addG(t.body, 'house', G.texture(null, ft, {
        zIndex: 0.5
      }), 0, 0);
      t.body.grs.house.scale = {
        x: 1.3,
        y: 1.3
      };
      t.addG(t.body, 'house2', tex, 100, -250);
      t.body.grs.house2.zIndex = 0.5;
      t.body.grs.house2.scale = {
        x: 0.5,
        y: 0.5
      };
      t.body.grs.house2.wa = -0.2;
      t.addG(t.body, 'stars', G.rect(null, CG.w, 900, 1, {
        alpha: 0.5,
        zIndex: 0,
        texture: CG.textures.stars
      }), 300 + -CG.w / 2); //t.body.grs.stars.zIndex = 0.75;

      var cloud = t.addG(t.body, 'cloud1', G.rect(null, 400, 200, 1, {
        alpha: 0.2,
        texture: CG.textures.cloud
      }), -CG.w - 100);
      cloud.scale = {
        x: 2.5,
        y: 2
      };
      cloud.tspeed = 1;
      t.clouds.push(cloud);
      var cloud = t.addG(t.body, 'cloud2', G.rect(null, 400, 200, 1, {
        alpha: 0.2,
        texture: CG.textures.cloud
      }), -100 - CG.w / 4, -70);
      cloud.scale = {
        x: 2,
        y: 1.5
      };
      cloud.tspeed = 0.8;
      t.clouds.push(cloud);
      var cloud = t.addG(t.body, 'cloud3', G.rect(null, 400, 200, 1, {
        alpha: 0.2,
        texture: CG.textures.cloud
      }), -CG.w / 2, 80);
      cloud.scale = {
        x: 2.5,
        y: 2
      };
      cloud.tspeed = 1.4;
      t.clouds.push(cloud);
      var cloud = t.addG(t.body, 'witch', G.rect(null, 200, 200, 1, {
        zIndex: 0.7,
        alpha: 0.95,
        texture: CG.textures.witch
      }), 500, -50);
      cloud.scale = {
        x: -0.5,
        y: 0.5
      };
      cloud.tspeed = -2;
      t.clouds.push(cloud);
      var pnts = [1560, 300, 140, 520, 160, 620, 1560, 300];
      t.flare1 = t.addG(t.body, 'flare1', G.poly(null, pnts, {
        zIndex: 10,
        alpha: 0,
        offx: 0,
        offy: 0,
        color: 0xb7af91
      }), -t.spos.x, -t.spos.y);
      pnts = [140, 540, 1880, 1100, 620, 1100, 140, 620, 140, 540];
      t.flare2 = t.addG(t.body, 'flare2', G.poly(null, pnts, {
        zIndex: 10,
        alpha: 0,
        offx: 0,
        offy: 0,
        color: 0xb7af91
      }), -t.spos.x, -t.spos.y);
      t.emote = EM.textures['moon2M'];
      t.head = t.addG(t.body, 'head', G.texture(null, t.emote, {
        zIndex: 1.5,
        alpha: 0
      }), -50 + CG.church.spos.x - t.spos.x, -300 + CG.church.spos.y - t.spos.y);
      t.head.scale = {
        x: 0.8,
        y: 0.8
      };

      _get(_getPrototypeOf(g_moon.prototype), "Init", this).call(this);
    }
  }, {
    key: "Flare",
    value: function Flare() {
      var t = this;
      t.charging = true;
      t.flare1.alpha;
      CG.sxLaser.play();
      t.shot = false;
      t.head.alpha = 0.8;
      setTimeout(function () {
        setTimeout(function () {
          t.head.alpha = 0;
        }, 500);
        t.charging = false;
      }, 3000);
    }
  }, {
    key: "Shoot",
    value: function Shoot() {
      var t = this;
      t.shot = true;
      CG.sxLaserShot.play(); //each guy take damage

      CG.guys._each(function (g) {
        g.health -= 50;
        g.CheckDeath(1.5);
        if (g.health <= 0) g.DeathAnimation();
      });

      clearTimeout(t.ttTime);
      t.ttTime = setTimeout(function () {
        t.shot = false;
      }, 6000);
    }
  }, {
    key: "Tick",
    value: function Tick(delta) {
      var t = this;
      t.updated = true;
      if (t.charging && t.flare1.alpha < 0.5) t.flare1.alpha += 0.01;else if (t.charging && t.flare2.alpha < 0.5) {
        if (!t.shot) {
          t.Shoot();
          CG.fog.sources[1].power = 3500;
        }

        t.flare2.alpha += 0.05;
      }

      if (!t.charging) {
        t.flare1.alpha = 0;
        t.flare2.alpha = 0;
      }

      t.clouds._each(function (x) {
        x.wx += x.tspeed;

        if (x.wx < -CG.w - 200 && x.tspeed == -2) {
          x.wx = 500;
          x.wy = -200 + Math.random() * 200;
        } else if (x.wx > 500) {
          if (x.tspeed != 2) x.tspeed = 0.5 + Math.random() * 1;
          x.wx = -CG.w - 200;
          x.wy = -200 + Math.random() * 200;
        }
      });
    }
  }, {
    key: "CollideStart",
    value: function CollideStart(myType, objType, obj) {
      var t = this;
    }
  }, {
    key: "CollideEnd",
    value: function CollideEnd(myType, objType, obj) {
      var t = this;
    }
  }, {
    key: "OnRemove",
    value: function OnRemove() {}
  }]);

  return g_moon;
}(Gobj);

if (typeof exports !== 'undefined') module.exports = g_moon; //dude

var g_wall =
/*#__PURE__*/
function (_Gobj10) {
  _inherits(g_wall, _Gobj10);

  function g_wall(oid) {
    var _this13;

    _classCallCheck(this, g_wall);

    _this13 = _possibleConstructorReturn(this, _getPrototypeOf(g_wall).call(this, 'g_wall', G.Stage_, G.World_, oid));

    var t = _assertThisInitialized(_this13);

    t.health = 300;
    t.maxHealth = 300;
    return _this13;
  }

  _createClass(g_wall, [{
    key: "Init",
    value: function Init() {
      var t = this;
      t.color = 0x0;
      t.Part('body', G.Bod.rectangle(t.spos.x, t.spos.y, 60, 300, {
        restitution: 0.5,
        inertia: Infinity,
        isStatic: true,
        isSensor: true
      }));
      t.addG(t.body, 'bpart', {
        zIndex: 1.5,
        color: t.color,
        opacity: 0
      });

      _get(_getPrototypeOf(g_wall.prototype), "Init", this).call(this);
    }
  }, {
    key: "Tick",
    value: function Tick(delta) {
      var t = this;
    }
  }, {
    key: "CollideStart",
    value: function CollideStart(myType, objType, obj) {
      var t = this;
    }
  }, {
    key: "CollideEnd",
    value: function CollideEnd(myType, objType, obj) {
      var t = this;
    }
  }, {
    key: "OnRemove",
    value: function OnRemove() {}
  }]);

  return g_wall;
}(Gobj);

if (typeof exports !== 'undefined') module.exports = g_wall;
var CG = (_CG = {
  bombs: {},
  guys: {},
  archers: {},
  totalArchers: 0
}, _defineProperty(_CG, "archers", []), _defineProperty(_CG, "money", 0), _defineProperty(_CG, "roundTime", 60), _defineProperty(_CG, "startTime", 0), _defineProperty(_CG, "round", 0), _defineProperty(_CG, "score", 0), _defineProperty(_CG, "messages", [{
  twitch: 'test',
  msg: 'test message',
  emote: EM.textures['moon2DUMB']
}]), _defineProperty(_CG, "totalMessages", 0), _defineProperty(_CG, "Init", function Init() {
  CG.textures = {};
  CG.f1 = new PIXI.filters.GlowFilter(5, 5, 0, 0x0, 1);
  G.Loader_.add({
    name: 'wood',
    url: 'woodTile.jpg',
    crossOrigin: ''
  });
  G.Loader_.add('grass', 'grassTile.jpg');
  G.Loader_.add('house', 'house.png');
  G.Loader_.add('moon', 'moon.png');
  G.Loader_.add('arrow', 'arrow.png');
  G.Loader_.add('stars', 'stars.png');
  G.Loader_.add('cloud', 'cloud.png');
  G.Loader_.add('witch', 'witch.png');
  G.Loader_.add('bomb', 'bomb.png');
  G.Loader_.load(function (loader, res) {
    res._each(function (r) {
      r.texture.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT;
      r.texture.baseTexture.wrap = true;
      r.texture.baseTexture.update();
      CG.textures[r.name] = r.texture;
    });
  });
}), _defineProperty(_CG, "Continue", function Continue() {
  setTimeout(function () {
    CG.wall.health = CG.wall.maxHealth;
  }, 2000);
  CG.wall.health = CG.wall.maxHealth;
  M.Dad.refs.End.setState({
    ended: false
  });
}), _defineProperty(_CG, "StartGame", function StartGame() {
  var mh = $('.div-gcontainer').height(); // * (16 / 9);

  var mw = $('.div-gcontainer').width(); // * (9 / 16);

  if (mw / mh < 16 / 9) {
    G.Height = $('.div-gcontainer').width() * (9 / 16);
    G.Width = $('.div-gcontainer').width();
  } else {
    G.Height = $('.div-gcontainer').height();
    G.Width = $('.div-gcontainer').height() * (16 / 9);
  } //G.Height = $('.div-gcontainer').height();
  //G.Width = $('.div-gcontainer').width();// G.Height * (4/3); //


  CG.Scale = {
    x: 1,
    y: 1
  };
  CG.Scale.x = CG.Scale.y = G.Width / G.StartWidth_ * 1;
  M.Dad.refs.Start.setState({
    started: true
  });
  CG.InitGame();
  CG.tmi = new tmi.Client({
    connection: {
      secure: true,
      reconnect: true
    },
    channels: ['moonmoon']
  });
  CG.tmi.connect();
  CG.tmi.on('message', function (channel, tags, msg, self) {
    if (CG.totalMessages < 5 && msg.length < 50) {
      var words = msg.split(' ');
      CG.totalMessages++;

      for (var i = 0; i < words.length; i++) {
        var word = words[i];

        if (EM.textures[word]) {
          CG.messages._queue({
            twitch: tags.subscriber ? '🌙 ' + tags.username : tags.username,
            text: msg.replace(word, ''),
            emote: EM.textures[word],
            guy: null
          }, 15);

          break;
        }
      }
    }
  });
  EM.GetEmotes(function () {
    CG.music = new Howl({
      src: ['well.mp3'],
      loop: false,
      volume: 0.3
    });
    CG.sxSplat = new Howl({
      src: ['splat.ogg'],
      loop: false,
      volume: 0.3
    });
    CG.sxSplat2 = new Howl({
      src: ['splat.ogg'],
      loop: false,
      volume: 0.15
    });
    CG.sxRepair = new Howl({
      src: ['repair.wav'],
      loop: false,
      volume: 1
    });
    CG.sxRecruit = new Howl({
      src: ['recruit.flac'],
      loop: false,
      volume: 0.1
    });
    CG.sxExplode = new Howl({
      src: ['explode.mp3'],
      loop: false,
      volume: 0.1
    });
    CG.sxIntro = new Howl({
      src: ['heart.wav'],
      loop: false,
      volume: 0.4
    });
    CG.sxHit = new Howl({
      src: ['hit.wav'],
      loop: false,
      volume: 0.05
    });
    CG.sxLaserShot = new Howl({
      src: ['laserShot.wav'],
      loop: false,
      volume: 0.2
    });
    CG.sxGong = new Howl({
      src: ['gong.wav'],
      loop: false,
      volume: 0.45
    });
    CG.sxLaser = new Howl({
      src: ['351807__plasterbrain__laser-charging (1) - Copy.ogg'],
      loop: false,
      volume: 0.2,
      rate: 2
    });
    var gr = G.rect(null, 12, 40, 5, {
      color: 0x21212b,
      lineWidth: 2
    });
    CG.leg = G.Renderer_.generateTexture(gr, null, null, new PIXI.Rectangle(-gr.width / 2, -gr.height / 2, gr.width, gr.height));
    gr = G.rect(null, 50, 30, 5, {
      lineWidth: 3,
      color: 0xff0000
    });
    CG.bomb = G.Renderer_.generateTexture(gr, null, null, new PIXI.Rectangle(-gr.width / 2, -gr.height / 2, gr.width, gr.height));
    CG.fxFlung = G.circle(null, 8, {
      color: 0x5c5b79,
      opacity: 0.5
    });
    CG.fxBlood = G.circle(null, 8, {
      color: 0xff0000,
      opacity: 0.8
    });
    CG.fxLight = G.circle(null, 5, {
      color: 0xffffff,
      opacity: 0.6
    });
    CG.fxFire1 = G.circle(null, 5, {
      color: 0xffb52e,
      opacity: 0.7
    });
    CG.fxFire2 = G.circle(null, 15, {
      color: 0xffb52e,
      opacity: 0.7
    });
    CG.CreateObjs();
    CG.StartRound();
    console.log('done getting emotes');
  });
}), _defineProperty(_CG, "InitGame", function InitGame() {
  G.Init_($('.div-game'), function () {
    CG.Events(); //CG.CreateObjs();

    $('canvas').attr('oncontextmenu', 'return false;');
    G.Stage_.scale = CG.Scale;
  });
}), _defineProperty(_CG, "CreateObjs", function CreateObjs() {
  var w = CG.w = G.Width / CG.Scale.x;
  var h = CG.h = G.Height / CG.Scale.x;
  CG.cam = G.InitAndLoad(null, 'g_cam', {
    spos: {
      x: w / 2,
      y: h / 2
    }
  });
  CG.wall = G.InitAndLoad(null, 'g_wall', {
    spos: {
      x: 480,
      y: h - 150
    }
  });
  CG.church = G.InitAndLoad(null, 'g_church', {
    spos: {
      x: 200,
      y: h - 200
    }
  });
  CG.archer = G.InitAndLoad(null, 'g_archer', {
    side: 0,
    spos: {
      x: 350,
      y: h - 420
    }
  });
  CG.archer2 = G.InitAndLoad(null, 'g_archer', {
    side: 1,
    spos: {
      x: 500,
      y: h - 450
    }
  });
  CG.fog = G.InitAndLoad(null, 'g_fog', {
    spos: {
      x: 0,
      y: 0
    }
  });
  CG.moon = G.InitAndLoad(null, 'g_moon', {
    spos: {
      x: w - 300,
      y: 300
    }
  });
  var pad = 50;
  w += 200;
  CG.floor3 = G.InitAndLoad('land-1', 'g_land', {
    plane: 3,
    pnts: [0, h - 50, w, h - 50, w, h + 20, 0, h + 20]
  });
  CG.floor4 = G.InitAndLoad('land-2', 'g_land', {
    plane: 4,
    pnts: [0, -pad + h - 50, w, -pad + h - 50, w, -pad + h + 20, 0, -pad + h + 20]
  });
  CG.floor5 = G.InitAndLoad('land-3', 'g_land', {
    plane: 5,
    pnts: [0, -pad * 2 + h - 50, w, -pad * 2 + h - 50, w, -pad * 2 + h + 200, 0, -pad * 2 + h + 200]
  });
  CG.floorGrass = G.InitAndLoad('land-grass', 'g_land', {
    plane: -1,
    pnts: [2080, 780, 1900, 900, 1680, 940, 1320, 980, 1020, 980, 760, 920, 600, 920, 200, 960, -0, 960, -0, 1240, 1940, 1220, 2080, 780]
  });
  CG.floorGrass.pos.y -= 100;
}), _defineProperty(_CG, "Flare", function Flare() {
  if (CG.money >= 100) {
    CG.money -= 100;
    CG.moon.Flare();
  }
}), _defineProperty(_CG, "Bomb", function Bomb() {
  //create bomber guy
  //onclick the guy explodes or just times out
  var archer = CG.archer.archer == null ? CG.archer2 : CG.archer;

  if (CG.money >= 50 && archer.archer != null) {
    CG.money -= 50;
    var twitch = archer.archer.twitch;
    var emote = archer.archer.emote;
    var bomb = G.InitAndLoad(null, 'g_bomber', {
      twitch: twitch,
      emote: emote,
      plane: 3,
      spos: {
        x: CG.wall.pos.x + 50,
        y: CG.h - 140
      }
    });
    var removeIndex = null;

    for (var i = 0; i < CG.archers.length; i++) {
      if (CG.archers[i].uid == archer.archer.uid) removeIndex = i;
    }

    if (removeIndex != null) CG.archers.splice(removeIndex, 1);
    archer.archer = null;
    CG.bombs[bomb.oid] = bomb;
  }
}), _defineProperty(_CG, "Repair", function Repair(amount) {
  var dmg = CG.wall.maxHealth - CG.wall.health;
  var heal = Math.min(CG.money, dmg, amount);

  if (heal > 0) {
    CG.sxRepair.play();
    CG.wall.health += heal;
    CG.money -= heal;
  }
}), _defineProperty(_CG, "StartRound", function StartRound() {
  CG.music.stop();
  CG.music.play();
  CG.startTime = Date.now();
  CG.money -= CG.archer.upkeep * CG.archers.length;
  CG.round++;
  CG.sxIntro.play();
  CG.SpawnGuy();
  setTimeout(function () {
    CG.SpawnGuy();
  }, 1500);
  clearInterval(CG.ttGame);
  CG.ttGame = setInterval(function () {
    if (CG.wall) {
      CG.timer = 60 - (Date.now() - CG.startTime) / 1000;

      if (CG.timer <= 0) {
        CG.timer = 0;

        if (CG.LastTime != 0) {
          //CG.music.stop()
          setTimeout(function () {
            CG.sxGong.play();
          }, 400);
        }
      } else {
        //200 -> 180
        var diff = 50;

        if ((30 + CG.round) * Math.random() > 25) {
          CG.SpawnGuy();
        }
      }

      if (CG.wall.health <= 0) {
        //kill all guys
        CG.guys._each(function (g) {
          g.health = 0;
          g.CheckDeath(2.5);
        });

        M.Dad.refs.End.setState({
          ended: true
        });
      }

      M.Dad.refs.UI.setState({
        health: CG.wall.health
      });
      CG.LastTime = CG.timer;
    }

    CG.totalMessages = 0;
  }, 500);
}), _defineProperty(_CG, "SpawnGuy", function SpawnGuy() {
  var t = this;
  var spawnChat = UT.List(CG.guys).length % 2 == 0;

  var msg = CG.messages._first(function (x) {
    return !x.used;
  });

  var myScale = 1;
  var health = 100;
  var hasBomb = false;
  var speed = 2;
  var attack = 1;
  var s1 = Math.min(4, CG.round * 0.5);
  speed = Math.min(6, s1 + Math.random() * 4);
  if (!spawnChat) msg = null;

  if (spawnChat && msg == null) {
    msg = {
      twitch: '',
      text: '...',
      emote: EM.textures['moon2N']
    };
  }

  if (CG.round > 1 && (30 + CG.round) * Math.random() > 27) {
    if (CG.round > 2 && Math.random() > 0.5) {
      myScale = 2;
      health = 400;
      speed = 1.5;
      attack = 5;
    } else {
      speed = 6;
      hasBomb = true;
    }
  }

  var guy = G.InitAndLoad(null, 'g_guy', {
    canRecruit: msg != null,
    plane: 2 + Math.ceil(Math.random() * 3),
    spos: {
      x: CG.w - 50,
      y: CG.h - 140
    },
    twitch: msg ? msg.twitch : '',
    message: msg ? msg.text : 'mmrr..',
    emote: msg ? msg.emote : EM.textures['moon2DUMB'],
    myScale: myScale,
    health: health,
    speed: speed,
    hasBomb: hasBomb,
    attack: attack
  });

  if (msg) {
    msg.guy = guy;
    msg.used = true;
  }

  CG.guys[guy.oid] = guy;
}), _defineProperty(_CG, "Click", function Click(isDown) {
  var guys = UT.List(CG.guys);
  var bombs = UT.List(CG.bombs);
  var doBreak = false;

  for (var i = 0; i < bombs.length; i++) {
    var bomb = bombs[i];
    var dist = G.dist({
      x: CG.mx,
      y: CG.my
    }, bomb.pos);

    if (isDown && dist < 50) {
      bomb.Explode();
      doBreak = true;
    }
  }

  if (doBreak) return;

  for (var i = 0; i < guys.length; i++) {
    var guy = guys[i];
    var dist = G.dist({
      x: CG.mx,
      y: CG.my
    }, guy.pos);

    if (isDown && dist < 50) {
      if (guy.myScale == 2) {
        if (!guy.clicked) {
          guy.Clicked();
          break;
        }
      } else {
        guy.grabbed = true;
        break;
      }
    }

    if (!isDown && guy.grabbed) {
      guy.Flung();
      guy.grabbed = false;
    }
  }
}), _defineProperty(_CG, "Events", function Events() {
  /*
  $(document)._onoff('keydown', function (e, t, a) {
      var key = CG.GetKey(e);
      CG.guy[key] = true;
    })._onoff('keyup', function (e) {
      var key = CG.GetKey(e);
      CG.guy[key] = false;
  });*/
  $('canvas')._onoff('touchmove mousemove', function (e) {
    CG.UpdatePointer(e);
  });

  $('canvas')._onoff('mousedown touchstart', function (e) {
    CG.UpdatePointer(e);
    CG.mouse1 = {
      x: CG.mx,
      y: CG.my
    };
    CG.Click(true);
  });

  $('canvas')._onoff('mouseup touchstart', function (e) {
    CG.UpdatePointer(e);
    CG.mouse1 = null;
    CG.Click(false);
  });
}), _defineProperty(_CG, "GetKey", function GetKey(e) {
  var key = null;
  if (e.keyCode == 32) key = 'KeySpace';
  if (e.keyCode == 87) key = 'KeyUp';
  if (e.keyCode == 65) key = 'KeyLeft';
  if (e.keyCode == 83) key = 'KeyDown';
  if (e.keyCode == 68) key = 'KeyRight';
  if (e.keyCode == 69) key = 'KeyE';
  return key;
}), _defineProperty(_CG, "UpdatePointer", function UpdatePointer(e) {
  var ev = e;
  if (e.type.indexOf('touch') >= 0) ev = e.originalEvent.touches[0];
  CG.mx = (ev.pageX - $(G.con).offset().left) / G.Stage_.scale.x + G.Stage_.pivot.x;
  CG.my = (ev.pageY - $(G.con).offset().top) / G.Stage_.scale.y + G.Stage_.pivot.y;
}), _CG);

var Start =
/*#__PURE__*/
function (_React$Component4) {
  _inherits(Start, _React$Component4);

  function Start() {
    var _this14;

    _classCallCheck(this, Start);

    _this14 = _possibleConstructorReturn(this, _getPrototypeOf(Start).call(this));

    var t = _assertThisInitialized(_this14);

    t.state = {
      started: false
    };
    return _this14;
  }

  _createClass(Start, [{
    key: "render",
    value: function render() {
      var t = this;
      if (t.state.started) return null;
      return React.createElement("div", {
        className: "Start"
      }, React.createElement("div", {
        className: "div-title"
      }, "Zombie Chat Defense"), React.createElement("div", {
        className: "div-title-2"
      }, "I made this game :)"), React.createElement("div", {
        className: "div-tut"
      }, React.createElement("div", {
        className: "div-t-left"
      }, React.createElement("img", {
        src: "tut1.gif",
        height: "200"
      }), React.createElement("img", {
        src: "tut3.gif",
        height: "200"
      })), React.createElement("div", {
        "class": "div-center"
      }, React.createElement("li", null, "Fling Zombies vertically into the air with your mouse"), React.createElement("li", null, "Save Chat-Zombies by dragging them into the Castle. Use them as archers or bombers"), React.createElement("li", null, "Click on Chat Bombers to blow them up"), React.createElement("li", null, "Chatters will show up in game when they use MoonMoon emotes"), React.createElement("div", {
        onClick: function onClick() {
          CG.StartGame();
        },
        className: "btn div-play"
      }, "Start Game")), React.createElement("div", null, React.createElement("img", {
        src: "tut2.gif",
        width: "300"
      }))));
    }
  }]);

  return Start;
}(React.Component);

var Stats =
/*#__PURE__*/
function (_React$Component5) {
  _inherits(Stats, _React$Component5);

  function Stats() {
    var _this15;

    _classCallCheck(this, Stats);

    _this15 = _possibleConstructorReturn(this, _getPrototypeOf(Stats).call(this));

    var t = _assertThisInitialized(_this15);

    t.state = {
      FPS: 0,
      Cycle: 0,
      Ping: 0,
      Acc: 0
    };
    return _this15;
  }

  _createClass(Stats, [{
    key: "render",
    value: function render() {
      var t = this;
      return React.createElement("div", {
        className: "Stats",
        style: this.state.style
      }, React.createElement("div", null, "FPS: ", t.state.FPS), React.createElement("div", null, "PING: ", t.state.Ping), React.createElement("div", null, "Cycle: ", t.state.Cycle), React.createElement("div", null, "Acc: ", t.state.Acc));
    }
  }]);

  return Stats;
}(React.Component);

var UI =
/*#__PURE__*/
function (_React$Component6) {
  _inherits(UI, _React$Component6);

  function UI() {
    var _this16;

    _classCallCheck(this, UI);

    _this16 = _possibleConstructorReturn(this, _getPrototypeOf(UI).call(this));

    var t = _assertThisInitialized(_this16);

    t.state = {};
    return _this16;
  }

  _createClass(UI, [{
    key: "render",
    value: function render() {
      var t = this;

      if (CG.wall != null) {
        var health = 100 * (CG.wall.health / CG.wall.maxHealth);
        var upKeep = CG.archer.upkeep * CG.archers.length;
        var time = CG.timer;
        var over = CG.timer <= 0 ? 'active' : '';
        return React.createElement("div", {
          className: "UI",
          style: this.state.style
        }, React.createElement("div", {
          className: "div-health-top"
        }, React.createElement("div", {
          className: "div-health",
          style: {
            width: health + '%'
          }
        }), React.createElement("div", {
          "class": "div-text"
        }, CG.wall.health)), React.createElement("div", null, "Round: ", CG.round), React.createElement("div", null, "Money: $", CG.money), React.createElement("div", null, "Upkeep: $", upKeep), React.createElement("div", null, "Time: ", time.toFixed(0)), React.createElement("div", {
          onClick: function onClick() {
            CG.StartRound();
          },
          className: 'btn div-start ' + over,
          "class": "btn div-start"
        }, "Next Round"), React.createElement("div", null, "Score: ", CG.score), React.createElement("div", {
          className: "div-repair btn",
          onClick: function onClick() {
            CG.Repair(20);
          }
        }, "Repair $20"), React.createElement("div", {
          className: "div-bomb btn",
          onClick: function onClick() {
            CG.Bomb();
          }
        }, "Chat Bomber $50"), React.createElement("div", {
          className: "div-solar btn",
          onClick: function onClick() {
            CG.Flare();
          }
        }, "Moon Flare $100"));
      } else return React.createElement("div", {
        className: "UI",
        style: this.state.style
      });
    }
  }]);

  return UI;
}(React.Component);