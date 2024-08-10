import { asyncHandler } from '../utils/asyncHandler.js';

const registerUser = asyncHandler(async(req, res) => {
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
    const { email } = req.body;
    console.log('email', email);
    // const user = {
    //     name: req.body.name,
    //     email: req.body.email,
    //     password: req.body.password // Assuming password is hashed
    // }

    // Save the user to the database
    // Example: await User.create(user)

    res.status(200).json({
        message: 'User registered successfully'
    })
})

export { registerUser };