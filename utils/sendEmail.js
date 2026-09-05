const { Resend } = require("resend");

module.exports = async (email, subject, template) => {
  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.RESEND_FROM || "XGOL <noreply@xgol.pro>",
      to: [email],
      subject: subject,
      html: template,
    });

    console.log("email sent successfully");
  } catch (error) {
    console.log("email not sent!");
    console.log(error);
    throw error;
  }
};



