const mongoose = require("mongoose");
const User = require("./User");
const DonationCamp = require("./DonationCamp");

const requestSchema = mongoose.Schema({
  status: {
    type: String,
    enum: ["accepted", "denied", "suspended"],
    default: "suspended ",
  },

  doner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: User,
  },

  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: User,
  },
  donationcamp: {
    type: mongoose.Schema.Types.ObjectId,
    ref: User,
  },
});

const Request = mongoose.model("Request", requestSchema);

module.exports = Request;


