
class End extends React.Component {

    constructor() {
        super();
        var t = this;
        t.state = {
            ended: false
        };
    }

    render() {
        var t = this;

        if (!t.state.ended)
            return null;

        return <div className='End'>
            <div className='div-title'>The Castle has Fallen</div>
            <div className='div-title-2'>Score: {CG.score}</div>

            
            <div className='div-credits'>
                <div className='div-title-2'>Credits</div>
                <div>- Programming / Art / Design: <b>Skivvy</b> (Twelve47Studios.com) </div>
                <div>- Inspired By an old Web-Game: "Defend your Castle" </div>
                <div>- Music : https://www.free-stock-music.com/purrple-cat-wishing-well.html  (Purrple Cat)</div>
                <div>- Texture : http://texturelib.com/license/ (Dmitriy Chugai)</div>
                <div>- Sounds : https://freesound.org/ (bubaproducer) (plasterbrain) (InspectorJ) (gprosser) (kretopi) (InspectorJ) (cydon) (YourFriendJesse)</div>
            </div>

            <div>
                <div onClick={() => { location.reload(); }} className='btn div-restart'>Restart</div>
                <div onClick={() => { CG.Continue(); }} className='btn div-continue'>Continue? (noob)</div>
            </div>


        </div>
    }
}