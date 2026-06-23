import { Provider } from "react-redux";
import { App } from "./App";
import { AdminAuthSync } from "./shared/config/AdminAuthSync";
import { store } from "./shared/store/store";
import "./index.css";

type AdminAppProps = {
  accessToken?: string;
};

const AdminApp = ({ accessToken }: AdminAppProps) => (
  <Provider store={store}>
    <AdminAuthSync token={accessToken} />
    <App />
  </Provider>
);

export default AdminApp;
