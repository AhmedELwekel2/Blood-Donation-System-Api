const crypto = require("crypto");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const User = require("./../models/User");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const sendEmail = require("./../utils/email");
const geocoder = require("../utils/nodeGeocoder");
const generateNumericCode = (length) => {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += Math.floor(Math.random() * 10); // Generates a number between 0 and 9
  }
  return code;
};

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  // if (process.env.NODE_ENV === "dev") cookieOptions.secure = true;

  res.cookie("jwt", token, cookieOptions);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const code = generateNumericCode(6);
  const address = req.body.address;
  const country = req.body.country;
  const role =
    req.body.role == "donor" ||
    req.body.role == "bloodBank" ||
    req.body.role == "admin"
      ? req.body.role
      : "patient";
  location = await geocoder.geocode({
    address,
    country,
  });
  console.log(location[0].longitude);

  // console.log(location);
  // console.log(code);
  const newUser = await User.create({
    username: req.body.username,
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    role: role,
    verificationCode: code,
    verficationCodeExpires: Date.now() + 10 * 60000,
    // address,
    country,
    location: {
      coordinates: [location[0].longitude, location[0].latitude],
      address,
    },
    // location,
  });
  // createSendToken(newUser, 201, res);

  try {
    await sendEmail({
      email: newUser.email,
      subject: "Your Verfication Code",
      message: `your verfication code ${code} is valid for 10 mminutes`,
    });
  } catch (err) {
    console.log(err);
  }

  createSendToken(newUser, 200, res);
});

// endpoint to send verficaion code if the user verfiction code expired
exports.sendVerficationCode = catchAsync(async (req, res, next) => {
  const code = generateNumericCode(6);
  await User.updateOne(
    { _id: req.user._id },
    { verificationCode: code, verficationCodeExpires: Date.now() + 10 * 60000 }
  );

  await sendEmail({
    email: req.user.email,
    subject: "Your Verfication Code",
    message: `your verfication code ${code} is valid for 10 mminutes`,
  });

  // console.log(req.user.email);
  res.status(300).json("the verfication has been sent to your email ");
});

exports.verfiyEmail = catchAsync(async (req, res, next) => {
  if (!req.user) {
    return next(
      new AppError("You must be logged in to be able to verfiy your account")
    );
  }

  verificationCode = req.body.verificationCode;
  // console.log(verficationCode);
  const user = await User.findOne({
    verificationCode: verificationCode,
    verficationCodeExpires: { $gt: Date.now() },
  });
  // if (user.validate == true) {
  //   return next(new AppError("the account is already verfied !"));
  // }
  console.log();
  if (!user) {
    return next(new AppError("The verfication code is invalid or has expired"));
  }

  user.validate = true;
  await user.save({ validateBeforeSave: false });

  res.status(300).json("congrats now your Account  is verfied ");
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError("Please provide email and password!", 400));
  }
  // 2) Check if user exists && password is correct
  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401));
  }

  // 3) If everything ok, send token to client
  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check of it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  // console.log(token);
  if (!token) {
    return next(
      new AppError("You are not logged in! Please log in to get access.", 401)
    );
  }

  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        "The user belonging to this token does no longer exist.",
        401
      )
    );
  }

  // 4) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError("User recently changed password! Please log in again.", 401)
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  // res.locals.user = currentUser

  // console.log(req.user);
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles ['admin', 'lead-guide']. role='user'
    // console.log(req.user.role);
    // console.log(roles);

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError("There is no user with email address.", 404));
  }

  const resetCode = generateNumericCode(6);

  user.resetCode = resetCode;
  user.resetCodeExpires = Date.now() + 10 * 60000;
  await user.save({ validateBeforeSave: false });

  const message = `Your Reset Password code is ${resetCode} is valid for 10 minutes `;

  try {
    await sendEmail({
      email: user.email,
      subject: "Your password reset token (valid for 10 min)",
      message,
    });

    res.status(200).json({
      status: "success",
      message: "reset Code sent to email!",
    });
  } catch (err) {
    user.resetCode = undefined;
    user.resetCodeExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError("There was an error sending the email. Try again later!"),
      500
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  resetCode = req.body.resetCode;
  const user = await User.findOne({
    resetCode,
    resetCodeExpires: { $gt: Date.now() },
  });

  // 2) If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError("reset code is invalid or has expired", 400));
  }
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.resetCode = undefined;
  user.resetCodeExpires = undefined;
  await user.save();

  // 3) Update changedPasswordAt property for the user
  // 4) Log the user in, send JWT
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  const user = await User.findById(req.user.id).select("+password");

  // 2) Check if POSTed current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError("Your current password is wrong.", 401));
  }

  // 3) If so, update password
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  await user.save();
  // User.findByIdAndUpdate will NOT work as intended!

  // 4) Log user in, send JWT
  createSendToken(user, 200, res);
});

exports.createAdmin = catchAsync((req, res, next) => {});
