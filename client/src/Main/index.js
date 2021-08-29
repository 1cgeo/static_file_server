import React from "react";
import { withRouter, HashRouter, NavLink } from "react-router-dom";
import clsx from "clsx";
import AppBar from "@material-ui/core/AppBar";
import Container from "@material-ui/core/Container";
import Toolbar from "@material-ui/core/Toolbar";
import IconButton from "@material-ui/core/IconButton";
import Typography from "@material-ui/core/Typography";
import ExitToAppIcon from "@material-ui/icons/ExitToApp";
import VerifiedUserIcon from "@material-ui/icons/VerifiedUser";
import DescriptionIcon from "@material-ui/icons/Description";

import styles from "./styles";
import { handleLogout } from "./api.js";
import { PrivateRoute } from "../helpers";

import GerenciarUsuarios from "../GerenciarUsuarios";
import StaticFiles from "../StaticFiles";

export default withRouter((props) => {
  const classes = styles();

  const clickLogout = () => {
    handleLogout();
    props.history.push("/client/login");
  };

  return (
    <div className={classes.root}>
      <HashRouter>
        <AppBar position="absolute" className={clsx(classes.appBar)}>
          <Toolbar className={classes.toolbar}>
            <Typography
              component="h1"
              variant="h6"
              color="inherit"
              noWrap
              className={classes.title}
            >
              {process.env.REACT_APP_SERVICE_NAME}
            </Typography>
            {props.role === "ADMIN" && (
              <>
                <IconButton
                  color="inherit"
                  component={NavLink}
                  replace
                  exact
                  to="/"
                >
                  <Typography
                    variant="body1"
                    color="inherit"
                    noWrap
                    className={classes.title}
                  >
                    Acessar Arquivos
                  </Typography>
                  <DescriptionIcon className={classes.logoutButton} />
                </IconButton>
                <IconButton
                  color="inherit"
                  component={NavLink}
                  replace
                  exact
                  to="/gerenciar_usuarios"
                >
                  <Typography
                    variant="body1"
                    color="inherit"
                    noWrap
                    className={classes.title}
                  >
                    Gerenciar Usuários
                  </Typography>
                  <VerifiedUserIcon className={classes.logoutButton} />
                </IconButton>
              </>
            )}
            <IconButton color="inherit" onClick={clickLogout}>
              <Typography
                variant="body1"
                color="inherit"
                noWrap
                className={classes.title}
              >
                Sair
              </Typography>
              <ExitToAppIcon className={classes.logoutButton} />
            </IconButton>
          </Toolbar>
        </AppBar>
        <main className={classes.content}>
          <div className={classes.appBarSpacer} />
          <Container maxWidth="xl" className={classes.container}>
            <PrivateRoute exact path="/" component={StaticFiles} />
            <PrivateRoute
              role="ADMIN"
              exact
              path="/gerenciar_usuarios"
              component={GerenciarUsuarios}
            />
          </Container>
        </main>
      </HashRouter>
    </div>
  );
});
