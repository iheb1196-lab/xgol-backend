const Speech = require("../../models/speech");
const PracticeSession = require("../../models/practiceSession");

const {
  hasRequiredDelegatedPermissions,
} = require("../../middleware/permissionUtils");

/**This function allows the user to retrieve his speeches */
const getSpeeches = async (req, res) => {
  if (hasRequiredDelegatedPermissions(req.user, "GET_MY_SPEECHES")) {
    try {
      const speeches = await Speech.find({ user: req.user.id, deleted: false });

      const speechesWithSessionCount = [];
      for (let speech of speeches) {
        const sessionCount = await PracticeSession.countDocuments({
          speech: speech._id,
          deleted: false,
        });
        speechesWithSessionCount.push({
          id: speech._id,
          title: speech.title,
          createdAt: speech.createdAt,
          numberOfSessions: sessionCount,
        });
      }

      return res
        .status(200)
        .json({ status: "success", speeches: speechesWithSessionCount });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  } else {
    return res
      .status(403)
      .json({ error: "User does not have the required permissions" });
  }
};

const updateSpeech = async (req, res) => {
  if (!hasRequiredDelegatedPermissions(req.user, "UPDATE_SPEECH")) {
    return res.status(403).json({
      status: "Failed",
      message: "User does not have the required permissions",
    });
  }
  try {
    const speech = await Speech.findOne({
      _id: req.params.speech,
      user: req.user.id,
      deleted: false,
    });
    if (!speech) {
      return res.status(404).json({ error: "Speech not found" });
    }
    const text = (req.body.text || "").trim();
    if (!text) {
      return res.status(400).json({ error: "Please provide a speech!" });
    }

    speech.text = text;
    speech.title = req.body.title || speech.title;
    speech.updatedAt = new Date();

    const updatedSpeech = await speech.save();
    return res.status(200).json({ status: "Success", speech: updatedSpeech });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: "Failed", message: error.message });
  }
};

const getSpeech = async (req, res) => {
  if (hasRequiredDelegatedPermissions(req.user, "GET_MY_SPEECHES")) {
    try {
      const speech = await Speech.findOne({
        _id: req.params.speech,
        user: req.user.id,
        deleted: false,
      });
      if (!speech) {
        return res.status(404).json({ error: "Speech not found" });
      }
      return res.status(200).json({ status: "success", speech: speech });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  } else {
    return res
      .status(403)
      .json({ error: "User does not have the required permissions" });
  }
};

const deleteSpeech = async (req, res) => {
  if (hasRequiredDelegatedPermissions(req.user, "GET_MY_SPEECHES")) {
    try {
      const speechId = req.params.speech;

      const speech = await Speech.findOneAndUpdate(
        { _id: speechId, user: req.user.id, deleted: false },
        { deleted: true },
        { new: true }
      );

      if (!speech) {
        return res
          .status(404)
          .json({ status: "error", message: "Speech not found" });
      }

      await PracticeSession.updateMany(
        { speech: speechId, user: req.user.id },
        { deleted: true }
      );

      return res.status(200).json({
        status: "success",
        message: "Speech and corresponding practice sessions are deleted",
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  } else {
    return res
      .status(403)
      .json({ error: "User does not have the required permissions" });
  }
};

module.exports = { getSpeeches, getSpeech, deleteSpeech, updateSpeech };
