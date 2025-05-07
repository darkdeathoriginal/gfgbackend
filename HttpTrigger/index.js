// HttpTrigger/index.js
module.exports = async function (context, req) {
  context.res = {
    body: "Hello from Azure Functions!"
  };
};
