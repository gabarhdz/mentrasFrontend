import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App";
import "./index.css";
import { googleClientId, getGoogleOriginError } from "./lib/google-auth";

const app = (
  <BrowserRouter>
    <App />
  </BrowserRouter>
);

const currentOrigin = window.location.origin;
const googleOriginError = getGoogleOriginError(currentOrigin);

ReactDOM.createRoot(document.getElementById("root")!).render(
  googleClientId && !googleOriginError ? (
    <GoogleOAuthProvider clientId={googleClientId}>{app}</GoogleOAuthProvider>
  ) : (
    app
  )
);
