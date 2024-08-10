import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View Credentials' below to copy your API secret
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        //upload the file on cloudinary server
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto',
        });

        // file has been successfully uploaded
        console.log('File uploaded successfully:', response.url, response);
        return response;

        // Delete the local file
    } catch (error) {
        fs.unlinkSync(localFilePath);
        // remove the local saved temporary file as upload failed
        return null;
    }
}
export { uploadOnCloudinary }