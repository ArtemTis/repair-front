const deps = require("./package.json").dependencies;

const sharedDependency = (name) => ({
  singleton: true,
  strictVersion: false,
  requiredVersion: deps[name],
});

module.exports = {
  react: sharedDependency("react"),
  "react-dom": sharedDependency("react-dom"),
  "react-router-dom": sharedDependency("react-router-dom"),
  "@reduxjs/toolkit": sharedDependency("@reduxjs/toolkit"),
  "react-redux": sharedDependency("react-redux"),
};
