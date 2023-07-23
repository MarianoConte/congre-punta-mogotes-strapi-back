module.exports = {
  routes: [
    {
      method: "PUT",
      path: "/departamento/updateDepartamentos",
      handler: "departamento.updateDepartamentos",
      config: {
        auth: false,
      },
    },
  ],
};
