export const getOpenApi = (_req, res) => {
  res.status(200).json({
    openapi: "3.0.0",
    info: {
      title: "NoteTaking Backend API",
      version: "1.0.0",
    },
    paths: {
      "/register": {
        post: {
          summary: "Register a new user",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthPayload" },
              },
            },
          },
          responses: {
            201: { description: "User registered successfully" },
            400: { description: "Validation failed" },
            409: { description: "Email is already registered" },
          },
        },
      },
      "/login": {
        post: {
          summary: "Authenticate a user",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthPayload" },
              },
            },
          },
          responses: {
            200: {
              description: "JWT access token",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/LoginResponse" },
                },
              },
            },
            401: { description: "Invalid email or password" },
          },
        },
      },
      "/notes": {
        get: {
          summary: "Get all notes for the authenticated user",
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: "List of notes" },
            401: { description: "Unauthorized" },
          },
        },
        post: {
          summary: "Create a new note",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/NotePayload" },
              },
            },
          },
          responses: {
            201: { description: "Created note" },
            400: { description: "Validation failed" },
            401: { description: "Unauthorized" },
          },
        },
      },
      "/notes/{id}": {
        get: {
          summary: "Get a specific note by ID",
          security: [{ bearerAuth: [] }],
          parameters: [{ $ref: "#/components/parameters/NoteId" }],
          responses: {
            200: { description: "Note data" },
            400: { description: "Invalid id" },
            401: { description: "Unauthorized" },
            404: { description: "Note not found" },
          },
        },
        put: {
          summary: "Update an existing note",
          security: [{ bearerAuth: [] }],
          parameters: [{ $ref: "#/components/parameters/NoteId" }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/NotePayload" },
              },
            },
          },
          responses: {
            200: { description: "Updated note data" },
            400: { description: "Validation failed" },
            401: { description: "Unauthorized" },
            404: { description: "Note not found" },
          },
        },
        delete: {
          summary: "Delete a note",
          security: [{ bearerAuth: [] }],
          parameters: [{ $ref: "#/components/parameters/NoteId" }],
          responses: {
            204: { description: "No content" },
            400: { description: "Invalid id" },
            401: { description: "Unauthorized" },
            404: { description: "Note not found" },
          },
        },
      },
      "/notes/{id}/share": {
        post: {
          summary: "Create a public share link for a note",
          security: [{ bearerAuth: [] }],
          parameters: [{ $ref: "#/components/parameters/NoteId" }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SharePayload" },
              },
            },
          },
          responses: {
            200: { description: "Share link created successfully" },
            400: { description: "Validation failed" },
            401: { description: "Unauthorized" },
            404: { description: "Note not found" },
            409: { description: "Share name is already taken" },
          },
        },
      },
      "/{shareName}": {
        get: {
          summary: "Get a shared note by public share name",
          parameters: [
            {
              name: "shareName",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            200: { description: "Shared note data" },
            404: { description: "Shared note not found" },
          },
        },
        put: {
          summary: "Update a shared note when the link has editor permission",
          parameters: [
            {
              name: "shareName",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/NotePayload" },
              },
            },
          },
          responses: {
            200: { description: "Updated shared note data" },
            400: { description: "Validation failed" },
            403: { description: "This shared link is view only" },
            404: { description: "Shared note not found" },
          },
        },
      },
      "/openapi.json": {
        get: {
          summary: "Get OpenAPI documentation",
          responses: { 200: { description: "OpenAPI JSON" } },
        },
      },
      "/about": {
        get: {
          summary: "Get API author and feature information",
          responses: { 200: { description: "About information" } },
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      parameters: {
        NoteId: {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      },
      schemas: {
        AuthPayload: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string", minLength: 6 },
          },
        },
        LoginResponse: {
          type: "object",
          properties: {
            access_token: { type: "string" },
          },
        },
        NotePayload: {
          type: "object",
          required: ["title", "content"],
          properties: {
            title: { type: "string", minLength: 1, maxLength: 120 },
            content: { type: "string", maxLength: 10000 },
          },
        },
        SharePayload: {
          type: "object",
          required: ["share_name"],
          properties: {
            share_name: {
              type: "string",
              minLength: 3,
              maxLength: 50,
              pattern: "^[a-z0-9-]+$",
            },
            permission: {
              type: "string",
              enum: ["viewer", "editor"],
              default: "viewer",
            },
          },
        },
        Note: {
          type: "object",
          properties: {
            id: { type: "string" },
            title: { type: "string" },
            content: { type: "string" },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
          },
        },
      },
    },
  });
};
