import React, { useState, useEffect } from "react";
import { Route, Redirect } from "react-router-dom";
import { makeStyles } from "@material-ui/core/styles";
import ReactLoading from "react-loading";

import { auth } from "../services";

const styles = makeStyles((theme) => ({
  loading: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    minHeight: "100vh",
  },
}));

const PrivateRoute = ({ component: Component, exact, path, role, ...rest }) => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const classes = styles();

  useEffect(() => {
    let isCurrent = true;
    const load = async () => {
      try {
        const result = await auth.isAuthenticated();
        if (result == null || !isCurrent) return;
        setIsAuthenticated(result);
        setLoading(false);
      } catch (err) {
        if (!isCurrent) return;
      }
    };
    load();

    return () => {
      isCurrent = false;
    };
  }, [setIsAuthenticated]);

  return (
    <Route
      {...rest}
      exact={exact}
      path={path}
      render={(props) => {
        if (isAuthenticated) {
          const userRole = auth.getAuthorization();
          // check if route is restricted by role
          if (role && role !== userRole) {
            // role not authorised so redirect to home page
            return (
              <Redirect
                to={{ pathname: "/client", state: { from: props.location } }}
              />
            );
          }

          // authorised so return component
          return <Component role={userRole} {...props} />;
        }
        if (loading) {
          return (
            <div className={classes.loading}>
              <ReactLoading
                type="bars"
                color="#F83737"
                height="5%"
                width="5%"
              />
            </div>
          );
        }

        return (
          <Redirect
            to={{ pathname: "/client/login", state: { from: props.location } }}
          />
        );
      }}
    />
  );
};

export default PrivateRoute