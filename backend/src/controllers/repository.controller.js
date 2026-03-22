import { Repository } from "../models/repository.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { allowedRules } from "../utils/allowedRules.js";

/* ================= CREATE REPOSITORY ================= */

export const createRepository = asyncHandler(async (req, res) => {
  const { name, description, visibility } = req.body;

  if (!name || !name.trim()) {
    throw new ApiError(400, "Repository name is required");
  }

  const existingRepo = await Repository.findOne({
    name: name.trim(),
    owner: req.user._id
  });

  if (existingRepo) {
    throw new ApiError(409, "Repository with this name already exists");
  }

  const repository = await Repository.create({
    name: name.trim(),
    description,
    visibility,
    rules:{},
    owner: req.user._id
  });

  console.log("Is Map:", repository.rules instanceof Map);

  return res.status(201).json(
    new ApiResponse(
      201,
      repository,
      "Repository created successfully"
    )
  );
});

/* ================= GET REPOSITORIES ================= */

export const getRepositories = asyncHandler(async (req, res) => {

  const repositories = await Repository.find({
    $or: [
      { owner: req.user._id },
      { contributors: req.user._id },
      { visibility: "public" }
    ]
  })
  .populate("owner", "username email")
  .populate("contributors", "username email");

  return res.status(200).json(
    new ApiResponse(
      200,
      repositories,
      "Repositories fetched successfully"
    )
  );

});

/* ================= GET REPOSITORY BY ID ================= */

export const getRepositoryById = asyncHandler(async (req, res) => {

  const { repoId } = req.params;

  const repository = await Repository.findById(repoId)
    .populate("owner", "username email")
    .populate("contributors", "username email");

  if (!repository) {
    throw new ApiError(404, "Repository not found");
  }

  const isOwner = repository.owner._id.toString() === req.user._id.toString();

  const isContributor = repository.contributors.some(
    (contributor) => contributor._id.toString() === req.user._id.toString()
  );

  const isPublic = repository.visibility === "public";

  if (!isOwner && !isContributor && !isPublic) {
    throw new ApiError(403, "You do not have access to this repository");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      repository,
      "Repository fetched successfully"
    )
  );

});

/* ================= UPDATE REPOSITORY ================= */

// export const updateRepository = asyncHandler(async (req, res) => {

//   const { repoId } = req.params;

//   const {
//     name,
//     description,
//     visibility,
//     rulesToAdd,
//     rulesToUpdate,
//     rulesToDelete
//   } = req.body || {};

//   const repository = await Repository.findById(repoId);

//   if (!repository) {
//     throw new ApiError(404, "Repository not found");
//   }

//   /* ---------- OWNER CHECK ---------- */

//   if (repository.owner.toString() !== req.user._id.toString()) {
//     throw new ApiError(
//       403,
//       "Only repository owner can update this repository"
//     );
//   }

//   /* ---------- UPDATE NAME ---------- */

//   if (name !== undefined) {

//     if (!name.trim()) {
//       throw new ApiError(400, "Repository name cannot be empty");
//     }

//     const existingRepo = await Repository.findOne({
//       name: name.trim(),
//       owner: req.user._id,
//       _id: { $ne: repoId }
//     });

//     if (existingRepo) {
//       throw new ApiError(
//         409,
//         "Repository with this name already exists"
//       );
//     }

//     repository.name = name.trim();
//   }

//   /* ---------- UPDATE DESCRIPTION ---------- */

//   if (description !== undefined) {
//     repository.description = description;
//   }

//   /* ---------- UPDATE VISIBILITY ---------- */

//   if (visibility !== undefined) {

//     if (!["public", "private"].includes(visibility)) {
//       throw new ApiError(400, "Invalid repository visibility");
//     }

//     repository.visibility = visibility;
//   }

//   /* ---------- RULES: ADD ---------- */

//   if (rulesToAdd && Array.isArray(rulesToAdd)) {

//     for (const ruleObj of rulesToAdd) {

//       const { rule, value } = ruleObj;

//       if (!rule) {
//         throw new ApiError(400, "Rule name is required");
//       }

//       if (repository.rules.has(rule)) {
//         throw new ApiError(
//           400,
//           `Rule '${rule}' already exists`
//         );
//       }

//       repository.rules.set(rule, value);
//       repository.markModified("rules");
//     }
//   }

//   /* ---------- RULES: UPDATE ---------- */

//   if (rulesToUpdate && Array.isArray(rulesToUpdate)) {

//     for (const ruleObj of rulesToUpdate) {

//       const { rule, value } = ruleObj;

//       if (!repository.rules.has(rule)) {
//         throw new ApiError(
//           400,
//           `Rule '${rule}' does not exist and cannot be updated`
//         );
//       }

//       repository.rules.set(rule, value);
//       repository.markModified("rules");
//     }
//   }

//   /* ---------- RULES: DELETE ---------- */

  

//   /* ---------- RULES: DELETE ---------- */

// if (rulesToDelete && Array.isArray(rulesToDelete)) {

