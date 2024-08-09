import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const vedioSchema = new Schema({
    vedioFile: {
        type: String, // cloudnary url
        required: true
    },
    thumbnail: {
        type: String, // cloudnary url
        required: true
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    title: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    description: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    duration: {
        type: Number,
        required: true,
        index: true
    },
    views: {
        type: Number,
        required: true,
        default: 0
    },
    isPublished: {
        type: Boolean,
        required: true,
        default: true
    },
}, { timestamps: true })

vedioSchema.plugin(mongooseAggregatePaginate)

export const Vedio = mongoose.model("Vedio", vedioSchema)