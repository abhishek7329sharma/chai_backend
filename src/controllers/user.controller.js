import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/User.model.js';
import { uploadOnCloudinary } from '../utils/cloudnary.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const generateAccessAndRefreshToken = async (userId) => {
    try {
      const user = await User.findById(userId);
      const accessToken = user.generateAccessToken()
      const refreshToken = user.generateRefreshToken()

      user.refreshToken = refreshToken
      user.accessToken = accessToken
      user.save({ validateBeforeSave: false })
      if (!user) {
        throw new ApiError(404, "User not found");
      }
      return {
        accessToken,
        refreshToken
      };
    } catch (error) {
        throw new ApiError(500, "Error generating access token")
    }
}
const registerUser = asyncHandler(async (req, res) => {
    // Steps to register a user
    // 1. Get user details from frontend
    // 2. Validate the request body
    // 3. Check if user already exists
    // 4. Check for images, check for avatar images
    // 5. upload them to cloudnary and 
    // 6. Create user object
    // 7. Remove password and refresh token feild from response
    // 8. Check for user creation
    // 9. Save the user to the database

    // Simulating user registration
    const { email, fullName, username, password } = req.body;

    if (
        [fullName, username, password, email].some((feild) =>
            feild?.trim() === "")
    ) {
        throw new ApiError(400, 'All fields are required')
    }

    // Check if user already exists
    const existedUser = await User.findOne({
        $or: [{ username, email }]
    })

    if (existedUser) {
        throw new ApiError(409, 'User already exists')
    }
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }


    // check for avatar
    if (!avatarLocalPath) {
        throw new ApiError(400, 'Please upload an avatar image')
    }

    // upload images to cloudnary
    // Example: const { secure_url: avatarUrl } = await cloudinary.uploader.upload(avatarLocalPath)
    // Example: const { secure_url: coverImageUrl } = await cloudinary.uploader.upload(coverImageLocalPath)
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(500, 'Failed to upload avatar image')
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || '',
        username: username.toLowerCase(),
        email,
        password,
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, 'Failed to create user')
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully"),
    )
})

const loginUser = asyncHandler(async (req, res) => {
    // Steps to login a user
    // 1. Get user details from frontend
    // 2. Validate the request body
    // 3. Check if user exists
    // 4. Check if password is correct
    // 5. Generate access token and refresh token
    // 6. Save refresh token to the database
    // 7. Send access token and refresh token to the frontend

    // Simulating user login
    const { email, password, username } = req.body;
    console.log(email, 'email');
    if (!email && !username) {
        throw new ApiError(400, 'Email and username are required')
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })
    console.log(user, 'user');

    if (!user) {
        throw new ApiError(404, 'User not found')
    }

    if (!user || !(await user.isPasswordCorrect(password))) {
        throw new ApiError(401, 'Invalid email or password')
    }
    const { refreshToken, accessToken} = await generateAccessAndRefreshToken(user._id)

    const loggedInuser = User.findById(user._id).select('-password -refreshToken')

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(200, {
            user: loggedInuser, accessToken,
            refreshToken,
            message: "User logged in successfully",
        }),
    )
    

  
})

const logoutUser = asyncHandler(async (req, res) => {
    // Steps to logout a user
    // 1. Get user from the request
    // 2. Clear the access token and refresh token from the cookies
    // 3. Update the user's refresh token field in the database
    // 4. Send a response to the frontend
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined,
            }
        },{
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }
    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(200, {}, "Loggedout User successfully"),
    )

})

export { registerUser, loginUser, logoutUser };