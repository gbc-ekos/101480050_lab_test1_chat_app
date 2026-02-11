let currentRoomId = null;
let currentMode = "rooms";
let currentUserId = null;

$(function () {
  if (!Client.isLoggedIn()) {
    window.location.href = "/login.html";
    return;
  }

  loadRooms();
  setupMessageListener();

  $("#logout-btn").on("click", function () {
    Client.logout();
  });

  $("#mode-rooms").on("click", function () {
    switchMode("rooms");
  });

  $("#mode-users").on("click", function () {
    switchMode("users");
  });

  $("#message-form").on('submit', async function (e) {
    e.preventDefault();
    const message = $("#message-input").val().trim();
    if (!message) return;

    try {
      if (currentMode === "rooms" && currentRoomId) {
        await Client.emit("room:send", { roomId: currentRoomId, message });
      } else if (currentMode === "users" && currentUserId) {
        await Client.emit("user:send", { userId: currentUserId, message });
      } else {
        return;
      }
      $("#message-input").val("");
    } catch (err) {
      alert("Failed to send message: " + err.message);
    }
  });

  $(document).on("click", ".sender[data-user-id]", function () {
    const userId = $(this).data("user-id");
    const username = $(this).text();
    if (userId) {
      switchMode("users");
      joinUserChat(userId, username);
    }
  });
});

function switchMode(mode) {
  currentMode = mode;

  if (mode === "rooms") {
    $("#mode-rooms").removeClass("btn-outline-primary").addClass("btn-primary");
    $("#mode-users").removeClass("btn-primary").addClass("btn-outline-primary");
    $("#sidebar-title").text("Rooms");
    loadRooms();
  } else {
    $("#mode-users").removeClass("btn-outline-primary").addClass("btn-primary");
    $("#mode-rooms").removeClass("btn-primary").addClass("btn-outline-primary");
    $("#sidebar-title").text("Messages");
    loadUsers();
  }

  if (currentRoomId) {
    Client.emit("room:leave", currentRoomId);
    currentRoomId = null;
  }
  currentUserId = null;

  $("#current-room-name").text("");
  $("#welcome-message").show();
  $("#chat-container").hide();
}

async function loadRooms() {
  try {
    const list = $("#sidebar-list");
    list.empty();
    const res = await Client.emit("room:list");
    res.rooms.forEach((room) => {
      const roomLink = $("<div>")
        .addClass("room-link")
        .text(room.name)
        .attr("data-room-id", room._id)
        .on('click', () => joinRoom(room._id, room.name));
      list.append(roomLink);
    });
  } catch (err) {
    console.error("Failed to load rooms:", err);
  }
}

async function loadUsers() {
  try {
    const list = $("#sidebar-list");
    list.empty();
    const res = await Client.emit("user:list");
    if (res.users && res.users.length > 0) {
      res.users.forEach((user) => {
        const userLink = $("<div>")
          .addClass("user-link")
          .text(user.username)
          .attr("data-user-id", user._id)
          .on('click', () => joinUserChat(user._id, user.username));
        list.append(userLink);
      });
    } else {
      list.append('<div class="text-muted p-2">No conversations yet</div>');
    }
  } catch (err) {
    console.error("Failed to load users:", err);
  }
}

async function joinRoom(roomId, roomName) {
  if (currentRoomId === roomId) return;
  if (currentRoomId) {
    await Client.emit("room:leave", currentRoomId);
  }
  currentUserId = null;

  try {
    const result = await Client.emit("room:join", roomId);
    currentRoomId = roomId;

    $(".room-link, .user-link").removeClass("active");
    $(`.room-link[data-room-id="${roomId}"]`).addClass("active");
    $("#current-room-name").text(result.roomName);
    $("#welcome-message").hide();
    $("#chat-container").show();

    displayMessages(result.messages);
    $("#message-input").trigger('focus');
  } catch (err) {
    alert("Failed to join room: " + err.message);
  }
}

async function joinUserChat(userId, username) {
  if (currentUserId === userId) return;
  if (currentRoomId) {
    await Client.emit("room:leave", currentRoomId);
    currentRoomId = null;
  }

  try {
    const result = await Client.emit("user:join", userId);
    currentUserId = userId;

    $(".room-link, .user-link").removeClass("active");
    $(`.user-link[data-user-id="${userId}"]`).addClass("active");
    $("#current-room-name").text(result.username || username);
    $("#welcome-message").hide();
    $("#chat-container").show();

    displayMessages(result.messages);
    $("#message-input").trigger('focus');
  } catch (err) {
    alert("Failed to join chat: " + err.message);
  }
}

function displayMessages(messages) {
  const messagesArea = $("#messages-area");
  messagesArea.empty();

  messages.forEach((msg) => {
    appendMessage(msg);
  });

  scrollToBottom();
}

function appendMessage(msg) {
  const time = new Date(msg.dateSent).toLocaleTimeString();
  const messageEl = $("<div>").addClass("message");
  const userId = msg.userId || "";
  messageEl.html(`
    <span class="sender" data-user-id="${userId}">${escapeHtml(msg.user)}</span>
    <span class="timestamp">${time}</span>
    <div class="text">${escapeHtml(msg.message)}</div>
  `);
  $("#messages-area").append(messageEl);
  scrollToBottom();
}

function setupMessageListener() {
  Client.on("room:message", (msg) => {
    if (currentMode === "rooms" && currentRoomId) {
      appendMessage(msg);
    }
  });

  Client.on("user:message", (msg) => {
    if (currentMode === "users" && currentUserId) {
      appendMessage(msg);
    }
  });
}

function scrollToBottom() {
  const messagesArea = document.getElementById("messages-area");
  messagesArea.scrollTop = messagesArea.scrollHeight;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
