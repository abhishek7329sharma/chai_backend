import mongoose, { Schema } from "mongoose";

const playlistSchema = new Schema({
    vedios: [
        {
            type: Schema.Types.ObjectId,
            ref: "Vedio",
            required: true,
        }
    ],
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    likedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
        trim: true,
    }
}, { timestamps: true })

export const Playlist = mongoose.model("Playlist", playlistSchema)