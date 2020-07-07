import * as React from "react";
import {ListGroup, ListGroupItem} from "react-bootstrap";


export class PlayerElement extends React.Component {
    componentDidMount() {

    }

    logState() {
        console.log(this.state);
    }

    render(){
        return(
            <tr>
                <th>{this.props.index}</th>
                <th>{this.props.player.name}</th>
                <th>{this.props.player.standard_elo === 'Notrated' ? "" : this.props.player.standard_elo}</th>
                <th>{this.props.player.rapid_elo === 'Notrated' ? "" : this.props.player.rapid_elo}</th>
                <th>{this.props.player.blitz_elo === 'Notrated' ? "" : this.props.player.blitz_elo}</th>
            </tr>
        )
    }
}