import React from 'react';
import { Typography, Grid, Button } from '@material-ui/core';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import '../component_style/Organizer.css';
import firebase from '../../firebase.js';

/**
 * OrganizerView > EventList
 * Organizer landing page which shows them all
 * of their events and the option to add a new one.
 */
export default class EventList extends React.Component {
    state = {
        events: []
    }

    componentDidMount() {
        const googleId = this.props.user.googleId;
        const query = firebase.database().ref(`organizer/${googleId}/event`);
        const allEvents = [];
        query.on('value', (snapshot) => {
            const events = snapshot.val();
            for (let event in events) {
                const refPrefix = `${event}/eventData`;
                const id = snapshot.child(`${refPrefix}/id`).val();
                const name = snapshot.child(`${refPrefix}/name`).val();
                const location = snapshot.child(`${refPrefix}/location`).val();
                const startDate = snapshot.child(`${refPrefix}/startDate`).val();
                const endDate = snapshot.child(`${refPrefix}/endDate`).val();
                const automate = snapshot.child(`${refPrefix}/automate`).val();
                const startVote = snapshot.child(`${refPrefix}/startVote`).val();
                const endVote = snapshot.child(`${refPrefix}/endVote`).val();

                allEvents.push({
                    id,
                    name,
                    location,
                    startDate,
                    endDate,
                    automate,
                    startVote,
                    endVote
                });
            }
            this.setState({
                events: allEvents
            });
        });
    }

    parseDate(isoDate) {
        const dateString = `${isoDate.substring(5, 7)}/${isoDate.substring(8, 10)}/${isoDate.substring(0, 4)}`;
        return dateString;
    }

    AddEvent() {
        this.props.handler(this.props.orgViews.CREATE);
        /* unimplemented */
    }

    viewEvent(id) {
        this.props.setEvent(id);
        this.props.handler(this.props.orgViews.VIEW);
    }

    render() {
        return (
            <div>
                <Typography variant='h4' align='center' gutterBottom>{sessionStorage.getItem('name')}'s Events</Typography>
                <Grid container className='organizerEvents'>
                    <Grid item className='eventContainer' id='addEvent'>
                        <AddCircleIcon color='primary' id='addCircleIcon' onClick={() => this.AddEvent()} />
                    </Grid>
                    {this.state.events.map((event, index) => (
                        <Button className="eventContainer" variant="contained" color="primary" id="openEvent" onClick={() => this.viewEvent(event.id)} key={index}>
                            {event.name}
                            <br />
                            {this.parseDate(event.startDate)} - {this.parseDate(event.endDate)}
                            <br />
                            <br />
                            Voting period is {event.automate ? "automated." : "not automated."}
                        </Button>
                    ))}
                </Grid>
                <div />
            </div>
        );
    }
}
