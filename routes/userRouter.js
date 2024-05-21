const express = require("express");
const authController = require("./../controllers/authController");
const userRouter = express.Router();
const userController = require("./../controllers/userController");
userRouter.get(
  "/patient/searchNearestDoners",
  authController.protect,
  authController.restrictTo("patient"),
  userController.searchNearestDoners
);

userRouter.post("/signup", authController.signup);

userRouter.post("/login", authController.login);

userRouter.post(
  "/verfiyEmail",
  authController.protect,
  authController.verfiyEmail
);
userRouter.post("/forgotPassword", authController.forgotPassword);

userRouter.post("/resetPassword", authController.resetPassword);

userRouter.post(
  "/patient/requestDonations/:donersId",
  authController.protect,
  authController.restrictTo("patient"),
  userController.createDonationRequest
);

userRouter.get(
  "/doner/sentedRequests",
  authController.protect,
  authController.restrictTo("doner"),
  userController.sentedRequests
);

userRouter.post(
  "/patient/createRequestForm",
  authController.protect,
  authController.restrictTo("patient"),
  userController.createRequestForm
);
userRouter.post(
  "/doner/updateRequest/:requestId/:status",
  authController.protect,
  authController.restrictTo("doner"),
  userController.updateRequest
);

userRouter.post(
  "/doner/updateDonationCheck/:id",
  authController.protect,
  authController.restrictTo("doner"),
  userController.updateDonationCheck
);

userRouter.get(
  "/patient/acceptedRequests/",
  authController.protect,
  authController.restrictTo("patient"),
  userController.getAcceptedRequests
);
userRouter.post(
  "/admin/verfiyBloodBank/:id",
  authController.protect,
  authController.restrictTo("admin"),
  userController.verfiyBloodBank
);
userRouter.post(
  "/bloodBank/createDonationCamp",
  authController.protect,
  authController.restrictTo("bloodBank"),
  userController.createDonationCamp
);

userRouter.get(
  "/bloodBank/acceptedRequests/:donationCamp",
  authController.protect,
  authController.restrictTo("bloodBank"),
  userController.getAcceptedRequestsDonationCamp
);
module.exports = userRouter;
