const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateAuthPayload = (req, res, next) => {
  const { email, password, name } = req.body;
  const errors = [];

  if (typeof email !== "string" || !emailPattern.test(email.trim())) {
    errors.push("Valid email is required");
  }

  if (typeof password !== "string" || password.length < 6) {
    errors.push("Password must be at least 6 characters");
  }

  if (name !== undefined && (typeof name !== "string" || name.trim().length > 80)) {
    errors.push("Name must be a string up to 80 characters");
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: "Validation failed", errors });
  }

  req.body.email = email.trim().toLowerCase();
  if (typeof name === "string") req.body.name = name.trim();
  next();
};
