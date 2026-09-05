require("dotenv").config();

const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const FeatureType = require("../models/featureType");
const License = require("../models/license");
const LicenseType = require("../models/licenseType");
const Permission = require("../models/permission");
const Role = require("../models/role");
const Speech = require("../models/speech");
const User = require("../models/user");
const UserJournal = require("../models/userJournal");
const UserLicense = require("../models/userLicense");

const FREEMIUM_LICENSE_ID = new mongoose.Types.ObjectId(
  "65b799b92267c99026b2fa75"
);
const INDIVIDUAL_LICENSE_TYPE_ID = new mongoose.Types.ObjectId(
  "65b778d53f916531b1b232b2"
);

const CLIENT_PERMISSIONS = [
  "GET_MY_SPEECHES",
  "ADD_SPEECH",
  "UPDATE_SPEECH",
  "IMPROVE_SPEECH",
  "RECORD_VIDEO",
  "GET_MY_VIDEOS",
  "FETCH_ACTIVE_LICENSES_INFORMATION",
  "UPGRADE_PLAN",
];

const FEATURES = [
  { name: "ADD_SPEECH", credits: 2 },
  { name: "IMPROVE_SPEECH", credits: 2 },
  { name: "RECORD_VIDEO", credits: 2 },
];

const seed = async () => {
  if (!process.env.DB) {
    throw new Error("DB is not configured in .env");
  }

  await mongoose.connect(process.env.DB);

  const permissions = await Promise.all(
    CLIENT_PERMISSIONS.map((name) =>
      Permission.findOneAndUpdate(
        { name },
        { $set: { description: `Allows a client to use ${name}` } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
    )
  );

  const clientRole = await Role.findOneAndUpdate(
    { name: "CLIENT" },
    {
      $set: {
        description: "Standard XGOL client",
        permissions: permissions.map((permission) => permission._id),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await Promise.all(
    FEATURES.map(({ name, credits }) =>
      FeatureType.findOneAndUpdate(
        { name },
        { $set: { description: `Credit cost for ${name}`, credits } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
    )
  );

  const licenseType = await LicenseType.findOneAndUpdate(
    { _id: INDIVIDUAL_LICENSE_TYPE_ID },
    {
      $set: {
        name: "INDIVIDUAL",
        description: "Individual local-development license",
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const license = await License.findOneAndUpdate(
    { _id: FREEMIUM_LICENSE_ID },
    {
      $set: {
        licenseType: licenseType._id,
        name: "freemium",
        credits: 100,
        numberOfUsers: 1,
        validity: 12,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const email = (process.env.LOCAL_DEMO_EMAIL || "demo@xgol.local")
    .trim()
    .toLowerCase();
  const password = process.env.LOCAL_DEMO_PASSWORD || "XgolLocal123!";
  const passwordHash = await bcrypt.hash(password, Number(process.env.SALT) || 10);

  const user = await User.findOneAndUpdate(
    { "emails.0": email },
    {
      $setOnInsert: {
        firstName: "Local",
        lastName: "Demo",
        userName: "Local Demo",
        emails: [email],
        password: passwordHash,
        verified: true,
        role: [clientRole._id],
        hasSeenWalkthrough: false,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const expiryDate = new Date();
  expiryDate.setFullYear(expiryDate.getFullYear() + 1);
  const userLicense = await UserLicense.findOneAndUpdate(
    { user: user._id, license: license._id },
    {
      $set: {
        activated: true,
        activatedAt: new Date(),
        expiryDate: expiryDate.toISOString(),
      },
      $setOnInsert: {
        credits: license.credits,
        assignedAt: new Date(),
        licenseEmail: email,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await UserJournal.findOneAndUpdate(
    { user: user._id },
    { $setOnInsert: { transactions: [] } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await Speech.findOneAndUpdate(
    { user: user._id, title: "Welcome to XGOL" },
    {
      $setOnInsert: {
        text: "Welcome to XGOL. This sample speech is ready for your first local practice session.",
        userLicense: userLicense._id,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log("Local XGOL database seeded successfully.");
  console.log(`Database: ${mongoose.connection.name}`);
  console.log(`Demo email: ${email}`);
  console.log(`Demo password: ${password}`);
};

seed()
  .catch((error) => {
    console.error("Local seed failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
