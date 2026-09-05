const User = require("../../models/user");
const Video = require("../../models/video");
const Speech = require("../../models/speech");
const License = require("../../models/license");
const Role = require("../../models/role");
const UserJournal = require("../../models/userJournal");
const UserLicense = require("../../models/userLicense");
const journals = async (req,res) => {
    try {
      
      const jorunalss = await UserJournal.find();
  
   
      res.status(200).json({ journals: jorunalss });

    } catch (err) {
      console.error('Error updating user journals:', err);
    }
  };

const updateUserJournals = async (req,res) => {
    try {
  // Step 1: Retrieve all verified users
  const verifiedUsers = await User.find({ verified: true });

  // Step 2: Iterate through each verified user
  for (const user of verifiedUsers) {
    // Step 3: Find the corresponding active UserLicense
    const userLicense = await UserLicense.findOne({
      user: user._id,
      activated: true,
    });

    // Step 4: Set the transaction details
    const transaction = {
      type: "N/A",
      cost: 0,
      remainingBalance: userLicense ? userLicense.credits : 0,
    };

    // Step 5: Push the transaction into the user's journal
    await UserJournal.findOneAndUpdate(
      { user: user._id },
      { $push: { transactions: transaction } },
      { upsert: true, new: true }
    );
  }
  
      console.log('All verified user journals updated successfully.');
      res.status(200).json('All verified user journals updated successfully.');

    } catch (err) {
      console.error('Error updating user journals:', err);
    }
  };
  

  const getAttijariUsers = async (req, res) => {
    try {
        const licenseId = "6783bb280fbf2bf7918294b8";

        const license = await License.findById({
            _id: licenseId,
        }).populate("experts.user");

        const userLicenses = await UserLicense.find({
            license: licenseId,
        }).populate("user");

        const numberOfUserWithLicenses = userLicenses.length;
        const numberOfAllowedUsersWithinLicense = license.numberOfUsers;

        let totalDuration = 0;
        let totalRecordedVideos = 0;
        let totalExpertRequested = 0;
        let userDetails = [];
        let expertDetails = [];

        const formatTime = (timeInMilliseconds) => {
            const totalSeconds = Math.floor(timeInMilliseconds / 1000);
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;
        
            if (hours > 0) {
                return `${hours}h ${minutes}m ${seconds}s`;
            } else if (minutes > 0) {
                return `${minutes}m ${seconds}s`;
            } else {
                return `${seconds}s`;
            }
        };

        for (const license of userLicenses) {
            const videos = await Video.find({
                userLicense: license._id,
            });

            const durationSum = videos.reduce(
                (acc, video) => acc + (video.duration || 0),
                0
            );
            totalDuration += durationSum;

            const expertRequested = videos.filter(
                (video) => video.expertAssessmentRequired === true
            );
            const expertRequestedCount = expertRequested.length;
            totalExpertRequested += expertRequestedCount;

            const recordedVideosCount = videos.length;
            totalRecordedVideos += recordedVideosCount;
     
            const coachEvaluations = videos.filter(
                (video) => video.isEvaluated === true
            ).length;
           

            const userDetailsEntry = {
                active: license.activated,
                email: license.licenseEmail,
                recordedVideosCount: recordedVideosCount,
                totalDurationRecordedVideos: durationSum,
                coachEvaluationCount: coachEvaluations
            };

            if (license.user) {
                userDetailsEntry.userId = license.user._id;
                userDetailsEntry.userName = license.user.userName;
            }

            userDetails.push(userDetailsEntry);
        }

        // Process expert details
        for (const expert of license.experts) {
            if (expert.user) {
                expertDetails.push({
                    userId: expert.user._id,
                    userName: expert.user.userName,
                    email: expert.user.emails,
                    averageResponseTime: formatTime(expert.user.averageResponseTime || 0),
                    averageRatings: expert.user.averageRatings || 0,
                    numberOfRatings : expert.user.numberOfRatings || 0,
                });
            }
        }

        const htmlResponse = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>License Users</title>
                <style>
                    table {
                        width: 100%;
                        border-collapse: collapse;
                    }
                    table, th, td {
                        border: 1px solid black;
                    }
                    th, td {
                        padding: 8px;
                        text-align: left;
                    }
                </style>
            </head>
            <body>
                <h1>License Details Attijari Bank</h1>
                <p><strong>Number of Users with Licenses:</strong> ${numberOfUserWithLicenses}</p>
                <p><strong>Number of Allowed Users:</strong> ${numberOfAllowedUsersWithinLicense}</p>
           

                <h2>Users Details</h2>
                <table>
                    <thead>
                        <tr>
                       
                            <th>Username</th>
                            <th>Email</th>
                            <th>Recorded Videos Count</th>
                         
                            <th>Coach Evaluations Count</th>
                           
                            <th>Active</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${userDetails
                            .map((detail) => `
                                <tr>
                                    <td>${detail.userName}</td>
                                    <td>${detail.email}</td>
                                    <td>${detail.recordedVideosCount}</td>
                         
                                    <td>${detail.coachEvaluationCount}</td>
                          
                                    <td>${detail.active || "N/A"}</td>
                                </tr>
                            `)
                            .join("")}
                    </tbody>
                </table>

                <h2>Experts Details</h2>
                <table>
                    <thead>
                        <tr>
                       
                            <th>Expert Name</th>
                             <th>Email</th>
                            <th>Average Response Time</th>
                            <th>Average Ratings</th>
                              <th>Number of Ratings</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${expertDetails
                            .map((expert) => `
                                <tr>
                                
                                    <td>${expert.userName}</td>
                                    <td>${expert.email}</td>
                                    <td>${expert.averageResponseTime}</td>
                                    <td>${expert.averageRatings}</td>
                                    <td>${expert.numberOfRatings}</td>
                                </tr>
                            `)
                            .join("")}
                    </tbody>
                </table>
            </body>
            </html>
        `;

        res.send(htmlResponse);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

  

module.exports = {
    updateUserJournals,
    journals,
    getAttijariUsers,
};


