import React from "react";
import { withRouter } from "react-router-dom";
import styles from "./styles";

export default withRouter((props) => {
  const classes = styles();

  return (
    <iframe
      className={classes.responsiveIframe}
      title="content"
      src="entry.html"
    ></iframe>
  );
});
