
class Start extends React.Component {

    constructor() {
        super();
        var t = this;
        t.state = {
            started: false
        };
    }

    render() {
        var t = this;

        if(t.state.started)
            return null;

        return <div className='Start'>
            <div className='div-title'>Zombie Chat Defense</div>
            <div className='div-title-2'>I made this game :)</div>

            <div className='div-tut'>
                <div className='div-t-left'>
                    <img src='tut1.gif' height='200' />
                    <img src='tut3.gif' height='200' />
                </div>
                
                <div class='div-center'>
                    <li>Fling Zombies vertically into the air with your mouse</li>
                    <li>Save Chat-Zombies by dragging them into the Castle. Use them as archers or bombers</li>
                    <li>Click on Chat Bombers to blow them up</li>
                    <li>Chatters will show up in game when they use MoonMoon emotes</li>

                    <div onClick={() => { CG.StartGame(); }} className='btn div-play'>Start Game</div>
                </div>
                <div>
                    <img src='tut2.gif' width='300' />
                </div>
            </div>

            
        </div>
    }
}