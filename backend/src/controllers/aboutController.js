export const getAbout = (_req, res) => {
  res.status(200).json({
    name: "Atharva",
    email: "satharva2004@example.com",
    "my features": {
      authentication: "JWT authentication protects private note operations.",
      notes: "Users can create, read, update, and delete their own notes.",
      sharing: "Users can create public share links with readable names for quick access.",
      documentation: "OpenAPI JSON documents every exposed endpoint.",
    },
  });
};
