import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";

const styles = makeStyles((theme) => ({
  root: {
    marginTop: theme.spacing(10),
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    cursor: "pointer",
  },
}));

const StaticFles = (props) => {
  const classes = styles();

  const clickLink = () => {
    window.location.href = "/static_files";
  };

  return (
    <div className={classes.root} onClick={clickLink}>
      <div>
        <Typography variant="h4">Acessar Arquivos</Typography>
      </div>
    </div>
  );
};

export default StaticFles;
