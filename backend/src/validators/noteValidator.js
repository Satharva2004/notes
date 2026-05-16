const allowedFields = ["title", "content"];

const validateNotePayload = (payload, { requireTitle }) => {
  const errors = [];
  const fields = Object.keys(payload);

  const unknownFields = fields.filter((field) => !allowedFields.includes(field));
  if (unknownFields.length > 0) {
    errors.push(`Unknown fields: ${unknownFields.join(", ")}`);
  }

  if (requireTitle && !Object.prototype.hasOwnProperty.call(payload, "title")) {
    errors.push("Title is required");
  }

  if (payload.title !== undefined) {
    if (typeof payload.title !== "string") {
      errors.push("Title must be a string");
    } else if (payload.title.trim().length < 1 || payload.title.trim().length > 120) {
      errors.push("Title must be between 1 and 120 characters");
    }
  }

  if (payload.content !== undefined) {
    if (typeof payload.content !== "string") {
      errors.push("Content must be a string");
    } else if (payload.content.length > 10000) {
      errors.push("Content cannot exceed 10000 characters");
    }
  }

  if (payload.content === undefined) {
    errors.push("Content is required");
  }

  return errors;
};

export const validateNoteCreate = (req, res, next) => {
  const errors = validateNotePayload(req.body, { requireTitle: true });

  if (errors.length > 0) {
    return res.status(400).json({ message: "Validation failed", errors });
  }

  next();
};

export const validateNoteUpdate = (req, res, next) => {
  const errors = validateNotePayload(req.body, { requireTitle: true });

  if (errors.length > 0) {
    return res.status(400).json({ message: "Validation failed", errors });
  }

  next();
};
