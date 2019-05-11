import React from 'react';
import QrReader from 'react-qr-reader';
import { TextField, Typography, Button } from '@material-ui/core';
import EntryConfirmation from './Dialogs/EntryConfirmation';
import '../component_style/Voter.css';
import firebase from '../../firebase';
import { getCookie } from '../../cookies';
import BlockJoin from './Dialogs/BlockJoin';
import EarlyJoin from './Dialogs/EarlyJoin';
import ClosedJoin from './Dialogs/ClosedJoin';
import RejoinClosed from './Dialogs/RejoinClosed';
import NotFound from './Dialogs/NotFound';
import RejoinEvent from './Dialogs/RejoinEvent';

const config = require('../../config.json');

/**
 * Join Event via QR Code or UID
 */
export default class JoinEvent extends React.Component {
    constructor(props) {
        super(props);
        /** ::STATE INFO::
         *  eventID:        Event's UID, obtained either from QRcode or textfield
         *  idFieldValue:   The value currently in the textbox
         */
        this.state = {
            eventID: '',
            idFieldValue: '',
            eventName: '',
            organizerID: '',
            entryToAdd: '',
        };
        this.handleScan = this.handleScan.bind(this);
        this.handleError = this.handleError.bind(this);
        this.handleText = this.handleText.bind(this);
        this.handleJoinEvent = this.handleJoinEvent.bind(this);
        this.keyPress = this.keyPress.bind(this);
        this.handleRejoinEvent = this.handleRejoinEvent.bind(this);

        this.confirmChild = React.createRef();
        this.earlyJoinChild = React.createRef();
        this.closedJoinChild = React.createRef();
        this.blockChild = React.createRef();
        this.notFoundChild = React.createRef();
        this.rejoinChild = React.createRef();
        this.rejoinClosedChild = React.createRef();
    }

    componentDidMount() {
        const cookie = getCookie('UserID');
        firebase.database().ref('/').once('value').then(snapshot => {
            const root = snapshot.val();
            if (root.attendees) {
                const allCookies = root.attendees[cookie];
                let entryToAdd = '';
                if (allCookies && allCookies.currentEvent) {
                    const orgID = root.event[allCookies.currentEvent];
                    this.setState({ organizerID: (orgID ? orgID.organizer : '') }, () => {
                        if (this.state.organizerID && this.state.organizerID !== '') {
                            const event = root.organizer[this.state.organizerID].event[allCookies.currentEvent];
                            if (event) {
                                if (event.entries && this.props.scanEntry && event.entries[this.props.scanEntry]) {
                                    entryToAdd = this.props.scanEntry;
                                }
                                this.setState({
                                    eventName: event.eventData.name,
                                    eventID: allCookies.currentEvent,
                                    entryToAdd,
                                }, () => {
                                    const votingState = this.getVotingState(event.eventData);
                                    if (votingState === 'closed') {
                                        this.rejoinClosedChild.current.handleOpen();
                                        firebase.database().ref(`attendees/${cookie}/currentEvent`).set('');
                                        return;
                                    }
                                    this.rejoinChild.current.handleOpen();
                                });
                            }
                        }
                    });
                } else if (this.props.scanID) {
                    if (this.props.scanEntry) {
                        entryToAdd = this.props.scanEntry;
                    }
                    this.setState({
                        eventID: this.props.scanID,
                        entryToAdd,
                    });
                    this.requestConfirm();
                }
            } else {
                firebase.database().ref(`attendees/${cookie}/currentEvent`).set('');
            }
        });
    }

    getVotingState(event) {
        const date = new Date().toISOString();
        if (event.startVote === 'none' || (event.startVote > date)) { // not open yet
            return 'before';
        } else if (event.endVote === 'none' || (event.endVote > date)) { // open
            return 'open';
        }
        return 'closed';
    }

    requestConfirm = () => {
        firebase.database().ref('event/').once('value').then((snap) => {
            const orgID = snap.val()[this.state.eventID];
            this.setState({ organizerID: (orgID ? orgID.organizer : '') }, () => {
                if (this.state.organizerID && this.state.organizerID !== '') {
                    firebase.database().ref(`/organizer/${this.state.organizerID}/event/${this.state.eventID}`).once('value').then(snapshot => {
                        const event = snapshot.val();
                        if (!event) {
                            // Event not found
                            this.notFoundChild.current.handleOpen();
                            return;
                        }

                        this.setState({ eventName: event.eventData.name }, () => {
                            // Checks whether an even has not started or has ended
                            const votingState = this.getVotingState(event.eventData);
                            if (votingState === 'before') {
                                this.earlyJoinChild.current.handleOpen();
                                return;
                            }

                            if (votingState === 'closed') {
                                this.closedJoinChild.current.handleOpen();
                                return;
                            }
                            // Checks whether the user has submitted for this event previously
                            const cookie = getCookie('UserID');
                            firebase.database().ref(`attendees/${cookie}/pastEvents`).once('value').then(pastSnap => {
                                const pastEvents = pastSnap.val();
                                let check = false;
                                for (let c in pastEvents) {
                                    if (c === this.state.eventID) {
                                        check = true;
                                        this.blockChild.current.handleOpen();
                                        return;
                                    }
                                }
                                if (!check) {
                                    this.hasRankings(this.state.eventID).then((shouldRejoin) => {
                                        if (shouldRejoin) {
                                            this.rejoinChild.current.handleOpen();
                                        } else {
                                            this.confirmChild.current.handleOpen();
                                        }
                                    });
                                }
                            });
                        });
                    });
                } else {
                    // Event not found
                    this.notFoundChild.current.handleOpen();
                }
            });
        });
    }

