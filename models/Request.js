const mongoose = require("mongoose");
const User = require("./User");
const DonationCamp = require("./DonationCamp");

const requestSchema = mongoose.Schema({
  status: {
    type: String,
    enum: ["accepted", "denied", "suspended"],
    default: "suspended",
  },

  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: User,
  },

  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: User,
  },
  donationCamp: {
    type: mongoose.Schema.Types.ObjectId,
    ref: DonationCamp,
  },
  donationCheck: {
    type: String,
    default: "in progress",
  },
});

const Request = mongoose.model("Request", requestSchema);

module.exports = Request;
