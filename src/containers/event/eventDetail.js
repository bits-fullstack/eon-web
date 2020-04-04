import React, { Component } from "react";
import PropTypes from "prop-types";
import "./eventDetail.css";
import {Button, Input} from 'antd';
import EventInfo from "../../components/eventDetail/eventInfo";
import EventCount from "../../components/eventDetail/eventCount";
import EventTable from "../../components/eventDetail/inviteeTable";
import InviteesPopup from "../../components/eventDetail/inviteePopup";

let data = [];
for (let i = 0; i < 4; i++) {
    data.push({
    key: i,
    email: `priyanka${i}@gmail.com`,
    name: `Edward King${i}${i}${i}`,
    contact: '1234567890',
    discount: '10%'
    });
}
data.push({
    key: 4,
    email: `priyankagmail.com`,
    name: 'King2',
    contact: '1234567890',
    discount: '10%'
    });

class EventDetail extends Component {
  constructor(props) {
    super(props);
    this.state = {
        showModal: false,
        rows: data,
        searchValue: '',
        filteredRows: []
    }
  }

  inviteButtonClick = () => {
    this.setState({
        showModal: true
    });
  }

  handleModalClose = () => {
    this.setState({
        showModal: false
    });
}


deleteAll = (list) => {
    const deletedList = []
    const data = this.state.rows;
    {list.map((no) => {
        return deletedList.push(data[no]);
    })}
    console.log(deletedList)
}

handleSend = () => {
}

search = (event) => {
    this.setState({
        searchValue: event.target.value,
        filteredRows: this.state.rows.filter((data) => {return data['name'].includes(event.target.value)})
    })
}

  render() {
    console.log(this.state.rows)
    return (
      <div className="sub-content">
        <div className="events-heading">Event detail</div>
        <EventInfo />
        <EventCount />
        <div className="invitee-row">
            <h2><b>Invitees List</b></h2>
            <Button type="primary" onClick={this.inviteButtonClick}>
                Add Invitees
            </Button>
        </div>
        <Input
            placeholder="input search text"
            onChange={event => this.search(event)}
            style={{ width: 200, position: 'absolute', zIndex: 1 }}
        />
        <EventTable deleteAll={this.deleteAll} data={this.state.searchValue.length > 0 ? this.state.filteredRows : this.state.rows}/>
        {this.state.showModal &&
            <InviteesPopup
                handleClose={this.handleModalClose}
                handleSend={this.handleSend}
                onDiscountChange={this.onDiscountChange}
            />
        }
      </div>
    );
  }
}

EventDetail.propTypes = {
  history: PropTypes.object
};

export default EventDetail;