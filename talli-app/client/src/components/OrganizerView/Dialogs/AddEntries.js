import React from 'react';
import { Slide, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@material-ui/core';
import firebase from '../../../firebase.js';

function Transition(props) {
    return <Slide direction="up" {...props} />;
}

export default class AddEntries extends React.Component {
    state = {
        open: false,
        title: '',
        presenters: '',
        entry_dates: ''
    };

    handleOpen = () => {
        this.setState({ 
            open: true, 
        });
    };

    handleClose = () => {
        this.setState({ 
            open: false,
            title: '',
            presenters: '',
            entry_dates: ''
        });
    }

    handleSaveClose = () => {
        let tempId;
        // generate ID
        if (this.props.event.entries) {
            const ent = this.props.event.entries;
            const entArray = Object.keys(ent);
            tempId = 1 + parseInt(ent[entArray[entArray.length - 1]].id);
        } else {
            const base = 1000 + Math.floor((Math.random() * 8000) + 1);
            tempId = base;
        }
        // save new entry to database
        let itemsRef = firebase.database().ref('organizer/' + this.props.googleId +
                                               '/event/' + this.props.event.id + 
                                               '/entries/' + tempId);
        itemsRef.child('title').set(this.state.title);
        itemsRef.child('id').set(tempId);
        itemsRef.child('presenters').set(this.state.presenters);
        itemsRef.child('entry_dates').set(this.state.entry_dates);
        // close dialog
        this.handleClose();
    }

    handleChange = name => event => {
        this.setState({
            [name]: event.target.value
        });
    }

    render() {
        return (
            <div>
                <Dialog open={this.state.open} TransitionComponent={Transition} onClose={this.handleClose}>
                    <DialogTitle> Add New Entry </DialogTitle>
                    <DialogContent>
                        <TextField
                            required
                            label="Entry Title"
                            margin="dense"
                            className="entryFormText"
                            defaultValue={this.state.title}
                            onChange={this.handleChange('title')}
                        />
                        <br />
                        <TextField
                            required
                            label="Presenters"
                            margin="dense"
                            className="entryFormText"
                            defaultValue={this.state.presenters}
                            onChange={this.handleChange('presenters')}
                        />
                        <TextField
                            required
                            label="Date(s) Attending"
                            margin="dense"
                            className="entryFormText"
                            defaultValue={this.state.entry_dates}
                            onChange={this.handleChange('entry_dates')}
                        />
                    </DialogContent>
                    <DialogActions>    
                        <Button onClick={this.handleClose}>Cancel</Button>
                        <Button onClick={this.handleSaveClose} color="primary">Add</Button>
                    </DialogActions>
                </Dialog>
            </div>
        );
    }
}