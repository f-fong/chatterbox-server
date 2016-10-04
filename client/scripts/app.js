// Sanitize the input string
var escapeHtml = (str) => {
  var div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
};

class App {
  constructor() {
    this.server = 'http://127.0.0.1:3000/classes/messages';
    this.rooms = [];
    this.roomsPopulated = false;
    this.selectedRoom = 'Lobby';
    this.defaultRoom = 'Lobby';

    this.$roomSelect = $('#roomSelect');
    this.$send = $('#send');
    this.$message = $('#message');
    this.$chats = $('#chats');
    this.$refresh = $('#refresh');
    this.$userName = $('.userName');
    this.$spinner = $('.spinner');
  }

  init() {
    // setup all the even listeners
    this.$send.on('submit', (event) => {
      this.setSpinner(true);
      this.handleSubmit();
      this.$message.val('');
      return false;
    });

    this.$chats.on('click', '.username', (event) => {
      this.handleUsernameClick(event);
    });

    this.$refresh.on('click', () => {
      this.clearMessages();
      this.fetch();
    });
    
    this.$roomSelect.on('change', () => {
      var roomSelected = this.$roomSelect.find('option:selected').val();
      if (this.$roomSelect.prop('selectedIndex') === 0) {
        // create a new room
        var roomname = prompt('New Room');
        if (roomname) {
          // append it to the room list and select it
          this.setNewRoom(roomname);
        } else {
          $('#roomSelect option[value="' + this.defaultRoom + '"]').attr('selected', 'selected');
        }
      } else {
        this.selectedRoom = roomSelected;
        this.clearMessages();
        this.fetch();
      }
    });

    this.$userName.append('Welcome ' + this.getUserName());
    this.fetch();
  }

  send(message) {
    $.ajax({
      url: this.server,
      type: 'POST',
      data: JSON.stringify(message),
      contentType: 'application/json',
      success: (data) => {
        console.log('chatterbox: Message sent');
        this.clearMessages();
        this.fetch();
      },
      error: (data) => {
        console.error('chatterbox: Failed to send message!', data);
      }
    });
  }
  
  fetch() {
    $.ajax({
      url: this.server,
      type: 'GET',
      success: (data) => {
        var messages = data.results;
        messages = _.map(messages, (message) => {
          return { 
            username: escapeHtml(message.username),
            text: escapeHtml(message.text),
            roomname: escapeHtml(message.roomname)
          };
        });

        this.getRoomnames(messages);
        this.refreshRoomDropDownList();

        if (this.selectedRoom.length > 0) {
          messages = this.filterMessagesByRoomName(messages, this.selectedRoom);
        }
        this.clearMessages();
        messages.forEach((message) => {
          this.renderMessage(message);
        });
        this.setSpinner(false);
      },
      error: (data) => {
        console.error('chatterbox: Failed to fetch messages!', data);
      }
    });
  }
  
  clearMessages() {
    this.$chats.empty();
  }

  renderMessage(message) {
    this.$chats.append(`<div class='chat'>
                          <div class='username'>${message.username}</div>
                          <div class='text'>${message.text}</div>
                        </div>`);
    var elements = $('.chat .username').filter(function() {
      return $(this).text() === message.username;
    });
  }

  renderRoom(roomName) {
    this.$roomSelect.append(`<option>${roomName}</option>`);
  }

  handleUsernameClick(event) {
    var username = $(event.target).html();

    var friendElements = $('.chat .username').filter(function() {
      return $(this).text() === username;
    });

    friendElements.parent().toggleClass('friend');
  }

  handleSubmit() {
    var message = {
      username: this.getUserName(),
      text: this.getText(),
      roomname: this.getRoomName()
    };
    this.send(message);
  }

  getRoomnames(messages) {
    _.each(messages, (message) => {
      if (this.rooms.indexOf(message.roomname) === -1) {
        this.rooms.unshift(message.roomname);
      }
    });
  }

  refreshRoomDropDownList() {
    if ($('#roomSelect option[value="Create new room..."]').length === 0) {
      var $newRoom = $('<option value="Create new room...">Create new room...</option>');
      this.$roomSelect.append($newRoom);
    } 

    _.each(this.rooms, (room) => {
      if (!this.roomsPopulated) {
        this.$roomSelect.append(`<option value="${room}">${room}</option>`);
      } else {
        if (this.rooms.indexOf(room) === -1) {
          this.$roomSelect.append(`<option value="${room}">${room}</option>`);
        }
      }
    });
    this.$roomSelect.val(this.selectedRoom);
    this.roomsPopulated = true;
  }

  setSpinner(turnOn) {
    if (turnOn) {
      this.$spinner.show();
    } else {
      this.$spinner.hide();
    }
  }

  filterMessagesByRoomName(messages, roomName) {
    return _.filter(messages, (message) => {
      return message.roomname === roomName;
    });
  }

  getUserName() {
    return window.location.search.slice(window.location.search.indexOf('=') + 1);
  }

  getText() {
    return this.$message.val();
  }

  getRoomName() {
    return $('#roomSelect option:selected').text();
  }

  setNewRoom(newRoomName) {
    var result = _.find(this.rooms, (roomname) => {
      return roomname === newRoomName;
    });

    if (!result) {
      this.rooms.push(newRoomName);
      this.$roomSelect.append(`<option value="${newRoomName}">${newRoomName}</option>`);
      $('#roomSelect option[value="' + newRoomName + '"]').attr('selected', 'selected');
    }
    this.selectedRoom = newRoomName;
    this.fetch();
  }
}