//   for (const rule of rulesToDelete) {
//     if (!repository.rules.has(rule)) {
//       throw new ApiError(
//         400,
//         `Rule '${rule}' does not exist and cannot be removed`
//       );
//     }
//   }

//   // Build $unset object to remove keys at DB level
//   const unsetFields = {};
//   for (const rule of rulesToDelete) {
//     unsetFields[`rules.${rule}`] = "";
//   }

//   await Repository.updateOne(
//     { _id: repoId },
//     { $unset: unsetFields }
//   );
// }
//   // Only save if there were non-delete changes
// const hasOtherChanges = 
//   name !== undefined || 
//   description !== undefined || 
//   visibility !== undefined || 
//   (rulesToAdd && rulesToAdd.length) || 
//   (rulesToUpdate && rulesToUpdate.length);

// if (hasOtherChanges) {
//   await repository.save();
// }

// // Fetch fresh data to return accurate response
// const updatedRepository = await Repository.findById(repoId)
//   .populate("owner", "username email")
//   .populate("contributors", "username email");

// return res.status(200).json(
//   new ApiResponse(
//     200,
//     updatedRepository,
//     "Repository updated successfully"
//   )
// );
  

// });

// export const updateRepository = asyncHandler(async (req, res) => {

//   const { repoId } = req.params;

//   const {
//     name,
//     description,
//     visibility,
//     rulesToAdd,
//     rulesToUpdate,
//     rulesToDelete
//   } = req.body || {};

//   const repository = await Repository.findById(repoId);

//   if (!repository) {
//     throw new ApiError(404, "Repository not found");
//   }

//   if (repository.owner.toString() !== req.user._id.toString()) {
//     throw new ApiError(403, "Only repository owner can update this repository");
//   }

//   const updateQuery = {};
//   const setFields = {};
//   const unsetFields = {};

//   /* ---------- UPDATE NAME ---------- */
//   if (name !== undefined) {
//     if (!name.trim()) throw new ApiError(400, "Repository name cannot be empty");

//     const existingRepo = await Repository.findOne({
//       name: name.trim(),
//       owner: req.user._id,
//       _id: { $ne: repoId }
//     });

//     if (existingRepo) throw new ApiError(409, "Repository with this name already exists");

//     setFields.name = name.trim();
//   }

//   /* ---------- UPDATE DESCRIPTION ---------- */
//   if (description !== undefined) {
//     setFields.description = description;
//   }

//   /* ---------- UPDATE VISIBILITY ---------- */
//   if (visibility !== undefined) {
//     if (!["public", "private"].includes(visibility)) {
//       throw new ApiError(400, "Invalid repository visibility");
//     }
//     setFields.visibility = visibility;
//   }

//   /* ---------- RULES: ADD ---------- */
//   if (rulesToAdd && Array.isArray(rulesToAdd)) {
//     for (const { rule, value } of rulesToAdd) {
//       if (!rule) throw new ApiError(400, "Rule name is required");
//       if (repository.rules.has(rule)) throw new ApiError(400, `Rule '${rule}' already exists`);
//       setFields[`rules.${rule}`] = value;
//     }
//   }

//   /* ---------- RULES: UPDATE ---------- */
//   if (rulesToUpdate && Array.isArray(rulesToUpdate)) {
//     for (const { rule, value } of rulesToUpdate) {
//       if (!repository.rules.has(rule)) {
//         throw new ApiError(400, `Rule '${rule}' does not exist and cannot be updated`);
//       }
//       setFields[`rules.${rule}`] = value;
//     }
//   }

//   /* ---------- RULES: DELETE ---------- */
//   if (rulesToDelete && Array.isArray(rulesToDelete)) {
//     for (const rule of rulesToDelete) {
//       if (!repository.rules.has(rule)) {
//         throw new ApiError(400, `Rule '${rule}' does not exist and cannot be removed`);
//       }
//       unsetFields[`rules.${rule}`] = "";
//     }
//   }

//   /* ---------- BUILD FINAL QUERY ---------- */
//   if (Object.keys(setFields).length > 0) updateQuery.$set = setFields;
//   if (Object.keys(unsetFields).length > 0) updateQuery.$unset = unsetFields;

//   await Repository.findByIdAndUpdate(repoId, updateQuery, { new: true });

//   const updatedRepository = await Repository.findById(repoId)
//     .populate("owner", "username email")
//     .populate("contributors", "username email");

//   return res.status(200).json(
//     new ApiResponse(200, updatedRepository, "Repository updated successfully")
//   );

// });


