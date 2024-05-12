const User = require("./../models/User");
const AppError = require("./../utils/appError");
const catchAsync = require("./../utils/catchAsync");
const Request = require("./../models/Request");

//  endpoint (Get) for the user with role patient with the help of restrict to middleware and geospatial query
// to search for the nearest user with role doner

exports.searchNearestDoners = catchAsync(async (req, res, next) => {
  const coordinates = req.user.location.coordinates;
  const maxDistance = req.body.maxDistance;
  // console.log(req.user.location);
  // console.log(coordinates);
  const query = {
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: coordinates,
        },
        $maxDistance: maxDistance, // in meters
      },
    },
    role: "doner",
  };

  const nearestDoners = await User.find(query).select([
    "email",
    "role",
    "location",
  ]);

  res.status(300).json({ nearestDoners: nearestDoners });

  // const nearestDoners = User.find({
  //   location:
  // });
});

// endpoint for creating a request form // to update information about the patient in the database

exports.createRequestForm = catchAsync(async (req, res, next) => {
  await User.updateOne(
    { _id: req.user._id },
    {
      bloodUnits: req.body.bloodUnits,
      nationalID: req.body.nationalID,
      bloodGroup: req.body.bloodGroup,
    }
  );
  res.status(300).json("thanks for entering Your informations ");
});

//endpoint to create (Post) request to the doner in the nearest location that you got from the first endpoint you created
exports.createDonationRequest = catchAsync(async (req, res, next) => {
  const ids = req.params.donersId.split(" ");
  // to update the blood  units the patient needs from doners
  // await User.updateOne(
  //   { _id: req.user._id },
  //   { bloodUnits: req.body.bloodUnits }
  // );
  // to create request for doners you choose based on your searching
  for (let i = 0; i < ids.length; i++) {
    const request = await Request.create({
      patient: req.user._id,
      doner: ids[i],
    });
  }
  res.status(300).json("You Succeffuly Sent Donations Requests");
});
// endpoint to get the requests sends to the doner so he could accept or refuse
exports.sentedRequests = catchAsync(async (req, res, next) => {
  const sentedRequests = await Request.find({ doner: req.user._id });

  res.status(300).json(sentedRequests);
});
//endpoint to make the doner accept or refuse the request
exports.updateRequest = catchAsync(async (req, res, next) => {
  await Request.updateOne({ _id: req.params.id }, { status: req.body.status });
  return res
    .status(300)
    .json(
      "Thanks for updating Your Request status we are waiting for the donation check .. "
    );
});
// to make the doner entering the donation check
exports.updateDonationCheck = catchAsync(async (req, res, next) => {
  await Request.updateOne(
    { _id: req.params.id },
    { donationCheck: req.body.donationCheck }
  );
  res
    .status(300)
    .json(
      "Thanks the donaion Check have been sent to the patient thanks for your helping"
    );
});

// to make the patient getting the accepted requests from doners

exports.getAcceptedRequests = catchAsync(async (req, res, next) => {
  acceptedRequest = await Request.find({
    status: "accepted",
    patient: req.user._id,
  });

  res.status(300).json(acceptedRequest);
});

///// reamining taks the logic for the blood unit

/////////////////////////////////// Blood Bank Endpoints //////////////////////////////

// only admin can create blood bank
exports.createBloodBank = catchAsync(async (req, res, next) => {});
