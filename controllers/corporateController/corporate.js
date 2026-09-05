const Corporate = require("../../models/corporate");

const {
  hasRequiredDelegatedPermissions,
} = require("../../middleware/permissionUtils");

// Function to create a corporate
const createCorporate = async (req, res) => {
  if (hasRequiredDelegatedPermissions(req.user, "CREATE_CORPORATE")) {
    try {
      const corporate = new Corporate({
        ...req.body,
      });
      await corporate.save();
      res
        .status(201)
        .json({ message: "Corporate added successfully", corporate });
    } catch (error) {
      res.status(500).json({ message: error.message });
    } }else {
      return res
      .status(500)
      .json({ error: "User does not have the required permissions" });
    }

};


const getCorporates = async (req, res) => {
  if (hasRequiredDelegatedPermissions(req.user, "FETCH_CORPORATES")) {
  try {

    const corporates = await Corporate.find({});
    res
      .status(201)
      .json({ message: "Corporates fetched successfully", corporates });
  } catch (error) {
    res.status(500).json({ message: error.message });
  } }else {
    return res
    .status(500)
    .json({ error: "User does not have the required permissions" });
  }
};


module.exports = {
  createCorporate,
  getCorporates,
};