export const updateRepository = asyncHandler(async (req, res) => {

  const { repoId } = req.params;

  const {
    name,
    description,
    visibility,
    rulesToAdd,
    rulesToUpdate,
    rulesToDelete
  } = req.body || {};

  const repository = await Repository.findById(repoId);

  if (!repository) {
    throw new ApiError(404, "Repository not found");
  }

  if (repository.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Only repository owner can update this repository");
  }

  const setFields = {};
  const unsetFields = {};

  /* ---------- UPDATE NAME ---------- */
  if (name !== undefined) {
    if (!name.trim()) throw new ApiError(400, "Repository name cannot be empty");

    const existingRepo = await Repository.findOne({
      name: name.trim(),
      owner: req.user._id,
      _id: { $ne: repoId }
    });

    if (existingRepo) throw new ApiError(409, "Repository with this name already exists");
    setFields.name = name.trim();
  }

  /* ---------- UPDATE DESCRIPTION ---------- */
  if (description !== undefined) {
    setFields.description = description;
  }

  /* ---------- UPDATE VISIBILITY ---------- */
  if (visibility !== undefined) {
    if (!["public", "private"].includes(visibility)) {
      throw new ApiError(400, "Invalid repository visibility");
    }
    setFields.visibility = visibility;
  }

  /* ---------- RULES: ADD ---------- */
  if (rulesToAdd && Array.isArray(rulesToAdd)) {
    for (const { rule, value } of rulesToAdd) {
      if (!rule) throw new ApiError(400, "Rule name is required");

       /* ✅ Check Allowed Rule */
      if (!allowedRules[rule]) {
          throw new ApiError(400, `Rule '${rule}' is not supported`);
      }

      /* ✅ Type Validation */
      const expectedType = allowedRules[rule].type;
      if (typeof value !== expectedType) {
          throw new ApiError(
            400,
            `Invalid type for '${rule}', expected ${expectedType}`
          );
      }


      // Check if rule already exists in the plain object
      if (repository.rules && repository.rules[rule] !== undefined) {
        throw new ApiError(400, `Rule '${rule}' already exists`);
      }
      setFields[`rules.${rule}`] = value;
    }
  }

  /* ---------- RULES: UPDATE ---------- */
  if (rulesToUpdate && Array.isArray(rulesToUpdate)) {
    for (const { rule, value } of rulesToUpdate) {

      if (!allowedRules[rule]) {
          throw new ApiError(400, `Rule '${rule}' is not supported`);
      }

      const expectedType = allowedRules[rule].type;
        if (typeof value !== expectedType) {
          throw new ApiError(
            400,
            `Invalid type for '${rule}', expected ${expectedType}`
          );
        }

      if (!repository.rules || repository.rules[rule] === undefined) {
        throw new ApiError(400, `Rule '${rule}' does not exist and cannot be updated`);
      }
       
      /* 🔥 CORE FIX */
        if (value === false) {
          unsetFields[`rules.${rule}`] = "";
         } else {
          setFields[`rules.${rule}`] = value;
        }

      
      
    }
  }

  /* ---------- RULES: DELETE ---------- */
  if (rulesToDelete && Array.isArray(rulesToDelete)) {
    for (const rule of rulesToDelete) {
      if (!repository.rules || repository.rules[rule] === undefined) {
        throw new ApiError(400, `Rule '${rule}' does not exist and cannot be removed`);
      }
      unsetFields[`rules.${rule}`] = "";
      
    }
  }

  /* ---------- BUILD & EXECUTE QUERY ---------- */
  const updateQuery = {};
  if (Object.keys(setFields).length > 0) updateQuery.$set = setFields;
  if (Object.keys(unsetFields).length > 0) updateQuery.$unset = unsetFields;

  if (Object.keys(updateQuery).length > 0) {
    // await Repository.findByIdAndUpdate(repoId, updateQuery, { new: true });
    await Repository.findByIdAndUpdate(repoId, updateQuery, { returnDocument: 'after' });
  }

  const updatedRepository = await Repository.findById(repoId)
    .populate("owner", "username email")
    .populate("contributors", "username email");

  return res.status(200).json(
    new ApiResponse(200, updatedRepository, "Repository updated successfully")
  );

});


/* ================= DELETE REPOSITORY ================= */

export const deleteRepository = asyncHandler(async (req, res) => {

  const { repoId } = req.params;

  const repository = await Repository.findById(repoId);

  if (!repository) {
    throw new ApiError(404, "Repository not found");
  }

  /* ---------- OWNER PERMISSION CHECK ---------- */

  if (repository.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(
      403,
      "Only repository owner can delete this repository"
    );
  }

  await repository.deleteOne();

  return res.status(200).json(
    new ApiResponse(
      200,
      null,
      "Repository deleted successfully"
    )
  );

});

/* ================= GET REPO RULES ================= */
export const getRepositoryRules = asyncHandler(async (req, res) => {
  const { repoId } = req.params;

  const repository = await Repository.findById(repoId);

  if (!repository) {
    throw new ApiError(404, "Repository not found");
  }

  /* ---------- ACCESS CONTROL ---------- */
  const isOwner =
    repository.owner.toString() === req.user._id.toString();

  const isContributor = repository.contributors.some(
    (c) => c.toString() === req.user._id.toString()
  );

  const isPublic = repository.visibility === "public";

  if (!isOwner && !isContributor && !isPublic) {
    throw new ApiError(403, "Access denied");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        allowedRules,
        activeRules: repository.rules || {}
      },
      "Repository rules fetched successfully"
    )
  );
});