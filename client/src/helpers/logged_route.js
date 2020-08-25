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

export default ({ component: Component, exact, path, role, ...rest }) => {
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
          return (
            <Redirect to={{ pathname: "/", state: { from: props.location } }} />
          );
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

        return <Component {...props} />;
      }}
    />
  );
};
