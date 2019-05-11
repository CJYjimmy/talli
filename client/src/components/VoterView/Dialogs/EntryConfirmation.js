import React, { Component } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Slide } from '@material-ui/core';

function Transition(props) {
    return <Slide direction="up" {...props} />;
}

export default class EntryConfirmation extends Component {
    constructor(props) {
        super(props);
        this.state = {
            open: false,
        };
    }

    handleOpen = () => {
        this.setState({ open: true });
    }

    handleClose = () => {
        this.setState({ open: false });
    }

    handleConfirm = () => {
        this.setState({ open: false });
        this.props.handler();
    }

    render() {
        return (
            <div>
                <Dialog open={this.state.open} TransitionComponent={Transition} onClose={this.handleClose}>
                    <DialogTitle>
                        Confirmation
                    </DialogTitle>
                    <DialogContent>
                        This ID is for: <br />
                        <b>{this.props.entryName}.</b>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={this.handleClose}>Go Back</Button>
                        <Button onClick={this.handleConfirm} color="primary">Confirm</Button>
                    </DialogActions>
                </Dialog>
            </div>
        );
    }
}
