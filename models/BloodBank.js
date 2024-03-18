const mongoose = require("mongoose");

const bloodbankSchema = mongoose.Schema({
  name: {
    type: string,
  },
  adress: {
    type: string,
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

  openingtTime: {
    type: Date,
  },
});
