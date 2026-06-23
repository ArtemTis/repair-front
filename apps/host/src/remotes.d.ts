declare module "admin/AdminApp" {
  import { ComponentType } from "react";

  const AdminApp: ComponentType<{ accessToken?: string }>;
  export default AdminApp;
}
