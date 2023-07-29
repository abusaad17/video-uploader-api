import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";



export const SlotService = {
    generateAccessToken: async (email, password, persist) => {
        if (!email) {
            throw { code: 400, message: "Invalid value for: email" };
        }
        if (!password) {
            throw { code: 400, message: "Invalid value for: password" };
        }

        const existingUser = await User.findOne({ email: email });
        console.log(existingUser)
        if (!existingUser) {
            throw { code: 401, message: "Invalid email address or password" };
        }
        console.log(existingUser.password)
        const passwordValid = await bcrypt.compare(password, existingUser.password);
        if (!passwordValid) {
            throw { code: 401, message: "Invalid email address or password" };
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
            accessToken: accessToken
        };
    },

    createUser: async (data) => {
        if (!data.firstname) {
            throw { code: 400, message: "Firstname is required" };
        }
        if (!data.lastname) {
            throw { code: 400, message: "Lastname is required" };
        }
        if (!data.password) {
            throw { code: 400, message: "Password is required" };
        }
        const existingUser = await User.findOne({ email: data.email }).exec();
        if (existingUser) {
            throw { code: 409, message: `User already exists: ${data.email}` };
        }
        const passwordSalt = await bcrypt.genSalt();
        const encryptedPassword = await bcrypt.hash(data.password, passwordSalt);
        const newUser = new User({
            firstname: data.firstname,
            lastname: data.lastname,
            email: data.email,
            password: encryptedPassword
        });
        newUser.save().catch((err) => {
            console.error(err);
            throw { code: 500, message: "Failed to save user" };
        });
        return true;
    },
}