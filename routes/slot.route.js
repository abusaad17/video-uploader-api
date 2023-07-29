import { SlotService } from "../services/slot.service.js";
import { Authorize } from "../middleware/auth.js";
import { User } from "../models/user.model.js";
export const SlotRoutes = (app) => {
  app.post("/api/accounts/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email) {
        throw { code: 400, message: "Email ID is required" };
      }
      if (!password) {
        throw { code: 400, message: "Password is required" };
      }
      const accessToken = await SlotService.generateAccessToken(
        email,
        password
      );
      if (!accessToken) {
        throw { code: 500, message: "Failed to generate access token" };
      }
      const user = await User.findOne({ email: email });
      if (!user) {
        throw { code: 404, message: "User not found" };
      }
      if (user && accessToken) {
        res.status(200).send({
          token: accessToken,
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
      await SlotService.createUser(req.body);
      res
        .status(200)
        .send({ code: 200, message: "User registered successfully!" });
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  });

  app.get("/api/accounts/user-slot-status", Authorize(), async (req, res) => {
    try {
      const user = req.user;
      if (user.isBooked) {
        res
          .status(200)
          .send({ message: "Seat already alloted the Logged in user" });
      } else {
        res.status(200).send({ message: "Seat not alloted" });
      }
    } catch (error) {
      console.log(error);
    }
  });

  app.post("/api/accounts/slot-book", Authorize(), async (req, res) => {
    try {
      if (req.user.isBooked) {
        throw { code: 400, message: "User has already booked a slot" };
      }
      if (!req.body.slotId) {
        throw { code: 400, message: "Bad request : Slot id not found" };
      }
      const slotId = req.body.slotId;
      const user = req.user;
      user.isBooked = slotId;
      await user.save();
      res.status(200).send({ message: "Slot booked !!" });
    } catch (error) {
      res.status(error.code).send(error.message);
    }
  });

  app.get("/api/accounts/get-booked-seat", Authorize(), async (req, res) => {
    try {
      const user = req.user;
      const seat = user.isBooked;
      res.status(200).send({ seatId: seat });
    } catch (error) {
      console.log(error);
    }
  });
  app.get("/api/accounts/booked-slot-ids", Authorize(), async (req, res) => {
    try {
      const users = await User.find().exec();
      let arr = [];
      for (const element of users) {
        if (element.isBooked) {
          arr.push(element.isBooked);
        }
      }
      res.status(200).send({ bookedIds: arr });
    } catch (error) {}
  });
};
