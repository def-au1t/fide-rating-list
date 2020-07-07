import * as React from "react";
import {ListGroup, ListGroupItem, Table} from "react-bootstrap";
import {PlayerElement} from "./PlayerElement";


export class RatingList extends React.Component {
    state = {
        players: [],
        date: ""
    };

    componentDidMount() {
        fetch("/rating-list")
            .then(res => res.json())
            .then(json => {
                this.setState({players: json});
                this.setState({date: json[0].date})
            })


    }

    logState() {
        console.log(this.state.players);
        let sorted_players = this.state.players.sort((a, b) => b.standard_elo - a.standard_elo)
        console.log([{a:"test"},{a:"atest"},{a:"btest"}].sort((a, b) => a.a.toString() - b.a.toString()))
    }

    render(){
        return(
            <>
            <h4 className={"my-4"}>Ranking na {this.state.date}</h4>
                <div className={"mx-4"}>
                    <Table striped bordered hover>
                        <thead>
                        <tr>
                            <th>Lp.</th>
                            <th>Imię i nazwisko</th>
                            <th>Standard</th>
                            <th>Rapid</th>
                            <th>Blitz</th>
                        </tr>
                        </thead>
                        <tbody>
                        {this.state.players.sort((a, b) => b.standard_elo - a.standard_elo).map((p, idx) =>
                            <PlayerElement index={idx+1} player={p} key={p.id}></PlayerElement>

                        )}
                        </tbody>
                    </Table>
                </div>
                </>
        )
    }
}