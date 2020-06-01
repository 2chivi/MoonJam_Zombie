
class Stats extends React.Component {

    constructor() {
        super();
        var t = this;
        t.state = {
            FPS: 0, Cycle: 0, Ping: 0, Acc: 0
        };
    }

    render() {
        var t = this;

        return <div className='Stats' style={this.state.style}>

            <div>FPS: {t.state.FPS}</div>
            <div>PING: {t.state.Ping}</div>
            <div>Cycle: {t.state.Cycle}</div>
            <div>Acc: {t.state.Acc}</div>

        </div>
    }
}