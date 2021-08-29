import React from "react";
import { Router, Route, Switch } from "react-router-dom";

import { history } from "./services";
import { PrivateRoute, LoggedRoute } from "./helpers";

import Login from "./Login";
import NaoEncontrado from "./NaoEncontrado";
import Erro from "./Erro";
import Main from "./Main";

const Routes = () => (
  <Router history={history}>
    <Switch>
      <PrivateRoute exact path="/client" component={Main} />
      <LoggedRoute exact path="/client/login" component={Login} />
      <Route exact path="/client/erro" component={Erro} />
      <Route path="/client/*" component={NaoEncontrado} />
    </Switch>
  </Router>
);

export default Routes;
