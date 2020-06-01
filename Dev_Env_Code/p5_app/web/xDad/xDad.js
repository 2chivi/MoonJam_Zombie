
class Dad extends React.Component {

    constructor(){ 
        super();
        this.state = {
        };
    }

    render(){
        var t= this;

        return <div className='dad'>
            
            <div className='div-gcontainer'>
                <div className='div-game'></div>
            </div>

            <End ref='End' />
            <Start ref='Start'/>
            <UI ref='UI' />
        </div>
    }
}