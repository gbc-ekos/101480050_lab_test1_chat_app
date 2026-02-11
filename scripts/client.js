const Client = (() => {
  let authSocket = null;
  let appSocket = null;

  function getToken() {
    return localStorage.getItem('token');
  }

  function isLoggedIn() {
    return !!getToken();
  }

  function connectAuthChannel() {
    if (authSocket) return authSocket;
    authSocket = io('/auth');
    return authSocket;
  }

  function connectAppChannel() {
    if (appSocket) return appSocket;

    const token = getToken();
    if (!token) {
      window.location.href = '/login.html';
      return;
    }

    appSocket = io('/app', {
      auth: { token }
    });

    appSocket.on('connect_error', (err) => {
      console.log('Auth failed:', err.message);
      logout();
    });

    return appSocket;
  }

  function register(username, password, firstname, lastname){
    return new Promise((resolve, reject) => {
      const socket = connectAuthChannel();
      socket.emit('register', { username, password, firstname, lastname }, (res) => {
        if (res.success) {
          localStorage.setItem('token', res.token);
          localStorage.setItem('username', res.name);
          socket.disconnect();
          authSocket = null;
          resolve(res);
        } else {
          reject(new Error(res.message));
        }
      });
    });
  }

  function login(username, password) {
    return new Promise((resolve, reject) => {
      const socket = connectAuthChannel();
      socket.emit('login', { username, password }, (res) => {
        if (res.success) {
          localStorage.setItem('token', res.token);
          localStorage.setItem('name', res.name);
          socket.disconnect();
          authSocket = null;
          resolve(res);
        } else {
          reject(new Error(res.message));
        }
      });
    });
  }

  function logout() {
    if (appSocket) appSocket.disconnect();
    if (authSocket) authSocket.disconnect();
    localStorage.clear();
    window.location.href = '/index.html';
  }  

  function emit(event, data) {
    return new Promise((resolve, reject) => {
      const socket = connectAppChannel();
      if (!socket) return reject(new Error('Not connected'));

      socket.emit(event, data, (res) => {
        if (res.error) reject(new Error(res.error));
        else resolve(res);
      });
    });
  }

  function on(event, callback) {
    const socket = connectAppChannel();
    if (socket) socket.on(event, callback);
  }

  return {
    register,
    login,
    logout,
    emit,
    on,
    isLoggedIn,
  };
})();