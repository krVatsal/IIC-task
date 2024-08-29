import { clientModel } from "../models/client.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config({
  path: "./.env",
});
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const JWT_SECRET = process.env.JWT_SECRET;

const generateAccessAndRefereshTokens = async (userId) => {
  try {
    const client = await clientModel.findById(userId);
    const accessToken = await client.generateAccessToken();
    const refreshToken = await client.generateRefreshToken();
    client.refreshToken = refreshToken;
    await client.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(400, "Failed to create access and refresh token");
  }
};

const registerClient = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if ([name, email, password].some((field) => field?.trim) === "") {
    throw new ApiError(500, "All fields are required");
  }
  const existingClient = await clientModel.findOne({ email });
  if (existingClient) {
    throw new ApiError(
      500,
      "Client already registered please go to login page"
    );
  }
  const newClient = await clientModel.create({ name, email, password });
  const createdClient = await clientModel
    .findById(newClient._id)
    .select("-password -refreshToken");
  if (!createdClient) {
    throw new ApiError(400, "Failed to create client");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, createdClient, "Client created successfully"));
});

const loginClient = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if ([email, password].some((field) => field?.trim) === "") {
    throw new ApiError(500, "All fields are required");
  }
  const checkClient = await clientModel.findOne({ email });
  if (!checkClient) {
    throw new ApiError(500, "client is not registered");
  }
  const correctPass = await checkClient.isPasswordCorrect(password);
  if (!correctPass) {
    throw new ApiError(500, "Invalid password");
  }
  const clientName = checkClient.name;
  const clientID = checkClient._id;
  const { refreshToken, accessToken } = await generateAccessAndRefereshTokens(
    checkClient._id
  );
  const loggedinClient = await clientModel
    .findById(checkClient._id)
    .select("-password -refreshToken");
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("refreshToken", refreshToken, options)
    .cookie("accessToken", accessToken, options)
    .json(
      new ApiResponse(
        200,
        {
          checkClient: loggedinClient,
          refreshToken,
          accessToken,
          clientName,
          clientID,
        },
        "Client logged in successfully"
      )
    );
});

const logoutClient = asyncHandler(async (req, res) => {
  await clientModel.findByIdAndUpdate(
    req.client._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "Client logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Failed to fetch refresh token");
  }
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const client = await clientModel.findById(decodedToken?._id);
    if (!client) {
      throw new ApiError(401, "Invalid refrsh token");
    }
    if (incomingRefreshToken !== client?.refreshToken) {
      throw new ApiError(401, "Refresh tken is either used or expired");
    }
    const options = {
      httpOnly: true,
      secure: true,
    };
    const { accessToken, newrefreshToken } =
      await generateAccessAndRefereshTokens(client._id);
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(400, "Invalid refersh token" || error?.message);
  }
});

const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if ([oldPassword, newPassword].some((field) => field?.trim) === "") {
    throw new ApiError(500, "All fields are required");
  }
  const client = await clientModel.findById(req.client?._id);
  const isPasswordCorrect = await client.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) {
    throw new ApiError(500, "Wrong old password entered");
  }
  client.password = newPassword;
  await client.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const loginGoogle = asyncHandler(async (req, res) => {
  const scope =
    "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email";
  const authUrl = `https://accounts.google.com/o/oauth2/auth?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=${scope}`;
  res.redirect(authUrl);
});

const googleCallback = asyncHandler(async (req, res) => {
  const code = req.query.code;
  if (!code) {
    throw new ApiError(400, "Authorization code not provided");
  }

  const tokenUrl = "https://oauth2.googleapis.com/token";

  try {
    // Exchange authorization code for access token
    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    if (!response.ok) {
      throw new ApiError(500, "Failed to exchange code for token");
    }

    const data = await response.json();
    const { id_token } = data;

    if (!id_token) {
      throw new ApiError(500, "Failed to get ID token from Google");
    }

    const userInfoUrl = `https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${id_token}`;
    const userInfoResponse = await fetch(userInfoUrl);

    if (!userInfoResponse.ok) {
      throw new ApiError(500, "Failed to fetch user info from Google");
    }

    const userInfo = await userInfoResponse.json();

    const jwtToken = jwt.sign(
      {
        sub: userInfo.sub,
        email: userInfo.email,
        name: userInfo.name,
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json(
      new ApiResponse(
        200,
        { token: jwtToken },
        "Google authentication successful"
      )
    );
  } catch (error) {
    console.error("Error during Google authentication:", error);
    throw new ApiError(500, "Failed to authenticate with Google");
  }
});

export {
  loginClient,
  registerClient,
  logoutClient,
  generateAccessAndRefereshTokens,
  refreshAccessToken,
  changePassword,
  loginGoogle,
  googleCallback,
};
