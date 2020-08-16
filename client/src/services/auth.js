const TOKEN_KEY = `@${process.env.REACT_APP_SERVICE_NAME_ABREV}-Token`;

const auth = {};

auth.isAuthenticated = () => window.localStorage.getItem(TOKEN_KEY) !== null;

auth.getToken = () => window.localStorage.getItem(TOKEN_KEY);

auth.setToken = (token) => window.localStorage.setItem(TOKEN_KEY, token);

auth.logout = () => {
  window.localStorage.removeItem(TOKEN_KEY);
};

export default auth;
