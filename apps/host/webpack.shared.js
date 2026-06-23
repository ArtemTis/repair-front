const deps = require("./package.json").dependencies;

const sharedDependency = (name, { eager = false } = {}) => ({
  singleton: true,
  strictVersion: false,
  eager,
  requiredVersion: deps[name],
});

module.exports = {
  react: sharedDependency("react", { eager: true }),
  "react-dom": sharedDependency("react-dom", { eager: true }),
  "react-router-dom": sharedDependency("react-router-dom", { eager: true }),
  "@reduxjs/toolkit": sharedDependency("@reduxjs/toolkit", { eager: true }),
  "react-redux": sharedDependency("react-redux", { eager: true }),
};
