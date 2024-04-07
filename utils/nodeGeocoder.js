const NodeGeocoder = require("node-geocoder");

const options = {
  provider: "locationiq",

  // Optional depending on the providers
  // fetch: customFetchImplementation,
  apiKey: "pk.8e513ebe7aea28d0bede2bddf292dc23", // for Mapquest, OpenCage, APlace, Google Premier
  formatter: null, // 'gpx', 'string', ...
};

const geocoder = NodeGeocoder(options);

module.exports = geocoder;
