import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

;(async function(localFilePath) {

    try {
        if(!localFilePath) return;

        //upload the file on cloudinary server
        const result = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto',
        });

        // file has been successfully uploaded
        console.log('File uploaded successfully:', result.url, result);
        return result; 

        // Delete the local file
    } catch (error) {
        fs.unlinkSync(localFilePath);
        // remove the local saved temporary file as upload failed
    }

    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View Credentials' below to copy your API secret
    });
    
    // Optimize delivery by resizing and applying auto-format and auto-quality
    const optimizeUrl = cloudinary.url('shoes', {
        fetch_format: 'auto',
        quality: 'auto'
    });
    
    console.log(optimizeUrl);
    
    // Transform the image: auto-crop to square aspect_ratio
    const autoCropUrl = cloudinary.url('shoes', {
        crop: 'auto',
        gravity: 'auto',
        width: 500,
        height: 500,
    });
    
    console.log(autoCropUrl);    
})();