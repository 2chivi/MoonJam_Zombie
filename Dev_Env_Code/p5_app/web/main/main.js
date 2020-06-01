

$(function(){
    UT.Extensions();
    M.Init();
    M.Dad = ReactDOM.render(<Dad />, document.getElementById('root'));
});

var M = {

    Init: function(){
        if(!M.ModMode){
            setTimeout(function () {
                CG.Init();
            }, 200);
        }
    },
}

