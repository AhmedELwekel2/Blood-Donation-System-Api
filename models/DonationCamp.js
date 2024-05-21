const mongoose = require("mongoose");

const User = require("./User");

const donationCampSchema = mongoose.Schema({
  bloodBank: {
    type: mongoose.Schema.Types.ObjectId,
    ref: User,
  },
  location: [
    {
      type: {
        type: String,
        default: "Point",
        enum: ["Point"],
      },
      coordinates: [Number],
      address: String,
      description: String,
      day: Number,
    },
  ],
  date: {
    type: Date,
  },
  name: {
    unique: true,
    type: String,
  },
});

const DonationCamp = mongoose.model("DonationCamp", donationCampSchema);

module.exports = DonationCamp;