    handleScan(data) {
        if (!this.dialogOpen() && data && data.toLowerCase().includes((`${config.Global.hostURL}/vote/`).toLowerCase())) {
            const entrySlash = data.indexOf('/', data.indexOf('/vote/') + 6);
            let id = '';
            if (entrySlash !== -1) {
                id = data.substring(data.indexOf('/vote/') + 6, entrySlash).replace(/\W/g, '');
            } else {
                id = data.substring(data.indexOf('/vote/') + 6).replace(/\W/g, '');
            }
            const entryToAdd = this.props.scanEntry ? this.props.scanEntry : '';
            this.setState({
                eventID: id,
                entryToAdd,
            });
            this.requestConfirm();
        }
    }

    handleText() {
        this.setState({
            eventID: this.state.idFieldValue
        }, () => {
            this.requestConfirm();
        });
    }

    hasRankings(eventId) {
        const cookie = getCookie('UserID');
        return firebase.database().ref(`/event/${eventId}`).once('value').then(snap => {
            const event = snap.val();
            if (event && event.attendees && event.attendees[cookie]) {
                return true;
            }
            return false;
        });
    }

    handleRejoinEvent() {
        const cookie = getCookie('UserID');
        firebase.database().ref(`event/${this.state.eventID}/attendees/${cookie}/rankings/`).once('value').then(rankSnap => {
            const rankings = rankSnap.val();
            const items = [];
            if (rankings) {
                for (const item in rankings) {
                    if (item) {
                        // console.log(item);
                        items[item - 1] = rankings[item].id;
                    }
                }
            }
            firebase.database().ref('organizer/').once('value').then(snapshot => {
                const organizer = snapshot.val();
                const event = organizer[this.state.organizerID].event[this.state.eventID];
                const itemList = [];
                for (let i = 0; i < items.length; i++) {
                    const entry = event.entries[items[i]];
                    if (entry) {
                        itemList.push({
                            name: entry.title,
                            id: entry.id.toString(),
                            presenters: entry.presenters,
                            entry_dates: entry.entry_dates,
                            info_url: entry.info_url,
                            showInfo: false,
                        });
                    }
                }
                this.props.updateItemsHandler(itemList);
            })
                .then(() => {
                    this.handleJoinEvent();
                });
        });
    }

    handleJoinEvent() {
        const cookie = getCookie('UserID');
        const itemsRef = firebase.database().ref(`attendees/${cookie}`);
        itemsRef.child('currentEvent').set(this.state.eventID);
        this.props.handler(this.props.voteViews.RANK, this.state.eventID, this.state.organizerID, this.state.entryToAdd);
    }

    handleError(err) {
        console.log(err);
    }

    keyPress(e) {
        if (e.key === 'Enter') {
            this.handleText();
        }
    }

    dialogOpen = () => {
        if (this.rejoinChild.current.state.open || this.notFoundChild.current.state.open
            || this.confirmChild.current.state.open || this.blockChild.current.state.open
            || this.earlyJoinChild.current.state.open || this.closedJoinChild.current.state.open
            || this.rejoinClosedChild.current.state.open) {
            return true;
        }
        return false;
    }

    render() {
        return (
            <div>
                <RejoinEvent entryName={this.state.eventName} ref={this.rejoinChild} handler={this.handleRejoinEvent} />
                <NotFound ref={this.notFoundChild} idType="Event" id={this.state.eventID} />
                <EntryConfirmation entryName={this.state.eventName} ref={this.confirmChild} handler={this.handleJoinEvent} />
                <BlockJoin entryName={this.state.eventName} idType="Event" ref={this.blockChild} />
                <EarlyJoin eventName={this.state.eventName} ref={this.earlyJoinChild} />
                <ClosedJoin eventName={this.state.eventName} ref={this.closedJoinChild} />
                <RejoinClosed eventName={this.state.eventName} ref={this.rejoinClosedChild} />
                <QrReader delay={300} onScan={this.handleScan} onError={this.handleError} style={{ width: '80%', margin: '20px auto 0px' }} />
                <Typography variant="h5" align="center" className="QRText">Scan QR Code or enter Event ID:</Typography>
                <div className="textField">
                    <TextField
                        id="outlined-dense"
                        label="Event ID"
                        margin="dense"
                        variant="outlined"
                        value={this.state.idFieldValue}
                        onKeyDown={this.keyPress}
                        onChange={e => this.setState({ idFieldValue: e.target.value })}
                    />
                </div>
                <div className="submitButtonContainer">
                    <Button variant="contained" color="primary" className="homeButton" onClick={this.handleText}>
                        Join
                    </Button>
                </div>
            </div>
        );
    }
}
