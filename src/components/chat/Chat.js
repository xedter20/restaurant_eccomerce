import React from 'react';
import { currentLoggedIn } from './../../components/shop/auth/fetchApi';

import { ChannelList } from './ChannelList';
import './chat.scss';

import { MessagesPanel } from './MessagesPanel';
import socketClient from 'socket.io-client';
const SERVER = process.env.REACT_APP_API_URL;

export default class Chat extends React.Component {
  state = {
    channels: null,
    socket: null,
    channel: null
  };
  socket;
  componentDidMount() {
    this.loadChannels();
    this.configureSocket();
  }

  configureSocket = () => {
    var socket = socketClient(SERVER);
    socket.on('connection', () => {
      if (this.state.channel) {
        this.handleChannelSelect(this.state.channel.id);
      }
    });
    socket.on('channel', channel => {
      let channels = this.state.channels;
      channels.forEach(c => {
        if (c.id === channel.id) {
          c.participants = channel.participants;
        }
      });
      this.setState({ channels });
    });
    socket.on('message', message => {
      let channels = this.state.channels;
      channels.forEach(c => {
        if (c.id === message.channel_id) {
          if (!c.messages) {
            c.messages = [message];
          } else {
            c.messages.push(message);
          }
        }
      });
      this.setState({ channels });
    });
    this.socket = socket;
  };

  loadChannels = async () => {
    console.log(currentLoggedIn()._id);

    fetch(`${SERVER}/getChannels`).then(async response => {
      let data = await response.json();
      console.log(data.channels);
      let filtered = data.channels.map(data => {
        const isMe = currentLoggedIn()._id === data.id;
        return {
          ...data,
          name: `${data.name} ${isMe ? '( me )' : ''}`
        };
      });
      //   .filter(u => u.id !== currentLoggedIn()._id);
      console.log({ filtered });

      this.setState({ channels: filtered });
    });
  };

  handleChannelSelect = id => {
    let channel = this.state.channels.find(c => {
      return c.id === id;
    });
    this.setState({ channel });
    this.socket.emit('channel-join', id, ack => {});
  };

  handleSendMessage = (channel_id, text) => {
    this.socket.emit('send-message', {
      channel_id,
      text,
      senderName: this.socket.id,
      id: Date.now()
    });
  };

  render() {
    return (
      <div className="chat-app">
        <ChannelList
          channels={this.state.channels}
          onSelectChannel={this.handleChannelSelect}
        />
        <MessagesPanel
          onSendMessage={this.handleSendMessage}
          channel={this.state.channel}
        />
      </div>
    );
  }
}
