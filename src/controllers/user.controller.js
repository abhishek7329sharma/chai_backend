import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/User.model.js';
import { uploadOnCloudinary } from '../utils/cloudnary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';

// Function to generate access and refresh tokens for a user
const generateAccessAndRefreshToken = async (userId) => {
    try {
        // Find the user by ID
        const user = await User.findById(userId);
        if (!user) {
            throw new ApiError(404, "User not found");
        }

        // Generate access and refresh tokens
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        // Update the user's tokens in the database
        user.refreshToken = refreshToken;
        user.accessToken = accessToken;
        await user.save({ validateBeforeSave: false });

        // Return the generated tokens
        return {
            accessToken,
            refreshToken
        };
    } catch (error) {
        throw new ApiError(500, "Error generating access token or refresh token");
    }
}

// Handler function to register a new user
const registerUser = asyncHandler(async (req, res) => {
    // 1. Extract user details from the request body
    const { email, fullName, username, password } = req.body;

    // 2. Validate that all required fields are provided
    if ([fullName, username, password, email].some(field => field?.trim() === "")) {
        throw new ApiError(400, 'All fields are required');
    }

    // 3. Check if a user with the same username or email already exists
    const existedUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existedUser) {
        throw new ApiError(409, 'User already exists');
    }

    // 4. Check for avatar and cover image files
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    // 5. Ensure avatar image is provided
    if (!avatarLocalPath) {
        throw new ApiError(400, 'Please upload an avatar image');
    }

    // 6. Upload images to Cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath) : null;

    if (!avatar) {
        throw new ApiError(500, 'Failed to upload avatar image');
    }

    // 7. Create the new user in the database
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || '',
        username: username.toLowerCase(),
        email,
        password,
    });

    // 8. Fetch the newly created user excluding sensitive fields
    const createdUser = await User.findById(user._id).select("-password -refreshToken");
    if (!createdUser) {
        throw new ApiError(500, 'Failed to create user');
    }

    // 9. Send success response
    return res.status(201).json(new ApiResponse(200, createdUser, "User registered successfully"));
});

// Handler function to log in a user
const loginUser = asyncHandler(async (req, res) => {
    // 1. Extract user details from the request body
    const { email, password, username } = req.body;

    // 2. Validate that either email or username is provided
    if (!email && !username) {
        throw new ApiError(400, 'Email or username is required');
    }

    // 3. Check if the user exists
    const user = await User.findOne({ $or: [{ username }, { email }] });
    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    // 4. Verify the provided password
    if (!(await user.isPasswordCorrect(password))) {
        throw new ApiError(401, 'Invalid password');
    }

    // 5. Generate access and refresh tokens
    const { refreshToken, accessToken } = await generateAccessAndRefreshToken(user._id);

    // 6. Fetch the user excluding sensitive fields
    const loggedInUser = await User.findById(user._id).select('-password -refreshToken');

    // 7. Set cookie options
    const options = {
        httpOnly: true,
        secure: true, // Ensure cookies are secure in production
    };

    // 8. Send the tokens and user data in the response
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "User logged in successfully"));
});

// Handler function to log out a user
const logoutUser = asyncHandler(async (req, res) => {
    // 1. Update the user's refresh token field in the database
    await User.findByIdAndUpdate(
        req.user._id,
        { $set: { refreshToken: undefined } },
        { new: true }
    );

    // 2. Set cookie options
    const options = {
        httpOnly: true,
        secure: true, // Ensure cookies are secure in production
    };

    // 3. Clear the access token and refresh token cookies
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "Logged out successfully"));
});

// Handler function to refresh an access token
const refreshAccessToken = asyncHandler(async (req, res) => {
    // 1. Extract refresh token from the request cookies
    const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    // 2. Validate that the refresh token is provided
    if (!incomingRefreshToken) {
        throw new ApiError(401, "UnAuthorized Request");
    }

    const decodedToken = jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
    )

    const user = await User.findById(decodedToken?._id)
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
        throw new ApiError(401, "Refresh token is expired");
    }
    try {

        // 3. Generate a new access token
        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

        // 4. Fetch the user excluding sensitive fields
        const refreshedUser = await User.findById(user._id).select('-password -refreshToken');

        // 5. Set cookie options
        const options = {
            httpOnly: true,
            secure: true, // Ensure cookies are secure in production
        };

        // 6. Send the new access token in the response
        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        accessToken,
                        refreshToken,
                    },
                    "Access token refreshed successfully"
                )
            );
    } catch (error) {
        throw new ApiError(401, error.message || 'Invalid access token')
    }
})

export { registerUser, loginUser, logoutUser, refreshAccessToken };
