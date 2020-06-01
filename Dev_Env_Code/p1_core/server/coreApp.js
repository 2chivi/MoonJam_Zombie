
fs = require('fs');
glob = require('glob');
path = require('path');

UT = require('./ut');
UT.Extensions();
analy = require('./analy');
App = {};

var express = require('express');
var app = express();
var controllers = [];

var server = require('http').Server(app);
var io = require('socket.io').listen(server, {
    maxHttpBufferSize: 20e7,
    pingTimeout: 15000,
    upgradeTimeout: 15000
});

var babel = require('@babel/core');//+need babel-preset-env
var mongo = require('mongodb');
var uglify = require('uglify-es');
mongoc = mongo.MongoClient;
dbstring = 'mongodb://localhost:27017/mydb';
var vnum = Math.floor(Math.random() * 1000);

var dal = require('./dal');
MAIN = { html: "", css: "", js: "" };
LANDING = { html: "", css: "", js: "" };

io.on('connection', function (req) {
    req.on('any', function (method, key, args) {
        analy.totalRequests++;
        dal.Connect(mongoc, dbstring, function () {

            controllers._each(x=> {
                if(x && x[method])
                    x[method](req, dal, key, args, function () { });
            });

        });
    });
});

function PageRequest(req, res){
    PageLoad(req, function (data) {
        var html = "<script>loadData = " + JSON.stringify(data) + ";</script>";
        html += LANDING.html.length > 0 ? LANDING.html : MAIN.html;

        res.set('Content-Type', 'text/html');
        res.send(new Buffer(html));
        analy.pageRequests++;
        analy.totalRequests++;
    });
}

app.get('/port/*', function (req, res) {
    PageRequest(req, res);
});
app.get('/', function (req, res) {
    PageRequest(req, res);
});

server.listen(PORT, '0.0.0.0', function () {

    var readyFunc = function(){
        SiteMapper();
        dal.ObjID = mongo.ObjectID;
        console.log('listening');
        if (App.OnLoad)
            App.OnLoad(dal);
    };

    FindDirs(function(dirs){
        var hasLanding = dirs._any(x=> x == 'p4_landing');

        CompilePage('p4_landing', dirs, function(){
            if (hasLanding)
                dirs.splice(dirs.indexOf('p4_landing'), 1);

            WriteCompiled('landing', LANDING, function(data){
                LANDING = data;
                if(hasLanding) readyFunc();
                
                for(var i = 0; i < dirs.length; i++){
                    CompilePage(dirs[i], dirs, function (dir) {
                        if (dir == dirs[dirs.length-1]) {
                            WriteCompiled('index', MAIN, function () {
                                if (!hasLanding) readyFunc();
                            });
                        }
                    });
                }
            });
        });
    });

    //output file
    if(PublishMode){
        fs.writeFile('output.log', '', function(){ })
        var access = fs.createWriteStream('output.log');
        process.stdout.write = process.stderr.write = access.write.bind(access);
        process.on('uncaughtException', function (err) {
            console.error((err && err.stack) ? err.stack : err);
        });
    }
});

function FindDirs(done){
    var dirs = [];

    glob(__dirname + '/../../*', function (er, files) {
        files._each(x => {
            var hier = x.split('/');
            var nme = hier[hier.length - 1];

            if (nme.indexOf('.') < 0 && nme.indexOf('node_modules') < 0)
                dirs.push(nme);
        });

        dirs._each(x => {
            app.use('/', express.static(__dirname + '/../../' + x + '/res'));
            controllers.push(require(GPATH + '/' + x + '/server/controller'));
        });
        done(dirs);
    });
}

//Custom Pre Loaded Data per Site
function PageLoad(req, done) {
    var q = req.query;
    done({PORT});
}

//populate dynamic pages
function SiteMapper() {
}


function Compile(location, includeUtil, done) {
    var pg = {
        html: "", js: "", css: ""
    };

    glob(location, function (er, files) {
        for (var i = 0; i < files.length; i++) {
            var file = files[i];

            if (file.indexOf("main.html") > -1)
                pg.html += fs.readFileSync(file, 'utf-8').replace('</html>', '');
            if (file.indexOf(".js") > -1 && file.indexOf('.json') <= -1) {
                var tempjs = fs.readFileSync(file, 'utf-8');
                pg.js += tempjs ? tempjs : "";
            }
            if (file.indexOf(".css") > -1) {
                var tempcss = fs.readFileSync(file, 'utf-8');
                pg.css += tempcss ? tempcss : "";
            }
        }

        pg.html += "</html>";
        pg.html = pg.html.replace('_vn_', vnum);
        pg.js = babel.transform(pg.js, { presets: ["@babel/env", "@babel/react"] }).code;

        pg.js = "/* ======== No Steal Code (>.>) Twelve47Kevin@gmail.com ======== */ \n" + pg.js;
        done(pg, location);
    });
}

function WriteCompiled(filename, targ, done){
    var api = fs.readFileSync(__dirname + '/api.js', 'utf-8');
    var ut = fs.readFileSync(__dirname + '/ut.js', 'utf-8');
    var util = fs.readFileSync(__dirname + '/util.js', 'utf-8');
    targ.js = api + ut + util + targ.js;

    if (PublishMode) {
        targ.js = uglify.minify(targ.js, {
            mangle: { properties: { regex: /_$/ } }
        }).code;
    }

    fs.writeFile(__dirname + '/../res/' + filename + '.html', targ.html, function () {
        fs.writeFile(__dirname + '/../res/' + filename + '.css', targ.css, function () {
            fs.writeFile(__dirname + '/../res/' + filename + '.js', targ.js, function () {
                console.log(filename + ' compiled');
                done(targ);
            });
        });
    });
}

// Auto creates index.html from main.html.  <web> tags are broken down.
function CompilePage(dir, dirs, done) {
    if (!dirs._any(x => x == dir))
        return done();

    var location = __dirname + "/../../" + dir +  "/web/**/*";
    var isLanding = dir == 'p4_landing';
    var includeUtils = dir == 'p1_core' || isLanding;
    var targ = isLanding ? LANDING : MAIN;


    Compile(location, includeUtils, function(page, name){
        targ.html += page.html;
        targ.css += page.css;
        targ.js += page.js;
        done(dir);
    });
}