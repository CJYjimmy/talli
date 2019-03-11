import React from 'react';
import RemoveCircleOutlineIcon from '@material-ui/icons/RemoveCircleOutline';
import '../../component_style/Organizer.css';
import { TextField } from '@material-ui/core';
import firebase from '../../../firebase';

export default class AddVoteEntryForm extends React.Component {
    state = {
        show: true,
        id: '',
        title: '',
        rank: this.props.entriesInVote[this.props.index].rank,
        entries: [],
    }

    delEntry = () => {
        this.setState({
            show: false,
        }, () => {
            this.props.updateEntry(this.state, this.props.index);
        });
    }

    componentDidMount() {
        var query = firebase.database().ref('organizer/' + this.props.googleId + '/event/' + this.props.event.id);
        query.on('value', (snapshot) => {
            let entriesRef = snapshot.val();
            let entries = entriesRef['entries']
            this.setState({
                entries: entries
            });
        });
    }

    handleChange = name => event => {
        this.setState({ rank:this.props.entriesInVote[this.props.index].rank})
        var title = ""
        var entry = this.state.entries[event.target.value]
        if (entry) {
            title = entry['title']
        }
        if (title !== '') {
            this.setState({
                [name]:event.target.value,
                title: title,
            }, () => {
                this.props.updateEntry(this.state, this.props.index);
            });
        } else {
            this.setState({
                [name]: event.target.value,
                title: '',
            }, () => {
                this.props.updateEntry(this.state, this.props.index);
            });
        }
    };

    render() {
        if (this.state.show && this.state.title !== '') {
            return (
                <div className='addEntry'>
                <br />
                    <div>
                        {this.props.entriesInVote[this.props.index].rank}.
                        <TextField
                            required = "true"
                            label="Entry ID"
                            margin="dense"
                            className="entryFormText"
                            value={this.state.idAndTitle}
                            onChange={this.handleChange('id')}
                        />
                        <TextField
                            disabled
                            label="Title"
                            margin="dense"
                            className="entryFormText"
                            value={this.state.title}
                        />
                    </div>
                    <RemoveCircleOutlineIcon color='primary' id='entryIcon' onClick={this.delEntry}/>
                </div>
            );
        } else if (this.state.show) {
            return (
                <div className='addEntry'>
                <br />
                    <div>
                        {this.props.entriesInVote[this.props.index].rank}.
                        <TextField
                            required = "true"
                            label="Entry ID"
                            margin="dense"
                            className="entryFormText"
                            value={this.state.idAndTitle}
                            onChange={this.handleChange('id')}
                        />
                        <TextField
                            disabled
                            label=" "
                            margin="dense"
                            className="entryFormText"
                            value="Enter a Valid Entry ID"
                        />
                    </div>
                    <RemoveCircleOutlineIcon color='primary' id='entryIcon' onClick={this.delEntry}/>
                </div>
            );
        } else {
            return null;
        }
    }
}