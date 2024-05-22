const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const userSchema = mongoose.Schema({
  username: {
    type: String,
    required: [true, "Please Tell Us Your Name"],
  },

  email: {
    type: String,
    required: [true, "Please Provide Your Email Adress"],
    unique: true,
  },

  password: {
    type: String,
    required: [true, "Please Provide Your Password"],
  },
  confirmPassword: {
    type: String,
    required: [true, "Please Confirm Your Password"],
    validate: {
      // This only works on CREATE and SAVE!!!
      validator: function (el) {
        return el === this.password;
      },
      message: "Passwords are not the same!",
    },
  },

  role: {
    type: String,
    enum: ["patient", "donor", "admin", "bloodBank"],
    default: "patient",
  },

  image: {
    type: [String],
  },

  location: {
    type: {
      type: String,
      default: "Point",
      enum: ["Point"],
    },
    coordinates: [Number],
    address: {
      type: String,
      required: [true, "you must provide an adrees"],
    },
    description: String,
    day: Number,
  },

  bloodBankName: {
    type: String,
  },

  passwordChangedAt: Date,
  // passwordResetToken: String,
  // passwordResetExpires: Date,
  verificationCode: Number,
  verficationCodeExpires: Date,
  resetCode: Number,
  resetCodeExpires: Number,
  validate: {
    //
    type: Boolean,
    default: false,
  },

  country: {
    type: String,
    required: [true, "you must provide a country "],
  },
  bloodUnits: Number,
  nationalID: Number,
  bloodGroup: String,
  valideBloodBank: {
    type: Boolean,
    default: false,
  },
  donationDate: {
    type: Date,
    default: Date.now(),
  },
});

userSchema.index({ location: "2dsphere" });

userSchema.pre("save", async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified("password")) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // Delete passwordConfirm field
  this.confirmPassword = undefined;
  next();
});

userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, function (next) {
  // this points to the current query
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimestamp < changedTimestamp;
  }

  // False means NOT changed
  return false;
};

// userSchema.methods.createPasswordResetToken = function () {
//   const resetToken = crypto.randomBytes(32).toString("hex");

//   this.passwordResetToken = crypto
//     .createHash("sha256")
//     .update(resetToken)
//     .digest("hex");

//   console.log({ resetToken }, this.passwordResetToken);

//   this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

//   return resetToken;
// };

const User = mongoose.model("User", userSchema);

module.exports = User;
