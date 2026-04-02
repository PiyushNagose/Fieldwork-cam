const httpClient = require("../utils/httpClient");

const forwardRequest = async ({
  method,
  url,
  data,
  headers = {},
  params = {},
}) => {
  const response = await httpClient({
    method,
    url,
    data,
    headers,
    params,
  });

  return response.data;
};

module.exports = { forwardRequest };