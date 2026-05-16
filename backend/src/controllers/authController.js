import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/userModel.js";

const signToken = (user) =>
  jwt.sign(
    {
      sub: user._id.toString(),
      email: user.email,
      name: user.name || user.email,
      username: user.username,
    },
    env.jwtSecret,
    { expiresIn: "7d" }
  );

const toUsername = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);

const createUniqueUsername = async ({ email, name }) => {
  const base = toUsername(name || email.split("@")[0]) || "user";
  let username = base;
  let suffix = 1;

  while (await User.exists({ username })) {
    suffix += 1;
    username = `${base}-${suffix}`;
  }

  return username;
};

export const register = async (req, res, next) => {
  try {
    const existingUser = await User.findOne({ email: req.body.email });

    if (existingUser) {
      return res.status(409).json({ message: "Email is already registered" });
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const username = await createUniqueUsername({
      email: req.body.email,
      name: req.body.name,
    });

    await User.create({
      email: req.body.email,
      name: req.body.name,
      username,
      password: hashedPassword,
    });

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(req.body.password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!user.username) {
      user.username = await createUniqueUsername({
        email: user.email,
        name: user.name,
      });
      await user.save();
    }

    res.status(200).json({
      access_token: signToken(user),
      username: user.username,
      name: user.name || user.email,
    });
  } catch (error) {
    next(error);
  }
};
