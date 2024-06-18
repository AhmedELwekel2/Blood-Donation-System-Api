const User = require("./../models/User");
const AppError = require("./../utils/appError");
const catchAsync = require("./../utils/catchAsync");
const Request = require("./../models/Request");
const DonationCamp = require("./../models/DonationCamp");
const geocoder = require("../utils/nodeGeocoder");

//  endpoint (Get) for the user with role patient with the help of restrict to middleware and geospatial query
// to search for the nearest user with role donor

exports.searchNearestDonors = catchAsync(async (req, res, next) => {
  // 1-dealing with the request form

  const address = req.body.hospitalAddress;
  const name = req.body.hospitalName;
  const country = req.body.country || "egypt";

  const location = await geocoder.geocode({
    address,
    country,
  });
  const coordinates = [location[0].longitude, location[0].latitude];
  await User.updateOne(
    { _id: req.user._id },
    {
      bloodUnits: req.body.bloodUnits,
      nationalID: req.body.nationalID,
      bloodGroup: req.body.bloodGroup,
      hospital: { coordinates, name, address },
    }
  );

  // filter the nearest doners based on the informations from the request form

  // const coordinates = req.user.location.coordinates;
  const maxDistance = req.body.maxDistance || 10000000;
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
    role: "donor",
  };

  const nearestDonors = await User.find(query).select([
    "email",
    "role",
    "location",
    "username",
    "profileImage",
  ]);

  res.status(300).json({ nearestDonors: nearestDonors });

  // const nearestDonors = User.find({
  //   location:
  // });
});

// endpoint for creating a request form // to update information about the patient in the database

// exports.createRequestForm = catchAsync(async (req, res, next) => {
//   await User.updateOne(
//     { _id: req.user._id },
//     {
//       bloodUnits: req.body.bloodUnits,
//       nationalID: req.body.nationalID,
//       bloodGroup: req.body.bloodGroup,
//     }
//   );
//   res.status(300).json("thanks for entering Your informations ");
// });

//endpoint to create (Post) request to the donor in the nearest location that you got from the first endpoint you created
exports.createDonationRequest = catchAsync(async (req, res, next) => {
  // const ids = req.params.donorsId.split(" ");
  // to update the blood  units the patient needs from donors
  // await User.updateOne(
  //   { _id: req.user._id },
  //   { bloodUnits: req.body.bloodUnits }
  // );
  // to create request for donors you choose based on your searching
  for (let i = 0; i < req.body.doners.length; i++) {
    const request = await Request.create({
      patient: req.user._id,
      donor: req.body.doners[i],
    });
  }
  res.status(300).json("You Succeffuly Sent Donations Requests");
});
// endpoint to get the requests sends to the donor so he could accept or refuse
exports.sentedRequests = catchAsync(async (req, res, next) => {
  const sentedRequests = await Request.find({ donor: req.user._id });
  console.log(sentedRequests);

  res.status(300).json(sentedRequests);
});
//endpoint to make the donor accept or refuse the request
// exports.updateRequest = catchAsync(async (req, res, next) => {
//   if (req.body.status == "accepted") {
//     const patient = await User.find({ _id: req.params.userId });
//     const bloodUnits = patient[0].bloodUnits;
//     console.log(bloodUnits);
//     if (patient[0].bloodUnits > 0) {
//       await User.updateOne(
//         { _id: req.params.userId },
//         { bloodUnits: bloodUnits - 1 }
//       );
//       await Request.updateOne(
//         { _id: req.params.requestId },
//         { status: req.body.status }
//       );
//       return res.status(
//         "Thanks for updating Your Request status we are waiting for the donation check .."
//       );
//     } else {
//       return res.status(
//         "Thanks For Accepting the request but it is no longer needed since the patient get the donations from other donors"
//       );
//     }
//   }
//   await Request.updateOne(
//     { _id: req.params.requestId },
//     { status: req.body.status }
//   );
//   return res.status(300).json("Thanks for updating Your Request status ");
// });
// to make the donor entering the donation check

