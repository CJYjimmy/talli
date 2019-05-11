import React, { Component } from 'react';
import 'date-fns';
import DateFnsUtils from '@date-io/date-fns';
import { MuiPickersUtilsProvider, DateTimePicker, DatePicker } from 'material-ui-pickers';
import { Typography, TextField, InputAdornment, Button, FormControlLabel, Switch } from '@material-ui/core';
import CalendarIcon from '@material-ui/icons/DateRange';
import openSocket from 'socket.io-client';
import SheetDialog from './Dialogs/SheetDialog';
import ShowError from './Dialogs/ShowError';
import '../component_style/NewEventForm.css';
import '../component_style/Organizer.css';
import firebase from '../../firebase';


const config = require('../../config.json');

const socket = openSocket(
    (config.Global.devMode ?
        `http://localhost:${config.Global.serverPort}` :
        `${(config.Global.sslEnabled ? "https" : "http")}://${config.Global.hostURL}`
    )
);

export default class NewEventForm extends Component {
    constructor(props) {
        super(props);
        this.state = {
            eventData: {
                name: '',
                id: '',
                location: '',
                startDate: new Date(),
                endDate: new Date(),
                automate: false,
                sheetURL: '',
                startVote: new Date(),
                endVote: new Date(),
                weights: {
                    first: 3,
                    second: 2,
                    third: 1
                }
            },
            connecting: false,
        };
        this.sheetDialog = React.createRef();
        this.showError = React.createRef();
    }

    componentDidMount() {
        socket.on('error', (data) => {
            console.log(data.error);
            this.handleError(data.error);
            this.setState({
                eventData: this.state.eventData,
                connecting: false
            });
        });

        socket.on('url_confirm', () => {
            this.addEntries();
        });
    }

    componentWillUnmount() {
        socket.removeAllListeners();
    }

    handleError = (message) => {
        this.showError.current.handleOpen(message);
    }

    openSheetDialog = () => {
        this.sheetDialog.current.handleOpen();
    }

    handleSubmit = (e) => {
        // url check and next page if successful
        e.preventDefault();
        socket.emit('send_url', {
            url: this.state.eventData.sheetURL,
            googleId: null,
            eventId: null
        });
        this.setState({
            eventData: this.state.eventData,
            connecting: true
        });
    }

    // Sends form data to Firebase and navigates to the next page
    addEntries = () => {
        const item = this.state.eventData;
        const googleId = this.props.user.googleId;

        const ref = firebase.database().ref('event');
        ref.once('value', (snapshot) => {
            let maxEvent = 100;
            snapshot.forEach((childSnapshot) => {
                maxEvent = childSnapshot.key;
            });

            item.id = 1 + parseInt(maxEvent, 10);

            ref.child(item.id).set({ 'organizer': googleId });

            const itemsRef = firebase.database().ref(`organizer/${googleId}/event/${item.id}`);
            item.startDate = item.startDate.toISOString();
            item.endDate = item.endDate.toISOString();
            if (item.automate) {
                item.startVote = item.startVote.toISOString();
                item.endVote = item.endVote.toISOString();
            } else {
                item.startVote = 'none';
                item.endVote = 'none';
            }
            itemsRef.child('eventData').set(item);
            this.props.setEvent(item.id);
            this.props.handler(this.props.orgViews.ADD);
        });
    }

    toggleAutomation = () => {
        const oldData = this.state.eventData;
        oldData.automate = !this.state.eventData.automate;
        this.setState({
            eventData: oldData,
            connecting: this.state.connecting
        });
    }

    handleEventChange = field => event => {
        const oldData = this.state.eventData;
        oldData[field] = event.target.value;
        this.setState({
            eventData: oldData,
            connecting: this.state.connecting
        });
    }

    handleDateChange = field => date => {
        const oldData = this.state.eventData;
        oldData[field] = date;
        this.setState({
            eventData: oldData,
            connecting: this.state.connecting
        });
    }

    cancelAddition = () => {
        this.props.handler(this.props.orgViews.MAIN);
    }

    render() {
        return (
            <div className="newEventForm">
                <SheetDialog ref={this.sheetDialog} />
                <ShowError ref={this.showError} />
                <Typography variant="h4" align="center" gutterBottom>Create a new event</Typography>
                <form className="eventForm" onSubmit={this.handleSubmit}>
                    <Typography variant="h6">Event Details</Typography>
                    <TextField
                        required
                        label="Event Name"
                        margin="dense"
                        className="entryFormText"
                        value={this.state.eventData.name}
                        onChange={this.handleEventChange('name')}
                        InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                        required
                        label="Location"
                        margin="dense"
                        className="entryFormText"
                        value={this.state.eventData.location}
                        onChange={this.handleEventChange('location')}
                        InputLabelProps={{ shrink: true }}
                    />
                    <br />
                    <div className="urlField">
                        <TextField
                            required
                            label="Google Sheet URL"
                            margin="dense"
                            className="entryFormText"
                            value={this.state.eventData.sheetURL}
                            onChange={this.handleEventChange('sheetURL')}
                            InputLabelProps={{ shrink: true }}
                        />
                        <Button align="bottom" onClick={this.openSheetDialog}>Sheet setup requirements</Button>
                    </div>
                    <br /> <br />
                    <MuiPickersUtilsProvider utils={DateFnsUtils}>
                        <DatePicker
                            required
                            label="Start Date"
                            margin="dense"
                            className="entryFormText"
                            value={this.state.eventData.startDate}
                            onChange={this.handleDateChange('startDate')}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <CalendarIcon />
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <DatePicker
                            required
                            label="End Date"
                            margin="dense"
                            className="entryFormText"
                            value={this.state.eventData.endDate}
                            onChange={this.handleDateChange('endDate')}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <CalendarIcon />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </MuiPickersUtilsProvider>
                    <br /> <br />
                    <FormControlLabel
                        control={(
                            <Switch
                                checked={this.state.eventData.automate}
                                onChange={() => this.toggleAutomation()}
                                value={this.state.eventData.automate}
                                color="primary"
                            />
                        )}
                        label="Automate Voting Time Period?"
                        labelPlacement="start"
                    />
                    {this.state.eventData.automate && (
                        <div>
                            <MuiPickersUtilsProvider utils={DateFnsUtils}>
                                <Typography className="votePeriodText">Start Voting:</Typography>
                                <DateTimePicker
                                    margin="dense"
                                    className="entryFormText"
                                    value={this.state.eventData.startVote}
                                    onChange={this.handleDateChange('startVote')}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <CalendarIcon />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                                <Typography className="votePeriodText">End Voting:</Typography>
                                <DateTimePicker
                                    margin="dense"
                                    className="entryFormText"
                                    value={this.state.eventData.endVote}
                                    onChange={this.handleDateChange('endVote')}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <CalendarIcon />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </MuiPickersUtilsProvider>
                        </div>
                    )}
                    <br /> <br />
                    <Button
                        variant="contained"
                        className="buttons"
                        type="button"
                        onClick={this.cancelAddition}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        className="buttons"
                        type="submit"
                        color="primary"
                    >
                        Next
                    </Button>
                    { this.state.connecting && <Typography>Connecting to google sheet...</Typography>}
                </form>
            </div>
        );
    }
}
