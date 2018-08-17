const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;

const projectSchema = new mongoose.Schema({
  admin: {
    type: ObjectId,
    ref: 'User',
    required: true
  },
  
  adminName: {
    type: String,
    required: true
  },

  members: [{
    type: ObjectId,
    ref: 'User',
    required: true,
  }],

  //users applying to a project
  applying: [{
    type: ObjectId,
    ref: 'User'
  }],

  name: {
    type: String,
    required: true
  },

  description: {
    type: String,
    required: true
  },

  //images: {
  //  type: [Buffer]
//    required: true
  //},
  image: String,

  recruiting: {
    skills: {
      type: [String]
    },

    interests: {
      type: [String]
    },

    needed: {
      type: Number,
      min: 0
    }
  },

  open: {
    type: Boolean,
    required: true,
    default: true
  },

  publicChat: [{
    userId: {
      type: ObjectId,
      ref: 'User',
      required: true
    },

    userName: {
      type: String,
      required: true
    },

    time: String,

    message: {
      type: String,
      required: true
    }

  }],

  privateChat: {
    type: ObjectId//,
//    required: true
  }

}, { timestamps: true });

const Project = mongoose.model('Project', projectSchema);

module.exports.Schema = projectSchema;
module.exports.Model = Project;
