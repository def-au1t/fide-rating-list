import * as React from "react";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import CardHeader from "@material-ui/core/CardHeader";
import ListItem from "@material-ui/core/ListItem";
import List from "@material-ui/core/List";
import ListItemText from "@material-ui/core/ListItemText";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import {Cake, EmojiEvents, Flag} from "@material-ui/icons";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableRow from "@material-ui/core/TableRow";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import Divider from "@material-ui/core/Divider";


export class PlayerElement extends React.Component {
    componentDidMount() {

    }

    countryTranslate = (country) => {
        switch(country){
        case 'Poland': return 'Polska';
        case 'Czech Republic': return 'Czechy';
        default: return country;
        }};

    titleTranslate = (title) => {
        switch(title){
            case 'Grandmaster': return 'Arcymistrz międzynarodowy';
            case 'International Master': return 'Mistrz międzynarodowy';
            case 'FIDE Master': return 'Mistrz FIDE';
            case 'Woman Intl. Master': return 'Mistrzyni międzynarodowa';
            case 'Woman Grandmaster': return 'Arcymistrzyni międzynarodowa';
            case 'None': return 'brak';
            default: return title;
        }};

    displayRatingChange = (newR, oldR) => {
        if(!parseInt(newR) || !parseInt(newR)) return '-';
        const diff = parseInt(newR)-parseInt(oldR);
        if(diff > 0){
            return <span style={{color: 'seagreen'}}>+{diff}</span>
        }
        else if(diff < 0){
            return <span style={{color: 'darkred'}}>{diff}</span>
        }
        else return 0;
    }

    render(){
        return(
            <Card style={{textAlign: 'center'}}>
                <CardHeader subheader="Dodatkowe informacje o zawodniku:"/>
                <CardContent>
                    <List>
                        <ListItem>
                            <ListItemIcon>
                                <Cake />
                            </ListItemIcon>
                            <ListItemText primary="Rok urodzenia" />
                            <ListItemSecondaryAction>{this.props.player.birth_year}</ListItemSecondaryAction>

                        </ListItem>
                        <ListItem>
                            <ListItemIcon>
                                <EmojiEvents />
                            </ListItemIcon>
                            <ListItemText primary="Tytuł międzynarodowy" />
                            <ListItemSecondaryAction>{this.titleTranslate(this.props.player.title)}</ListItemSecondaryAction>
                        </ListItem>
                        <ListItem>
                            <ListItemIcon>
                                <Flag />
                            </ListItemIcon>
                            <ListItemText primary="Narodowość" />
                            <ListItemSecondaryAction>{this.countryTranslate(this.props.player.federation)}
                            </ListItemSecondaryAction>
                        </ListItem>
                    </List>

                    <h4>Miejsce w rankingach aktywnych graczy</h4>
                    <Table style={{width:'auto', margin:'auto', fontWeight: 'bold !important'}}>
                        <TableHead>
                            <TableRow>
                                <TableCell>Świat</TableCell>
                                <TableCell>Kontynent</TableCell>
                                <TableCell>Kraj</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody style={{fontWeight: 'bold'}}>
                            <TableRow>
                                <TableCell style={{fontWeight: 'bold'}}>{parseInt(this.props.player.world_rank_active_players) ? this.props.player.world_rank_active_players : '-' } </TableCell>
                                <TableCell style={{fontWeight: 'bold'}}>{parseInt(this.props.player.continental_rank_active_players) ? this.props.player.continental_rank_active_players : '-' } </TableCell>
                                <TableCell style={{fontWeight: 'bold'}}>{parseInt(this.props.player.national_rank_active_players) ? this.props.player.national_rank_active_players : '-' } </TableCell>
                            </TableRow>

                        </TableBody>
                    </Table>
                    <Divider/>
                    <h4>Statystyki partii i rankingu</h4>
                    <Table style={{width:'auto', margin:'auto', fontWeight: 'bold'}}>
                        <TableHead>
                            <TableRow>
                                <TableCell/>
                                <TableCell>Standard</TableCell>
                                <TableCell>Rapid</TableCell>
                                <TableCell>Blitz</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            <TableRow>
                                <TableCell style={{fontWeight: 'bold'}}>Liczba partii - ostatni miesiąc:</TableCell>
                                <TableCell style={{fontWeight: 'bold'}}>{parseInt(this.props.player.player_history[0].num_standard_games) ? parseInt(this.props.player.player_history[0].num_standard_games)  : '0' } </TableCell>
                                <TableCell style={{fontWeight: 'bold'}}>{parseInt(this.props.player.player_history[0].num_rapid_games) ? parseInt(this.props.player.player_history[0].num_rapid_games)  : '0' } </TableCell>
                                <TableCell style={{fontWeight: 'bold'}}>{parseInt(this.props.player.player_history[0].num_blitz_games) ? parseInt(this.props.player.player_history[0].num_blitz_games)  : '0' } </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell style={{fontWeight: 'bold'}}>Obecny ranking:</TableCell>
                                <TableCell style={{fontWeight: 'bold'}}>{parseInt(this.props.player.standard_elo) ? this.props.player.standard_elo : '-' } </TableCell>
                                <TableCell style={{fontWeight: 'bold'}}>{parseInt(this.props.player.rapid_elo) ? this.props.player.rapid_elo : '-' } </TableCell>
                                <TableCell style={{fontWeight: 'bold'}}>{parseInt(this.props.player.blitz_elo) ? this.props.player.blitz_elo : '-' } </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell style={{fontWeight: 'bold'}}>Zmiana - ostatni miesiąc:</TableCell>
                                <TableCell style={{fontWeight: 'bold'}}>{this.displayRatingChange(this.props.player.standard_elo, this.props.player.player_history[1].standard)}</TableCell>
                                <TableCell style={{fontWeight: 'bold'}}>{this.displayRatingChange(this.props.player.rapid_elo, this.props.player.player_history[1].rapid)}</TableCell>
                                <TableCell style={{fontWeight: 'bold'}}>{this.displayRatingChange(this.props.player.blitz_elo, this.props.player.player_history[1].blitz)}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell style={{fontWeight: 'bold'}}>Zmiana - ostatni rok:</TableCell>
                                <TableCell style={{fontWeight: 'bold'}}>{this.displayRatingChange(this.props.player.standard_elo, this.props.player.player_history[12].standard)}</TableCell>
                                <TableCell style={{fontWeight: 'bold'}}>{this.displayRatingChange(this.props.player.rapid_elo, this.props.player.player_history[12].rapid)}</TableCell>
                                <TableCell style={{fontWeight: 'bold'}}>{this.displayRatingChange(this.props.player.blitz_elo, this.props.player.player_history[12].blitz)}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        )
    }
}