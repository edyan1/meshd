const crypto = require('crypto');
const mongoose = require('mongoose');
const Email = require('mongoose-type-mail');
const ObjectId = mongoose.Schema.Types.ObjectId;
require('mongoose-type-url');

const userSchema = new mongoose.Schema({
  email: { type: Email, unique: true },

  facebook: String,
  google: String,
  github: String,
  tokens: Array,

  profile: {
    name: String,

    //GENDER AND LOCATION REMOVED, OPTION TO REINCLUDE IF DESIRED
    //gender: String,
    //location: String,

    //website: mongoose.SchemaTypes.Url,
    website: String,
    picture: String,
    title: String,
    major: String,
    roles: {
        type: [String],
        enum: ['Coder', 'Designer', 'Scientist', 'Other'],
        default: 'None'
    },
    skills: [String],
    year: {
      type: String,
      enum: ['Freshman', 'Sophomore', 'Junior', 'Senior', "Master's", 'Doctorate', 'Other', 'Not Specified'],
      default: 'Not Specified'
    },
    degree: String,
    description: {
      type: String,
      maxlength: 1255
    }
  },

  looking: {
    type: Boolean,
    required: true,
    default: true
  },

  messages: [{
    from: {
      type: ObjectId,
      required: true,
      ref: 'User'
    },

    fromName: {
      type: String,
      required: true
    },

    message: {
      type: String,
      required: true,
      maxlength: 255,
      minlength: [1, "Messages must be non-empty"]
    },

    projectName: {
      type:String,
      required: true
    },

    projectId: {
      type: String,
      required: true
    }
  }]
}, { timestamps: true });

/**
 * Helper method for getting user's gravatar.
 */
userSchema.methods.gravatar = function gravatar(size) {
  if (!size) {
    size = 200;
  }
  if (!this.email) {
    return `https://gravatar.com/avatar/?s=${size}&d=retro`;
  }
  const md5 = crypto.createHash('md5').update(this.email).digest('hex');
  return `https://gravatar.com/avatar/${md5}?s=${size}&d=retro`;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
