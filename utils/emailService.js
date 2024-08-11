import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import { User } from "../models/user.model.js";


export const generatePassword = (firstname, lastname, number) => {
  const firstPart = firstname.slice(0, 2).toLowerCase();
  const secondPart = lastname.slice(0, 2).toLowerCase();
  const numberPart = number.slice(-4);
  return `${firstPart}${secondPart}${numberPart}`;
};

export const sendPasswordEmail = async (email, password) => {
  try {
    // Create a transporter object
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // use SSL
      auth: {
        user: "abusaadgulzar1@gmail.com",
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    // Configure the mailoptions object
    const mailOptions = {
      from: "abusaadgulzar1@gmail.com",
      to: "abusaad.dev3@gmail.com",
      subject: "Sending Email using Node.js",
      text: "That was easy!",
    };

    // Send the email
    transporter.sendMail(mailOptions, async function (error, info) {
      if (error) {
        const existingUser = await User.findOne({ email });
        await User.findByIdAndDelete(existingUser._id);
        console.log("Error:", error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });
  } catch (error) {
    const existingUser = await User.findOne({ email });
    await User.findByIdAndDelete(existingUser._id);
    console.error("Nodemailer Error:", error);
    throw new Error("Failed to send email. Please try again later.");
  }
};
