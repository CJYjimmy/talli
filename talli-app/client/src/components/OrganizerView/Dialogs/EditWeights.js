import React from 'react';
// import firebase from '../../../firebase.js';
import { Slide, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@material-ui/core';
import openSocket from 'socket.io-client';

const socket = openSocket('http://localhost:5000');

function Transition(props) {
    return <Slide direction="up" {...props} />;
}

// maybe for future, have it load current weights into text fields
export default class EditWeights extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            open: false,
            weights: [
                "", "", ""
            ]
        }
    }

    handleOpen = () => {
        this.setState({ open: true });
    };

    handleClose = () => {
        this.setState({ open: false });
    }

    handleSave = () => {
        socket.emit('send_weights', {
            weights: this.state.weights,
            eventId: this.props.event.id,
            googleId: this.props.googleId
        });
        this.setState({ open: false });
        
    };

    handleWeightChange = index => event => {
        let curr = this.state.weights;
        curr[index] = event.target.value;
        this.setState({
            weights: curr
        });
    }

    render() {
        return !this.state.open ? null : (
            <div>
                <Dialog open={this.state.open} TransitionComponent={Transition} onClose={this.handleClose}>
                    <DialogTitle> Edit Weights </DialogTitle>
                    <DialogContent>
                        {
                            this.state.weights.map((weight, index) => {
                                return (
                                    <div>
                                        <TextField label={'Rank ' + (index + 1)} margin='dense' value={weight} onChange={this.handleWeightChange(index)} />
                                    </div>
                                )
                            })
                        }
                    </DialogContent>
                    <DialogActions>
                        {/* Not sure how to make the close button align to the left */}
                        <Button onClick={this.handleClose} color="default">Close</Button>
                        <Button onClick={this.handleSave} color="primary">Save</Button>
                    </DialogActions>
                </Dialog>
            </div>
        );
    }
}