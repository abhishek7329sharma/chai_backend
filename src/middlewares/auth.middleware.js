import  jwt  from "jsonwebtoken"
import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/User.model.js"
import { ApiError } from "../utils/ApiError.js"

const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header('Authorization')?.replace('Bearer ', "")
        if (!token) {
            throw new ApiError(401, "Access denied. Please log in")
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id)
        .select('-password -refreshToken')
    
        if(!user) {
            throw new ApiError(401, "Access denied. Please log in")
        }
    
        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, "Access denied. Please log in")
    }
})

export { verifyJWT }