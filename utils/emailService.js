import nodemailer from "nodemailer";
import { User } from "../models/user.model.js";

export const generatePassword = (firstname, lastname, number) => {
  const firstPart = firstname.slice(0, 2).toLowerCase();
  const secondPart = lastname.slice(0, 2).toLowerCase();
  const numberPart = number.slice(-4);
  return `${firstPart}${secondPart}${numberPart}`;
};

export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export const sendPasswordEmail = async (data, password) => {
  try {
    // Create a transporter object
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // use SSL
      auth: {
        user: process.env.GMAIL_USERNAME,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    // Configure the mailoptions object
    const mailOptions = {
      from: process.env.GMAIL_USERNAME,
      to: data.email,
      subject: `Thanks, ${data.firstname} for onboarding on Video Uploader !!`,
      text: `Your automated password is: ${password} . Keep it safe and handy .Use this password for further using Video Uploader Services. Thanks !!`,
    };

    // Send the email
    transporter.sendMail(mailOptions, async function (error, info) {
      if (error) {
        const existingUser = await User.findOne({ email: data.email });
        if (existingUser) {
          await User.findByIdAndDelete(existingUser._id);
        }
        console.log("Error:", error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });
  } catch (error) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      await User.findByIdAndDelete(existingUser._id);
    }
    console.error("Nodemailer Error:", error);
    throw new Error("Failed to send email. Please try again later.");
  }
};
