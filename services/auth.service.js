import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { generatePassword, sendPasswordEmail } from "../utils/emailService.js";

export const AuthService = {
  generateAccessToken: async (firstname, password, persist) => {
    if (!firstname) {
      throw { code: 400, message: "Invalid value for: firstname" };
    }
    if (!password) {
      throw { code: 400, message: "Invalid value for: password" };
    }

    const existingUser = await User.findOne({ firstname: firstname });
    if (!existingUser) {
      throw { code: 401, message: "Invalid firstname or password" };
    }
    const passwordValid = await bcrypt.compare(password, existingUser.password);
    if (!passwordValid) {
      throw { code: 401, message: "Invalid firstname or password" };
    }

    const accessTokenResponse = {
      id: existingUser._id,
      firstname: existingUser.firstname,
      lastname: existingUser.lastname,
      email: existingUser.email,
    };

    const accessToken = jwt.sign(
      accessTokenResponse,
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: persist ? "1y" : "8h",
      }
    );

    return {
      email: existingUser.email,
      accessToken: accessToken,
    };
  },

  createUser: async (data) => {
    if (!data.firstname) {
      throw { code: 400, message: "Firstname is required" };
    }
    if (!data.lastname) {
      throw { code: 400, message: "Lastname is required" };
    }
    if (!data.number) {
      throw { code: 400, message: "number is required" };
    }
    if (!data.email) {
      throw { code: 400, message: "Email is required" };
    }

    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      throw { code: 409, message: `User already exists: ${data.email}` };
    }

    const generatedPassword = await generatePassword(
      data.firstname,
      data.lastname,
      data.number
    );
    const passwordSalt = await bcrypt.genSalt();
    const encryptedPassword = await bcrypt.hash(
      generatedPassword,
      passwordSalt
    );

    const newUser = new User({
      firstname: data.firstname,
      lastname: data.lastname,
      email: data.email,
      number: data.number,
      password: encryptedPassword,
    });

    try {
      await newUser.save();
      await sendPasswordEmail(data.email, generatedPassword);
      return true;
    } catch (err) {
      console.error(err);
      throw { code: 500, message: "Failed to create user or send email" };
    }
  },
};
