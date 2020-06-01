
class DD extends React.Component {

    constructor(props) {
        super();
        var t = this;
        t.state = {};
        t.state.data = props.data ? props.data : [];
        t.state.val = t.state.data[0];
    }

    OnChange(e){
        var t = this;
        var i = $(e.target).find('option:selected').attr('index');
        t.state.val = t.state.data[i];
        if(t.props.onChange)
            t.props.onChange(t.state.data[i], t);
    }

    render() {
        var t = this;
        var ops = [];
        if(!t.state.val && t.state.data && t.state.data[0] != null){
            t.state.val = t.state.data[0];
            if (t.props.onChange)
                t.props.onChange(t.state.data[0], t);
        }

        for(var i = 0; i < t.state.data.length; i++){
            var x = t.state.data[i];
            var currVal = typeof (t.state.val) == 'object' ? t.state.val[t.props.valueType] : t.state.val;
            var val = typeof(x) == 'object' ? x[t.props.valueType] : x;
            var name = typeof (x) == 'object' ? x[t.props.nameType] : x;
            var select = currVal == val;

            if(select)
                ops.push(<option selected='true' index={i} value={val}>{name}</option>);
            else
                ops.push(<option index={i} value={val}>{name}</option>);
        }

        return <select className='div-dd' onChange={(e)=> t.OnChange(e)}>{ops}</select>;
    }
}