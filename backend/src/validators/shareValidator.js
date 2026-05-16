const shareNamePattern = /^[a-z0-9-]+$/;

export const validateSharePayload = (req, res, next) => {
  const { share_name: shareName, permission = "editor" } = req.body;

  if (typeof shareName !== "string") {
    return res.status(400).json({
      message: "Validation failed",
      errors: ["Valid share_name is required"],
    });
  }

  const normalizedShareName = shareName.trim().toLowerCase();

  if (
    normalizedShareName.length < 3 ||
    normalizedShareName.length > 50 ||
    !shareNamePattern.test(normalizedShareName)
  ) {
    return res.status(400).json({
      message: "Validation failed",
      errors: ["share_name must be 3 to 50 characters and contain only letters, numbers, and hyphens"],
    });
  }

  req.body.share_name = normalizedShareName;

  if (!["viewer", "editor"].includes(permission)) {
    return res.status(400).json({
      message: "Validation failed",
      errors: ["permission must be either viewer or editor"],
    });
  }

  req.body.permission = permission;
  next();
};
