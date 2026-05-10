// OpenAPI 3.1.0 specification for Roots & Recipes API

const bearerAuth = { bearerAuth: [] };

export const openApiSpec = {
  openapi: "3.1.0",
  info: {
    title: "Roots & Recipes API",
    version: "1.0.0",
    description:
      "REST API for the Roots & Recipes cross-generational recipe and food heritage platform. " +
      "All responses follow the envelope `{ success, data, error }`. " +
      "Protected endpoints require `Authorization: Bearer <access_token>`.",
  },
  servers: [
    {
      url: "https://urchin-app-w5w4g.ondigitalocean.app",
      description: "Production",
    },
    {
      url: "http://localhost:3000",
      description: "Local development",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Supabase JWT access token obtained from /auth/login",
      },
    },
    schemas: {
      // ── Envelope ────────────────────────────────────────────────────────────
      ApiError: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          data: { type: "null" },
          error: {
            type: "object",
            properties: {
              code: { type: "string", example: "VALIDATION_ERROR" },
              message: { type: "string", example: "Title must be at least 3 characters" },
            },
            required: ["code", "message"],
          },
        },
      },
      // ── Domain schemas ───────────────────────────────────────────────────────
      UserProfile: {
        type: "object",
        properties: {
          userId: { type: "string", format: "uuid" },
          email: { type: "string", format: "email" },
          username: { type: "string" },
          role: { type: "string", enum: ["learner", "cook", "expert"] },
          bio: { type: ["string", "null"] },
          avatarUrl: { type: ["string", "null"] },
          preferredLanguage: { type: ["string", "null"] },
          region: { type: ["string", "null"] },
        },
      },
      RecipeSummary: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          title: { type: "string" },
          type: { type: "string", enum: ["community", "cultural"] },
          averageRating: { type: ["number", "null"] },
          ratingCount: { type: "integer" },
          creatorId: { type: ["string", "null"], format: "uuid" },
          creatorUsername: { type: ["string", "null"] },
          dishVarietyId: { type: ["integer", "null"] },
          dishVarietyName: { type: ["string", "null"] },
          genreName: { type: ["string", "null"] },
          country: { type: ["string", "null"] },
          city: { type: ["string", "null"] },
          district: { type: ["string", "null"] },
          coverImageUrl: { type: ["string", "null"] },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      RecipeIngredient: {
        type: "object",
        properties: {
          ingredientId: { type: "integer" },
          quantity: { type: "number" },
          unit: { type: "string" },
        },
      },
      RecipeStep: {
        type: "object",
        properties: {
          stepOrder: { type: "integer" },
          description: { type: "string" },
          videoTimestamp: { type: ["number", "null"] },
        },
      },
      RecipeTool: {
        type: "object",
        properties: {
          name: { type: "string" },
        },
      },
      MediaItem: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          url: { type: "string", format: "uri" },
          type: { type: "string", enum: ["image", "video"] },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      DietaryTag: {
        type: "object",
        properties: {
          id: { type: "integer" },
          name: { type: "string" },
          nameEn: { type: ["string", "null"] },
          nameTr: { type: ["string", "null"] },
          category: { type: "string", enum: ["dietary", "allergen"] },
        },
      },
      Allergen: {
        type: "object",
        properties: {
          id: { type: "integer" },
          name: { type: "string" },
        },
      },
      DishVarietySummary: {
        type: "object",
        properties: {
          id: { type: "integer" },
          name: { type: "string" },
          nameEn: { type: ["string", "null"] },
          nameTr: { type: ["string", "null"] },
          genreId: { type: "integer" },
        },
      },
      DishGenre: {
        type: "object",
        properties: {
          id: { type: "integer" },
          name: { type: "string" },
          nameEn: { type: ["string", "null"] },
          nameTr: { type: ["string", "null"] },
          description: { type: ["string", "null"] },
          descriptionEn: { type: ["string", "null"] },
          descriptionTr: { type: ["string", "null"] },
          varieties: {
            type: "array",
            items: { $ref: "#/components/schemas/DishVarietySummary" },
          },
        },
      },
      Comment: {
        type: "object",
        properties: {
          id: { type: "integer" },
          recipeId: { type: "string", format: "uuid" },
          userId: { type: "string", format: "uuid" },
          username: { type: "string" },
          body: { type: "string" },
          score: { type: ["integer", "null"] },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: ["string", "null"], format: "date-time" },
        },
      },
      Rating: {
        type: "object",
        properties: {
          recipeId: { type: "string", format: "uuid" },
          userId: { type: "string", format: "uuid" },
          score: { type: "integer", minimum: 1, maximum: 5 },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: ["string", "null"], format: "date-time" },
        },
      },
      Pagination: {
        type: "object",
        properties: {
          page: { type: "integer", example: 1 },
          limit: { type: "integer", example: 20 },
          total: { type: "integer" },
        },
      },
      VideoAnnotation: {
        type: "object",
        properties: {
          id: { type: "integer" },
          recipeId: { type: "string", format: "uuid" },
          startTime: { type: "number", description: "Seconds into the recipe video where the annotation begins", minimum: 0 },
          endTime: { type: "number", description: "Seconds into the recipe video where the annotation ends (>= startTime)", minimum: 0 },
          note: { type: "string", minLength: 1, maxLength: 500 },
          technique: { type: ["string", "null"] },
          createdAt: { type: "string", format: "date-time" },
        },
      },
    },
  },
  paths: {
    // ── Health ──────────────────────────────────────────────────────────────────
    "/health": {
      get: {
        summary: "Health check",
        tags: ["Meta"],
        responses: {
          "200": {
            description: "Service is healthy",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                    timestamp: { type: "string", format: "date-time" },
                  },
                },
              },
            },
          },
        },
      },
    },

    // ── Auth ────────────────────────────────────────────────────────────────────
    "/auth/register": {
      post: {
        summary: "Register a new user",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password", "username", "role"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 6 },
                  username: { type: "string" },
                  role: { type: "string", enum: ["learner", "cook", "expert"], description: "Choosing 'expert' creates the profile as 'cook' (interim) and opens a pending expert_requests row that must be approved by the admin." },
                  expertRequestReason: { type: "string", description: "Optional justification, only stored when role='expert' is requested." },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "User registered successfully. When role='expert' was requested, the response carries `pendingExpertRequest: true` and the user's role is 'cook' (interim) until an admin approves the request.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        userId: { type: "string" },
                        email: { type: "string" },
                        username: { type: "string" },
                        role: { type: "string", enum: ["learner", "cook", "expert"] },
                        accessToken: { type: "string" },
                        refreshToken: { type: "string" },
                        pendingExpertRequest: { type: "boolean" },
                      },
                    },
                  },
                },
              },
            },
          },
          "400": { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
          "409": { description: "Email or username already taken", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
        },
      },
    },

    // ── Expert account requests (user-side) ─────────────────────────────────
    "/auth/expert-requests": {
      post: {
        summary: "Submit an expert-account request",
        description:
          "Open a pending expert_requests row. Only one pending request per user. Caller must currently be a learner or cook.",
        tags: ["Auth"],
        security: [bearerAuth],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["reason"],
                properties: {
                  reason: { type: "string", maxLength: 2000 },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Pending request created" },
          "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
          "403": { description: "Caller is admin (admins cannot apply)", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
          "409": { description: "Already an expert OR a pending request already exists", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
        },
      },
    },
    "/auth/expert-requests/me": {
      get: {
        summary: "Get my latest expert-account request (or null)",
        tags: ["Auth"],
        security: [bearerAuth],
        responses: {
          "200": { description: "Latest request or null" },
          "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
        },
      },
    },

    // ── Admin (admin-only) ──────────────────────────────────────────────────
    "/admin/expert-requests": {
      get: {
        summary: "List expert-account requests",
        description: "Defaults to only pending requests. Admin only.",
        tags: ["Admin"],
        security: [bearerAuth],
        parameters: [
          { name: "status", in: "query", schema: { type: "string", enum: ["pending", "approved", "rejected"] } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20, maximum: 100 } },
        ],
        responses: {
          "200": { description: "Paginated list" },
          "401": { description: "Unauthorized" },
          "403": { description: "Caller is not the admin" },
        },
      },
    },
    "/admin/expert-requests/{id}/approve": {
      post: {
        summary: "Approve a pending expert request",
        description: "Promotes the applicant's profile.role to 'expert' and marks the request approved.",
        tags: ["Admin"],
        security: [bearerAuth],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: false,
          content: { "application/json": { schema: { type: "object", properties: { decisionNote: { type: "string" } } } } },
        },
        responses: {
          "200": { description: "Approved" },
          "404": { description: "Request not found" },
          "409": { description: "Request already decided" },
        },
      },
    },
    "/admin/expert-requests/{id}/reject": {
      post: {
        summary: "Reject a pending expert request",
        tags: ["Admin"],
        security: [bearerAuth],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: false,
          content: { "application/json": { schema: { type: "object", properties: { decisionNote: { type: "string" } } } } },
        },
        responses: {
          "200": { description: "Rejected" },
          "404": { description: "Request not found" },
          "409": { description: "Request already decided" },
        },
      },
    },
    "/admin/users": {
      get: {
        summary: "List users",
        tags: ["Admin"],
        security: [bearerAuth],
        parameters: [
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "role", in: "query", schema: { type: "string", enum: ["learner", "cook", "expert", "admin"] } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20, maximum: 100 } },
        ],
        responses: {
          "200": { description: "Paginated list" },
          "401": { description: "Unauthorized" },
          "403": { description: "Caller is not the admin" },
        },
      },
    },
    "/admin/users/{id}": {
      patch: {
        summary: "Update a user's profile",
        description:
          "Admin can modify role/username/bio/region/preferred_language. The admin profile itself cannot be modified through this endpoint, and roles cannot be set to 'admin'.",
        tags: ["Admin"],
        security: [bearerAuth],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  username: { type: "string" },
                  role: { type: "string", enum: ["learner", "cook", "expert"] },
                  bio: { type: "string" },
                  region: { type: "string" },
                  preferred_language: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Updated" },
          "403": { description: "Target is the admin profile" },
          "404": { description: "User not found" },
          "409": { description: "Username already taken" },
        },
      },
      delete: {
        summary: "Delete a user profile",
        description:
          "Removes the profile row. All FKs referencing profiles cascade. The auth.users row is preserved (only the Supabase service role can remove it); the deleted profile is enough to lock the account out of the API.",
        tags: ["Admin"],
        security: [bearerAuth],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "204": { description: "Deleted" },
          "403": { description: "Target is the admin profile or self" },
          "404": { description: "User not found" },
        },
      },
    },
    "/admin/recipes/{id}": {
      delete: {
        summary: "Delete any recipe",
        description: "Deletes a recipe regardless of who created it. All recipe_* child rows cascade.",
        tags: ["Admin"],
        security: [bearerAuth],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "204": { description: "Deleted" },
          "404": { description: "Recipe not found" },
        },
      },
    },
    "/admin/comments/{id}": {
      delete: {
        summary: "Delete any comment (moderator action)",
        tags: ["Admin"],
        security: [bearerAuth],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "204": { description: "Deleted" },
          "404": { description: "Comment not found" },
        },
      },
    },
    "/auth/login": {
      post: {
        summary: "Login and obtain tokens",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Login successful",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        accessToken: { type: "string" },
                        refreshToken: { type: "string" },
                        user: { $ref: "#/components/schemas/UserProfile" },
                      },
                    },
                  },
                },
              },
            },
          },
          "401": { description: "Invalid credentials", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
        },
      },
    },
    "/auth/logout": {
      post: {
        summary: "Logout (invalidate session)",
        tags: ["Auth"],
        security: [bearerAuth],
        responses: {
          "200": { description: "Logged out successfully" },
          "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
        },
      },
    },
    "/auth/refresh": {
      post: {
        summary: "Refresh access token",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["refreshToken"],
                properties: {
                  refreshToken: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "New tokens issued" },
          "401": { description: "Invalid or expired refresh token", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
        },
      },
    },
    "/auth/me": {
      get: {
        summary: "Get current user profile",
        tags: ["Auth"],
        security: [bearerAuth],
        responses: {
          "200": {
            description: "Current user info",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/UserProfile" },
                  },
                },
              },
            },
          },
          "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
        },
      },
    },
    "/auth/profile": {
      patch: {
        summary: "Update current user profile",
        tags: ["Auth"],
        security: [bearerAuth],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  username: { type: "string" },
                  bio: { type: "string" },
                  avatarUrl: { type: "string", format: "uri" },
                  preferredLanguage: { type: "string", enum: ["en", "tr"] },
                  region: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Profile updated" },
          "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
          "409": { description: "Username already taken", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
        },
      },
    },

    // ── Recipes ─────────────────────────────────────────────────────────────────
    "/recipes": {
      get: {
        summary: "List published recipes",
        tags: ["Recipes"],
        parameters: [
          { name: "creatorId", in: "query", schema: { type: "string", format: "uuid" }, description: "Filter by creator's profile ID" },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
        ],
        responses: {
          "200": {
            description: "Paginated list of published recipes",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        recipes: { type: "array", items: { $ref: "#/components/schemas/RecipeSummary" } },
                        pagination: { $ref: "#/components/schemas/Pagination" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: "Create a new recipe (cook/expert only)",
        tags: ["Recipes"],
        security: [bearerAuth],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title", "type"],
                properties: {
                  dishVarietyId: { type: "integer" },
                  title: { type: "string", minLength: 3, maxLength: 200 },
                  story: { type: "string", maxLength: 5000 },
                  videoUrl: { type: "string", format: "uri" },
                  servingSize: { type: "integer", minimum: 1, maximum: 100 },
                  type: { type: "string", enum: ["community", "cultural"] },
                  isPublished: { type: "boolean", default: false },
                  country: { type: "string" },
                  city: { type: "string" },
                  district: { type: "string" },
                  ingredients: {
                    type: "array",
                    items: { $ref: "#/components/schemas/RecipeIngredient" },
                    default: [],
                  },
                  steps: {
                    type: "array",
                    items: { $ref: "#/components/schemas/RecipeStep" },
                    default: [],
                  },
                  tools: {
                    type: "array",
                    items: { $ref: "#/components/schemas/RecipeTool" },
                    default: [],
                  },
                  tagIds: { type: "array", items: { type: "integer" }, default: [] },
                  allergenIds: { type: "array", items: { type: "integer" }, default: [] },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Recipe created" },
          "400": { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
          "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
          "403": { description: "Insufficient role", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
        },
      },
    },
    "/recipes/mine": {
      get: {
        summary: "List current user's own recipes (published + drafts)",
        tags: ["Recipes"],
        security: [bearerAuth],
        parameters: [
          {
            name: "status",
            in: "query",
            schema: { type: "string", enum: ["published", "draft"] },
            description: "Filter by publish status. Omit to return all.",
          },
        ],
        responses: {
          "200": {
            description: "List of the authenticated user's recipes",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { type: "array", items: { $ref: "#/components/schemas/RecipeSummary" } },
                  },
                },
              },
            },
          },
          "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
        },
      },
    },
    "/recipes/{id}": {
      get: {
        summary: "Get recipe detail",
        tags: ["Recipes"],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "lang", in: "query", schema: { type: "string", enum: ["en", "tr"] }, description: "Return translated fields if available" },
        ],
        responses: {
          "200": { description: "Recipe detail with ingredients, steps, tools, media, and tags" },
          "404": { description: "Recipe not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
        },
      },
      patch: {
        summary: "Update a draft recipe (creator only, cook/expert)",
        tags: ["Recipes"],
        security: [bearerAuth],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                description: "All fields are optional — only provided fields are updated.",
                properties: {
                  dishVarietyId: { type: "integer" },
                  title: { type: "string", minLength: 3, maxLength: 200 },
                  story: { type: "string", maxLength: 5000 },
                  videoUrl: { type: "string", format: "uri" },
                  servingSize: { type: "integer", minimum: 1, maximum: 100 },
                  type: { type: "string", enum: ["community", "cultural"] },
                  country: { type: "string" },
                  city: { type: "string" },
                  district: { type: "string" },
                  ingredients: { type: "array", items: { $ref: "#/components/schemas/RecipeIngredient" } },
                  steps: { type: "array", items: { $ref: "#/components/schemas/RecipeStep" } },
                  tools: { type: "array", items: { $ref: "#/components/schemas/RecipeTool" } },
                  tagIds: { type: "array", items: { type: "integer" } },
                  allergenIds: { type: "array", items: { type: "integer" } },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Recipe updated" },
          "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
          "403": { description: "Not the creator or wrong role", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
          "404": { description: "Recipe not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
        },
      },
      delete: {
        summary: "Delete a recipe (creator only)",
        tags: ["Recipes"],
        security: [bearerAuth],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          "204": { description: "Recipe deleted" },
          "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
          "403": { description: "Not the creator", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
          "404": { description: "Recipe not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
        },
      },
    },
    "/recipes/{id}/publish": {
      post: {
        summary: "Publish a draft recipe (creator only)",
        tags: ["Recipes"],
        security: [bearerAuth],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          "200": { description: "Recipe published" },
          "400": { description: "Recipe incomplete for publishing", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
          "403": { description: "Not the creator", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
          "404": { description: "Recipe not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
          "409": { description: "Already published", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
        },
      },
    },
    "/recipes/{id}/scale": {
      get: {
        summary: "Scale recipe ingredient quantities to desired serving size",
        tags: ["Recipes"],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "servings", in: "query", required: true, schema: { type: "integer", minimum: 1, maximum: 1000 } },
        ],
        responses: {
          "200": {
            description: "Scaled ingredient quantities",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        recipeId: { type: "string", format: "uuid" },
                        baseServings: { type: "integer" },
                        requestedServings: { type: "integer" },
                        ingredients: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              ingredientId: { type: "integer" },
                              name: { type: "string" },
                              scaledQuantity: { type: "number" },
                              unit: { type: "string" },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          "400": { description: "Invalid servings param or recipe has no base serving size", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
          "404": { description: "Recipe not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
        },
      },
    },
    "/recipes/{id}/ratings": {
      post: {
        summary: "Rate a recipe (1-5). Cannot self-rate. Upserts existing rating.",
        tags: ["Recipes"],
        security: [bearerAuth],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["score"],
                properties: {
                  score: { type: "integer", minimum: 1, maximum: 5 },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Rating saved" },
          "400": { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
          "403": { description: "Cannot self-rate", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
          "404": { description: "Recipe not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
        },
      },
    },
    "/recipes/{id}/ratings/me": {
      get: {
        summary: "Get own rating for a recipe",
        tags: ["Recipes"],
        security: [bearerAuth],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          "200": {
            description: "Own rating or null if not yet rated",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { oneOf: [{ $ref: "#/components/schemas/Rating" }, { type: "null" }] },
                  },
                },
              },
            },
          },
          "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
        },
      },
      delete: {
        summary: "Delete own rating for a recipe",
        tags: ["Recipes"],
        security: [bearerAuth],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          "204": { description: "Rating deleted" },
          "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
          "404": { description: "Rating not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
        },
      },
    },
    "/recipes/{id}/media": {
      post: {
        summary: "Attach a previously uploaded media item to a recipe (creator only)",
        tags: ["Recipes"],
        security: [bearerAuth],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["url", "type"],
                properties: {
                  url: { type: "string", format: "uri" },
                  type: { type: "string", enum: ["image", "video"] },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Media attached" },
          "403": { description: "Not the creator", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
          "404": { description: "Recipe not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
        },
      },
      get: {
        summary: "List media for a recipe",
        tags: ["Recipes"],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          "200": {
            description: "Media list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { type: "array", items: { $ref: "#/components/schemas/MediaItem" } },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/recipes/{id}/media/{mediaId}": {
      delete: {
        summary: "Remove a media attachment (creator only)",
        tags: ["Recipes"],
        security: [bearerAuth],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "mediaId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          "204": { description: "Media removed" },
          "403": { description: "Not the creator", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
          "404": { description: "Media not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
        },
      },
    },
    "/recipes/{id}/comments": {
      post: {
        summary: "Create a comment on a recipe. Requires a rating unless user is the recipe creator.",
        tags: ["Comments"],
        security: [bearerAuth],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["body"],
                properties: {
                  body: { type: "string", minLength: 1, maxLength: 2000 },
                  score: { type: "integer", minimum: 1, maximum: 5, description: "If provided, upserts the user's rating in the same call." },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Comment created" },
          "400": { description: "Rating required or validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
          "403": { description: "Creator tried to self-rate", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
          "404": { description: "Recipe not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
          "409": { description: "User already has a comment on this recipe", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
        },
      },
      get: {
        summary: "List comments on a recipe (newest first)",
        tags: ["Comments"],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20, maximum: 100 } },
        ],
        responses: {
          "200": {
            description: "Paginated comments",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        comments: { type: "array", items: { $ref: "#/components/schemas/Comment" } },
                        pagination: { $ref: "#/components/schemas/Pagination" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    // ── Comments ────────────────────────────────────────────────────────────────
    "/comments/{id}": {
      patch: {
        summary: "Edit own comment",
        tags: ["Comments"],
        security: [bearerAuth],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["body"],
                properties: {
                  body: { type: "string", minLength: 1, maxLength: 2000 },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Comment updated" },
          "403": { description: "Not the comment author", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
          "404": { description: "Comment not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
        },
      },
      delete: {
        summary: "Delete own comment",
        tags: ["Comments"],
        security: [bearerAuth],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } },
        ],
        responses: {
          "204": { description: "Comment deleted" },
          "403": { description: "Not the comment author", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
          "404": { description: "Comment not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
        },
      },
    },

    // ── Video Annotations ───────────────────────────────────────────────────────
    "/recipes/{id}/annotations": {
      post: {
        summary: "Add a manual video annotation (timestamp + note) to a recipe",
        tags: ["Video Annotations"],
        security: [bearerAuth],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["startTime", "endTime", "note"],
                properties: {
                  startTime: { type: "number", minimum: 0, description: "Seconds into the recipe video where the annotation begins" },
                  endTime: { type: "number", minimum: 0, description: "Seconds into the recipe video where the annotation ends (>= startTime)" },
                  note: { type: "string", minLength: 1, maxLength: 500 },
                  technique: { type: ["string", "null"], maxLength: 120 },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Annotation created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/VideoAnnotation" },
                  },
                },
              },
            },
          },
          "400": { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
          "403": { description: "Caller is not the recipe creator (or wrong role)", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
          "404": { description: "Recipe not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
        },
      },
      get: {
        summary: "List video annotations for a recipe (sorted by timestamp asc)",
        tags: ["Video Annotations"],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          "200": {
            description: "Annotations list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { type: "array", items: { $ref: "#/components/schemas/VideoAnnotation" } },
                  },
                },
              },
            },
          },
          "403": { description: "Recipe is a draft and the caller is not the creator", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
          "404": { description: "Recipe not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
        },
      },
    },
    "/annotations/{annotationId}": {
      patch: {
        summary: "Edit a video annotation (recipe creator only)",
        tags: ["Video Annotations"],
        security: [bearerAuth],
        parameters: [
          { name: "annotationId", in: "path", required: true, schema: { type: "integer" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  startTime: { type: "number", minimum: 0 },
                  endTime: { type: "number", minimum: 0 },
                  note: { type: "string", minLength: 1, maxLength: 500 },
                  technique: { type: ["string", "null"], maxLength: 120 },
                },
                description: "At least one of startTime / endTime / note / technique must be provided. Resulting endTime must be >= startTime.",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Annotation updated",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/VideoAnnotation" },
                  },
                },
              },
            },
          },
          "400": { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
          "403": { description: "Caller is not the recipe creator", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
          "404": { description: "Annotation not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
        },
      },
      delete: {
        summary: "Delete a video annotation (recipe creator only)",
        tags: ["Video Annotations"],
        security: [bearerAuth],
        parameters: [
          { name: "annotationId", in: "path", required: true, schema: { type: "integer" } },
        ],
        responses: {
          "204": { description: "Annotation deleted" },
          "403": { description: "Caller is not the recipe creator", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
          "404": { description: "Annotation not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
        },
      },
    },

    // ── Dish Genres ─────────────────────────────────────────────────────────────
    "/dish-genres": {
      get: {
        summary: "List all dish genres with nested varieties",
        tags: ["Dish Genres"],
        parameters: [
          { name: "lang", in: "query", schema: { type: "string", enum: ["en", "tr"] }, description: "Return single resolved name/description instead of _en/_tr pair" },
        ],
        responses: {
          "200": {
            description: "All genres",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { type: "array", items: { $ref: "#/components/schemas/DishGenre" } },
                  },
                },
              },
            },
          },
        },
      },
    },

    // ── Dish Varieties ──────────────────────────────────────────────────────────
    "/dish-varieties": {
      get: {
        summary: "List dish varieties with optional filters",
        tags: ["Dish Varieties"],
        parameters: [
          { name: "genreId", in: "query", schema: { type: "integer" } },
          { name: "search", in: "query", schema: { type: "string" }, description: "Case-insensitive, Turkish-aware partial name match" },
          { name: "lang", in: "query", schema: { type: "string", enum: ["en", "tr"] } },
        ],
        responses: {
          "200": { description: "List of varieties" },
        },
      },
    },
    "/dish-varieties/{id}": {
      get: {
        summary: "Get a single dish variety with its published recipes",
        tags: ["Dish Varieties"],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } },
          { name: "lang", in: "query", schema: { type: "string", enum: ["en", "tr"] } },
        ],
        responses: {
          "200": { description: "Variety detail" },
          "404": { description: "Variety not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
        },
      },
    },
    "/dish-varieties/{id}/recipes": {
      get: {
        summary: "Get recipes for a variety split into expert and community",
        tags: ["Dish Varieties"],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } },
        ],
        responses: {
          "200": {
            description: "Expert recipe + community recipes",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        expertRecipe: { oneOf: [{ $ref: "#/components/schemas/RecipeSummary" }, { type: "null" }] },
                        communityRecipes: { type: "array", items: { $ref: "#/components/schemas/RecipeSummary" } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    // ── Ingredients ─────────────────────────────────────────────────────────────
    "/ingredients": {
      get: {
        summary: "List or search ingredients",
        tags: ["Ingredients"],
        parameters: [
          { name: "search", in: "query", schema: { type: "string" }, description: "Turkish-aware case-insensitive partial match" },
          { name: "lang", in: "query", schema: { type: "string", enum: ["en", "tr"] } },
        ],
        responses: {
          "200": { description: "List of ingredients" },
        },
      },
      post: {
        summary: "Create a new ingredient (cook/expert only)",
        tags: ["Ingredients"],
        security: [bearerAuth],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  nameEn: { type: "string" },
                  nameTr: { type: "string" },
                },
                description: "At least one of nameEn or nameTr is required.",
              },
            },
          },
        },
        responses: {
          "201": { description: "Ingredient created" },
          "400": { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
          "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
          "409": { description: "Ingredient with same name already exists", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
        },
      },
    },
    "/ingredients/{id}/substitutions": {
      get: {
        summary: "Get ingredient substitutions with optional quantity scaling",
        tags: ["Ingredients"],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } },
          { name: "amount", in: "query", schema: { type: "number" }, description: "Source amount to scale substitution quantities" },
          { name: "unit", in: "query", schema: { type: "string" }, description: "Source unit (e.g. gr)" },
        ],
        responses: {
          "200": { description: "List of substitutions with proportionally scaled amounts if amount+unit provided" },
          "400": { description: "Invalid params", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
          "404": { description: "Ingredient not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
        },
      },
    },

    // ── Allergens ───────────────────────────────────────────────────────────────
    "/allergens": {
      get: {
        summary: "List all allergens",
        tags: ["Allergens"],
        responses: {
          "200": {
            description: "All allergens",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { type: "array", items: { $ref: "#/components/schemas/Allergen" } },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/allergens/detect": {
      post: {
        summary: "Detect allergens for a list of ingredient IDs",
        tags: ["Allergens"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["ingredientIds"],
                properties: {
                  ingredientIds: { type: "array", items: { type: "integer" }, minItems: 1 },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Distinct allergens found across the given ingredients",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { type: "array", items: { $ref: "#/components/schemas/Allergen" } },
                  },
                },
              },
            },
          },
          "400": { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
        },
      },
    },

    // ── Dietary Tags ────────────────────────────────────────────────────────────
    "/dietary-tags": {
      get: {
        summary: "List all dietary and allergen tags",
        tags: ["Dietary Tags"],
        parameters: [
          { name: "lang", in: "query", schema: { type: "string", enum: ["en", "tr"] } },
        ],
        responses: {
          "200": {
            description: "All dietary tags",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { type: "array", items: { $ref: "#/components/schemas/DietaryTag" } },
                  },
                },
              },
            },
          },
        },
      },
    },

    // ── Discovery ───────────────────────────────────────────────────────────────
    "/discovery/recipes": {
      get: {
        summary: "Filtered recipe discovery",
        tags: ["Discovery"],
        parameters: [
          { name: "genreId", in: "query", schema: { type: "integer" } },
          { name: "varietyId", in: "query", schema: { type: "integer" } },
          { name: "excludeAllergens", in: "query", schema: { type: "string" }, description: "Comma-separated allergen IDs to exclude. Excludes recipes that either tag the allergen manually (allergen_ids) or contain it via any ingredient (ingredient_allergens)." },
          { name: "tagIds", in: "query", schema: { type: "string" }, description: "Comma-separated dietary tag IDs — recipes must have ALL specified tags" },
          { name: "search", in: "query", schema: { type: "string" }, description: "Case-insensitive partial match on recipe title" },
          { name: "country", in: "query", schema: { type: "string" }, description: "Alias-aware (e.g. 'tr'/'Türkiye' both match 'Turkey')" },
          { name: "city", in: "query", schema: { type: "string" } },
          { name: "district", in: "query", schema: { type: "string" } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
        ],
        responses: {
          "200": {
            description: "Filtered recipes with cross-page-stable varieties and genres for filter dropdowns",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        recipes: { type: "array", items: { $ref: "#/components/schemas/RecipeSummary" } },
                        pagination: { $ref: "#/components/schemas/Pagination" },
                        varieties: { type: "array", items: { $ref: "#/components/schemas/DishVarietySummary" } },
                        genres: { type: "array", items: { $ref: "#/components/schemas/DishGenre" } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/discovery/recipes/by-ingredients": {
      get: {
        summary: "Find recipes fully makeable with the provided ingredients",
        tags: ["Discovery"],
        parameters: [
          { name: "ingredientIds", in: "query", required: true, schema: { type: "string" }, description: "Comma-separated ingredient IDs. Only returns recipes whose every ingredient is in this list." },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
        ],
        responses: {
          "200": { description: "Recipes fully makeable with given ingredients" },
          "400": { description: "Missing ingredientIds", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
        },
      },
    },
    "/discovery/locations": {
      get: {
        summary: "Get distinct location values for published recipes",
        tags: ["Discovery"],
        parameters: [
          { name: "country", in: "query", schema: { type: "string" }, description: "If provided, returns distinct cities in that country" },
          { name: "city", in: "query", schema: { type: "string" }, description: "If provided alongside country, returns distinct districts" },
        ],
        responses: {
          "200": {
            description: "Deduplicated, alias-aware location values",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { type: "object", properties: { results: { type: "array", items: { type: "string" } } } },
                  },
                },
              },
            },
          },
          "400": { description: "city provided without country", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
        },
      },
    },

    // ── Parse ───────────────────────────────────────────────────────────────────
    "/parse/recipe-text": {
      post: {
        summary: "Parse free-text recipe into structured components (Gemini AI, cook/expert only)",
        tags: ["Parse"],
        security: [bearerAuth],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["text"],
                properties: {
                  text: { type: "string", minLength: 10, maxLength: 5000 },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Structured recipe components (not persisted)",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        ingredients: { type: "array", items: { type: "object" } },
                        steps: { type: "array", items: { type: "object" } },
                        tools: { type: "array", items: { type: "string" } },
                      },
                    },
                  },
                },
              },
            },
          },
          "400": { description: "Text too short/long", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
          "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
          "403": { description: "Insufficient role", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
          "500": { description: "AI parsing failed", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
        },
      },
    },
    "/parse/standardize-units": {
      post: {
        summary: "Standardize informal ingredient units and step descriptions (Gemini AI, cook/expert only)",
        tags: ["Parse"],
        security: [bearerAuth],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["ingredients"],
                properties: {
                  ingredients: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        quantity: { type: ["number", "string"] },
                        unit: { type: "string" },
                      },
                    },
                  },
                  steps: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        stepOrder: { type: "integer" },
                        description: { type: "string" },
                      },
                    },
                  },
                  region: { type: "string", description: "e.g. 'Turkey' for locale-specific unit resolution" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Standardized ingredients and steps" },
          "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
          "403": { description: "Insufficient role", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
          "500": { description: "AI standardization failed", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
        },
      },
    },
    "/parse/recipe-audio": {
      post: {
        summary: "Transcribe audio/video and parse into structured recipe (ElevenLabs + Gemini, cook/expert only)",
        tags: ["Parse"],
        security: [bearerAuth],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["audio"],
                properties: {
                  audio: {
                    type: "string",
                    format: "binary",
                    description: "Audio (mp3/wav/webm/m4a/ogg/flac) or video (mp4/mov/webm/mkv) file, max 100 MB",
                  },
                  language: {
                    type: "string",
                    enum: ["en", "tr", "auto"],
                    default: "auto",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Transcription + structured recipe components",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        transcription: {
                          type: "object",
                          properties: {
                            text: { type: "string" },
                            languageCode: { type: "string" },
                            truncated: { type: "boolean" },
                            source: { type: "string", enum: ["audio", "video"] },
                          },
                        },
                        recipe: { type: "object" },
                      },
                    },
                  },
                },
              },
            },
          },
          "400": { description: "Missing file, invalid type, or file too large", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
          "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
          "500": { description: "Transcription or parsing failed", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
        },
      },
    },

    // ── Media ───────────────────────────────────────────────────────────────────
    "/media/upload": {
      post: {
        summary: "Upload an image or video file (cook/expert only)",
        tags: ["Media"],
        security: [bearerAuth],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["file"],
                properties: {
                  file: {
                    type: "string",
                    format: "binary",
                    description: "Images: JPEG/PNG/WebP max 10 MB. Videos: MP4/MOV max 100 MB.",
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Upload successful — returns the Supabase storage URL",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        url: { type: "string", format: "uri" },
                        type: { type: "string", enum: ["image", "video"] },
                      },
                    },
                  },
                },
              },
            },
          },
          "400": { description: "Invalid file type or size exceeded", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
          "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
        },
      },
    },

    // ── Tools ───────────────────────────────────────────────────────────────────
    "/tools": {
      get: {
        summary: "List or search cooking tools",
        tags: ["Tools & Units"],
        parameters: [
          { name: "search", in: "query", schema: { type: "string" }, description: "Turkish-aware partial match" },
        ],
        responses: {
          "200": {
            description: "Distinct tool names",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { type: "array", items: { type: "string" } },
                  },
                },
              },
            },
          },
        },
      },
    },

    // ── Units ───────────────────────────────────────────────────────────────────
    "/units": {
      get: {
        summary: "List or search measurement units",
        tags: ["Tools & Units"],
        parameters: [
          { name: "search", in: "query", schema: { type: "string" }, description: "Turkish-aware partial match" },
        ],
        responses: {
          "200": {
            description: "Distinct unit values",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { type: "array", items: { type: "string" } },
                  },
                },
              },
            },
          },
        },
      },
    },

    // ── Users ───────────────────────────────────────────────────────────────────
    "/users/me/favorites": {
      get: {
        summary: "List current user's favorited recipes",
        tags: ["Users"],
        security: [bearerAuth],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20, maximum: 100 } },
        ],
        responses: {
          "200": {
            description: "Paginated favorite recipes with allergen details",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        recipes: { type: "array", items: { $ref: "#/components/schemas/RecipeSummary" } },
                        pagination: { $ref: "#/components/schemas/Pagination" },
                      },
                    },
                  },
                },
              },
            },
          },
          "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
        },
      },
    },
    "/users/me/favorites/{recipeId}": {
      post: {
        summary: "Add a recipe to favorites",
        tags: ["Users"],
        security: [bearerAuth],
        parameters: [
          { name: "recipeId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          "201": { description: "Recipe added to favorites" },
          "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
          "404": { description: "Recipe not found or not published", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
          "409": { description: "Already in favorites", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
        },
      },
      delete: {
        summary: "Remove a recipe from favorites",
        tags: ["Users"],
        security: [bearerAuth],
        parameters: [
          { name: "recipeId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          "204": { description: "Removed from favorites" },
          "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
          "404": { description: "Favorite not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
        },
      },
    },
    "/users/me/drafts": {
      get: {
        summary: "List current user's draft recipes",
        tags: ["Users"],
        security: [bearerAuth],
        responses: {
          "200": {
            description: "Draft recipes ordered newest first",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { type: "array", items: { $ref: "#/components/schemas/RecipeSummary" } },
                  },
                },
              },
            },
          },
          "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
        },
      },
    },
  },

  tags: [
    { name: "Meta", description: "Health and service info" },
    { name: "Auth", description: "Registration, login, token management, profile" },
    { name: "Recipes", description: "Recipe CRUD, publish, ratings, media" },
    { name: "Comments", description: "Recipe comments" },
    { name: "Video Annotations", description: "Manual timestamp annotations on recipe videos" },
    { name: "Dish Genres", description: "Cuisine genre catalogue" },
    { name: "Dish Varieties", description: "Specific dish catalogue" },
    { name: "Ingredients", description: "Ingredient search and substitutions" },
    { name: "Allergens", description: "Allergen listing and detection" },
    { name: "Dietary Tags", description: "Dietary and allergen tag catalogue" },
    { name: "Discovery", description: "Filtered recipe discovery and location lookup" },
    { name: "Parse", description: "AI-powered recipe parsing from text and audio" },
    { name: "Media", description: "File upload" },
    { name: "Tools & Units", description: "Cooking tool and measurement unit lookup" },
    { name: "Users", description: "Favorites and drafts" },
    { name: "Admin", description: "Single-admin moderation surface: expert request review, user/recipe/comment moderation" },
  ],
};
