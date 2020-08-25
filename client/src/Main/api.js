import { api, auth } from "../services";

const handleLogout = async () => {
  auth.logout();
  return api.post("/api/login/end_session");
};

export { handleLogout };