exports.updateRequest = catchAsync(async (req, res, next) => {
  // const { userId, requestId } = req.params;
  const requestId = req.params.requestId;
  const status = req.params.status;
  const request = await Request.find({ _id: requestId });
  const currentDate = new Date();
  currentDate.setMonth(currentDate.getMonth() + 3);
  // you deal with request from the patient to the donor
  // console.log(request);
  if (request[0].patient) {
    if (status === "accepted") {
      const patient = await User.findById(request[0].patient);

      if (!patient) {
        return res.status(404).json({ message: "User not found" });
      }

      const bloodUnits = patient.bloodUnits;

      if (req.user.donationDate > Date.now()) {
        return next(
          new AppError(
            "it is not been so long since the first donation please take it slowly"
          )
        );
      }

      if (bloodUnits > 0) {
        // Update the blood units and request status
        await User.updateOne(
          { _id: request.patient },
          { bloodUnits: bloodUnits - 1 }
        );
        await Request.updateOne({ _id: requestId }, { status });
        await User.updateOne(
          { _id: req.user._id },
          { donationDate: currentDate }
        );

        return res.status(200).json({
          message:
            "Thanks for updating your request status. We are waiting for the donation check.",
        });
      } else {
        return res.status(200).json({
          message:
            "Thanks for accepting the request, but it is no longer needed since the patient received donations from other donors or he no longer need donations.",
        });
      }
    } else {
      // Update the request status if it's not "accepted"
      await Request.updateOne({ _id: requestId }, { status });

      return res.status(200).json({
        message: "Thanks for updating your request status.",
      });
    }
  } else {
    if (status == "accepted") {
      if (req.user.donationDate > Date.now()) {
        return next(
          new AppError(
            "it is not been so long since the first donation please take it slowly"
          )
        );
      }
      await Request.updateOne({ _id: requestId }, { status });
      await User.updateOne(
        { _id: req.user._id },
        { donationDate: currentDate }
      );

      return res.status(200).json({
        message:
          "Thanks for updating your request status. We are waiting for Your visit to our camp.",
      });
    } else {
      await Request.updateOne({ _id: requestId }, { status });

      return res.status(200).json({
        message: "Thanks for updating your request status.",
      });
    }
  }
});

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

// to make the patient getting the accepted requests from donors

exports.getAcceptedRequests = catchAsync(async (req, res, next) => {
  //when dealing with patient donor
  if (req.params.donationCamp) {
    acceptedRequest = await Request.find({
      status: "accepted",
      bloodBank: req.user._id,
      donationCamp: req.params.donationCamp,
    });
    return res.status(300).json(acceptedRequest);
  }

  acceptedRequest = await Request.find({
    status: "accepted",
    patient: req.user._id,
  })
    .populate("donor", "username location email profileImage ")
    .populate("patient", "username location email profileImage");

  res.status(300).json(acceptedRequest);
});

/// to find the nearest blood bank in the location the doner in

exports.findNearestBloodBank = catchAsync(async (req, res, next) => {
  const coordinates = [
    req.user.location[0].longitude,
    req.user.location[0].latitude,
  ];

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
    role: "bloodBank",
  };
  const nearestBloodBank = await User.find(query);

  res.status(300).json(nearestBloodBank);
});

///// reamining taks the logic for the blood unit doneee
///// the blood bank endpoints reamining
/////////////////////////////////// Blood Bank Endpoints //////////////////////////////

// only admin can validate blood bank
exports.verfiyBloodBank = catchAsync(async (req, res, next) => {
  await User.updateOne({ _id: req.params.id }, { valideBloodBank: true });
  res.status(200).json({ message: "You just verified the Blood Bank" });
});
// create donation camp
exports.createDonationCamp = catchAsync(async (req, res, next) => {
  if (!req.user.valideBloodBank) {
    return next(
      new AppError(
        "we are sorry you couldnt create dontaion camp without validating that you are real blood bank"
      )
    );
  }
  const address = req.body.address;
  const country = req.body.country || "egypt";
  const [year, month, day] = req.body.date.split("-");

  const location = await geocoder.geocode({
    address,
    country,
  });
  coordinates = [location[0].longitude, location[0].latitude];
  // query searching the nearest donors
  console.log(coordinates);
  const query = {
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates,
        },
        $maxDistance: 10000000, // in meters
      },
    },
    role: "donor",
  };
  // 1-create the donation camp
  const newDonationCamp = await DonationCamp.create({
    name: req.body.name,
    location: { coordinates },
    bloodBank: req.user._id,
    date: new Date(year, month - 1, day),
  });

  // 2-search nearest donors
  const nearestDonors = await User.find(query).select([
    "email",
    "role",
    "location",
    "name",
  ]);
  console.log(nearestDonors);
  // 3- sending requests to the nearest donors
  for (let i = 0; i < nearestDonors.length; i++) {
    await Request.create({
      donationCamp: newDonationCamp._id,
      donor: nearestDonors[i],
    });
  }

  res
    .status(300)
    .json(
      "The donation camp is created Wait for the donors to accept Your invitation"
    );
});

exports.getAcceptedRequestsDonationCamp = catchAsync(async (req, res, next) => {
  acceptedRequest = await Request.find({
    status: "accepted",
    donationCamp: req.params.donationCamp,
  });
  // console.log(acceptedRequest);
  return res.status(300).json(acceptedRequest);
});

exports.getDonationCamps = catchAsync(async (req, res, next) => {
  // find donation camps created by the blood bank
  const donationCamps = await DonationCamp.find({ bloodBank: req.user._id });
  res.status(300).json(donationCamps);
});
// endpoint to update the role of the user
exports.updateRole = catchAsync(async (req, res, next) => {
  await User.updateOne({ _id: req.user._id }, { role: req.body.role });

  res.status(300).json(`Your role updated to ${req.body.role}`);
});

// endpoint to get the user that logged in

exports.getMe = catchAsync(async (req, res, next) => {
  const user = await User.find({ _id: req.user._id });
  res.status(300).json(user);
});
