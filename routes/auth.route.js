import { AuthService } from "../services/auth.service.js";
import { User } from "../models/user.model.js";
import { Authorize } from "../middleware/auth.js";
export const AuthRoutes = (app) => {
  app.post("/api/accounts/login", async (req, res) => {
    try {
      const { firstname, password } = req.body;
      if (!firstname) {
        throw { code: 400, message: "Email ID is required" };
      }
      if (!password) {
        throw { code: 400, message: "Password is required" };
      }
      const accessToken = await AuthService.generateAccessToken(
        firstname,
        password
      );
      if (!accessToken) {
        throw { code: 500, message: "Failed to generate access token" };
      }
      const user = await User.findOne({ email: accessToken.email });
      if (!user) {
        throw { code: 404, message: "User not found" };
      }
      if (user && accessToken) {
        res.status(200).send({
          token: accessToken.accessToken,
          userId: accessToken.userId,
        });
      } else {
        // User not found or access token is invalid
        res
          .status(404)
          .json({ error: "User not found or access token is invalid" });
      }
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  });

  app.post("/api/accounts/register", async (req, res) => {
    try {
      await AuthService.createUser(req.body);
      res
        .status(200)
        .send({ code: 200, message: "User registered successfully!" });
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  });

  app.get("/api/accounts/userdata", Authorize(), async (req, res) => {
    try {
      const user = await User.findOne({ email: req.user.email });
      if (!user) {
        throw { code: 404, message: "User not found" };
      }
      res
        .status(200)
        .send({
          firstname: user?.firstname,
          lastname: user?.lastname,
          email: user?.email,
          number: user?.number,
          thumbnail: user?.thumbnail,
          bio: user?.bio,
        });
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  });

  app.post("/api/accounts/addbio", Authorize(), async (req, res) => {
    try {
      const user = await User.findOne({ email: req.user.email });
      if (!user) {
        throw { code: 404, message: "User not found" };
      }
      await User.findByIdAndUpdate(user._id, {
        bio: req.body.bio,
      })
      res
        .status(200)
        .send({
          message: "Bio updated successfully"
        });
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  });

  app.post("/api/accounts/addthumbnail", Authorize(), async (req, res) => {
    try {
      const user = await User.findOne({ email: req.user.email });
      if (!user) {
        throw { code: 404, message: "User not found" };
      }
      await User.findByIdAndUpdate(user._id, {
        thumbnail: req.body.thumbnail,
      })
      res
        .status(200)
        .send({
          message: "Thumbnail added successfully"
        });
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  });
};
