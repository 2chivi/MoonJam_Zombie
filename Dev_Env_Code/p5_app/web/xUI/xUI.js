
class UI extends React.Component {

    constructor() {
        super();
        var t = this;
        t.state = {

        };
    }

    render() {
        var t = this;

        if(CG.wall != null){
            var health = 100 * (CG.wall.health / CG.wall.maxHealth);

            var upKeep = CG.archer.upkeep * CG.archers.length;
            var time = CG.timer;
            var over = CG.timer <= 0 ? 'active' : '';


            return <div className='UI' style={this.state.style}>

                <div className='div-health-top'>
                    <div className='div-health' style={{ width: health + '%' }}></div>
                    <div class='div-text'>{CG.wall.health}</div>
                </div>
                <div>Round: {CG.round}</div>
                <div>Money: ${CG.money}</div>
                <div>Upkeep: ${upKeep}</div>
                <div>Time: {time.toFixed(0)}</div>
                <div onClick={() => { CG.StartRound(); }} className={'btn div-start ' + over} class='btn div-start'>Next Round</div>

                <div>Score: {CG.score}</div>
                <div className='div-repair btn' onClick={() => { CG.Repair(20); }}>Repair $20</div>
                <div className='div-bomb btn' onClick={() => { CG.Bomb(); }}>Chat Bomber $50</div>
                <div className='div-solar btn' onClick={() => { CG.Flare(); }}>Moon Flare $100</div>
            </div>
        }else
            return <div className='UI' style={this.state.style}></div>    
    }
}