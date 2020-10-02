import * as React from "react";
import { forwardRef } from 'react';

import AddBox from '@material-ui/icons/AddBox';
import ArrowDownward from '@material-ui/icons/ArrowDownward';
import Check from '@material-ui/icons/Check';
import ChevronLeft from '@material-ui/icons/ChevronLeft';
import ChevronRight from '@material-ui/icons/ChevronRight';
import Clear from '@material-ui/icons/Clear';
import DeleteOutline from '@material-ui/icons/DeleteOutline';
import Edit from '@material-ui/icons/Edit';
import FilterList from '@material-ui/icons/FilterList';
import FirstPage from '@material-ui/icons/FirstPage';
import LastPage from '@material-ui/icons/LastPage';
import Remove from '@material-ui/icons/Remove';
import SaveAlt from '@material-ui/icons/SaveAlt';
import Search from '@material-ui/icons/Search';
import ViewColumn from '@material-ui/icons/ViewColumn';

import MaterialTable from 'material-table'
import {PlayerElement} from "./PlayerElement";

const tableIcons = {
    Add: forwardRef((props, ref) => <AddBox {...props} ref={ref} />),
    Check: forwardRef((props, ref) => <Check {...props} ref={ref} />),
    Clear: forwardRef((props, ref) => <Clear {...props} ref={ref} />),
    Delete: forwardRef((props, ref) => <DeleteOutline {...props} ref={ref} />),
    DetailPanel: forwardRef((props, ref) => <ChevronRight {...props} ref={ref} />),
    Edit: forwardRef((props, ref) => <Edit {...props} ref={ref} />),
    Export: forwardRef((props, ref) => <SaveAlt {...props} ref={ref} />),
    Filter: forwardRef((props, ref) => <FilterList {...props} ref={ref} />),
    FirstPage: forwardRef((props, ref) => <FirstPage {...props} ref={ref} />),
    LastPage: forwardRef((props, ref) => <LastPage {...props} ref={ref} />),
    NextPage: forwardRef((props, ref) => <ChevronRight {...props} ref={ref} />),
    PreviousPage: forwardRef((props, ref) => <ChevronLeft {...props} ref={ref} />),
    ResetSearch: forwardRef((props, ref) => <Clear {...props} ref={ref} />),
    Search: forwardRef((props, ref) => <Search {...props} ref={ref} />),
    SortArrow: forwardRef((props, ref) => <ArrowDownward {...props} ref={ref} />),
    ThirdStateCheck: forwardRef((props, ref) => <Remove {...props} ref={ref} />),
    ViewColumn: forwardRef((props, ref) => <ViewColumn {...props} ref={ref} />)
};


export class RatingList extends React.Component {
    state = {
        players: [],
        header: "",
    };

    componentDidMount() {
        fetch("/rating-list")
            .then(res => res.json())
            .then(json => {
                this.setState({players: json});
                this.setState({header: "Ranking na " +json[0].date})
            })


    }

    render(){
        return(
            <>
                <MaterialTable
                    icons={tableIcons}
                    title={this.state.header}
                    columns={[
                        { title: 'Nazwisko i imię', field: 'name', cellStyle: {width: '100%'}},
                        { title: 'Standard', field: 'standard_elo', type: 'numeric', defaultSort:'desc', cellStyle: {},
                            render: (rowData) => {
                            return rowData.changes[0] === -1 ? <span style={{color: 'darkred'}}>{rowData.standard_elo}</span> :
                                (rowData.changes[0] === 1 ? <span style={{color: 'seagreen'}}>{rowData.standard_elo}</span> : rowData.standard_elo)
                            } },
                        { title: 'Rapid', field: 'rapid_elo', type: 'numeric', cellStyle: {},
                            render: (rowData) => {
                                return rowData.changes[1] === -1 ? <span style={{color: 'darkred'}}>{rowData.rapid_elo}</span> :
                                    (rowData.changes[1] === 1 ? <span style={{color: 'seagreen'}}>{rowData.rapid_elo}</span> : rowData.rapid_elo)
                            } },
                        { title: 'Blitz', field: 'blitz_elo', type: 'numeric', cellStyle: {width: '100%',
                                paddingBottom: '0px',
                                paddingTop: '0px',},
                            render: (rowData) => {
                                return rowData.changes[2] === -1 ? <span style={{color: 'darkred'}}>{rowData.blitz_elo}</span> :
                                    (rowData.changes[2] === 1 ? <span style={{color: 'seagreen'}}>{rowData.blitz_elo}</span> : rowData.blitz_elo)
                            } },


                    ]}
                    data={this.state.players}
                    options={{
                        sorting: true,
                        paging: false,
                        // search: false,
                        rowStyle: rowData => ({
                            fontWeight: "bold",
                        }),
                        cellStyle : {
                        }
                    }}
                    localization={{
                        body: {emptyDataSourceMessage: ""},
                        toolbar: {searchPlaceholder: "Szukaj"}
                    }}
                    detailPanel={[
                        {
                            tooltip: 'Pokaż szczegółwe informacje',
                            render: rowData => {
                                return (
                                    <PlayerElement player={rowData}/>
                                )
                            },
                        }
                    ]}

                    onRowClick={(event, rowData, togglePanel) => togglePanel()}
                />
            </>
        )
    }
}